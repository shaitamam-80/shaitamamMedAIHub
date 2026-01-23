"""
MedAI Hub - AI Service
Handles interactions with Google Gemini via LangChain
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import Dict, Any, List, Optional
import json
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core.exceptions import ResourceExhausted
from app.core.config import settings
from app.core.prompts import (
    get_define_system_prompt,
    get_extraction_prompt,
    get_finer_assessment_prompt,
    FRAMEWORK_SCHEMAS,
)


class AIService:
    """Service for AI operations using Google Gemini"""

    def __init__(self):
        # Rate limiting: max 5 concurrent API calls
        self._semaphore = asyncio.Semaphore(5)
        self._gemini_pro: Optional[ChatGoogleGenerativeAI] = None
        self._gemini_flash: Optional[ChatGoogleGenerativeAI] = None

    @property
    def gemini_pro(self) -> ChatGoogleGenerativeAI:
        """Lazy initialization of Gemini Pro model"""
        if self._gemini_pro is None:
            self._gemini_pro = ChatGoogleGenerativeAI(
                model=settings.GEMINI_PRO_MODEL,
                google_api_key=settings.GOOGLE_API_KEY,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
            )
        return self._gemini_pro

    @property
    def gemini_flash(self) -> ChatGoogleGenerativeAI:
        """Lazy initialization of Gemini Flash model"""
        if self._gemini_flash is None:
            api_key = settings.GOOGLE_API_KEY
            if not api_key:
                raise ValueError("GOOGLE_API_KEY is not set. Please configure it in environment variables.")
            self._gemini_flash = ChatGoogleGenerativeAI(
                model=settings.GEMINI_FLASH_MODEL,
                google_api_key=api_key,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
            )
        return self._gemini_flash

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type(ResourceExhausted)
    )
    async def _invoke_with_retry(self, model, messages, timeout_seconds: int = 30):
        """
        Invoke model with rate limiting, timeout, and automatic retry.

        Args:
            model: The Gemini model to use
            messages: List of messages to send
            timeout_seconds: Maximum time to wait for response

        Returns:
            Model response

        Raises:
            asyncio.TimeoutError: If request exceeds timeout
            ResourceExhausted: If API quota is exceeded (retried automatically)
        """
        import logging
        logger = logging.getLogger(__name__)

        async with self._semaphore:
            try:
                return await asyncio.wait_for(
                    model.ainvoke(messages),
                    timeout=timeout_seconds
                )
            except asyncio.TimeoutError:
                logger.error(f"AI request timed out after {timeout_seconds}s")
                raise
            except ResourceExhausted as e:
                logger.warning(f"API quota exhausted, retry will occur: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error during AI invocation: {type(e).__name__}: {e}")
                raise

    def _extract_json(self, text: str, find_object: bool = True) -> Optional[Dict[str, Any]]:
        """
        Robustly extract JSON from AI response text.

        Args:
            text: Response text that may contain JSON
            find_object: If True, look for {...}. If False, look for [...]

        Returns:
            Parsed JSON object/array or None
        """
        import logging
        logger = logging.getLogger(__name__)

        try:
            if find_object:
                json_start = text.find("{")
                json_end = text.rfind("}") + 1
            else:
                json_start = text.find("[")
                json_end = text.rfind("]") + 1

            if json_start >= 0 and json_end > json_start:
                json_str = text[json_start:json_end]
                return json.loads(json_str)

            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error: {e}. Text preview: {text[:200]}")
            return None
        except ValueError as e:
            logger.warning(f"Value error during JSON extraction: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during JSON extraction: {type(e).__name__}: {e}")
            return None

    async def extract_framework_data(
        self, conversation: List[Dict[str, str]], framework_type: str
    ) -> Dict[str, Any]:
        """
        Analyze conversation and extract structured framework data

        Args:
            conversation: List of chat messages with 'role' and 'content'
            framework_type: Type of framework (PICO, CoCoPop, etc.)

        Returns:
            Dictionary with extracted framework fields
        """
        system_prompt = get_extraction_prompt(conversation, framework_type)
        messages = [HumanMessage(content=system_prompt)]
        response = await self._invoke_with_retry(self.gemini_flash, messages)
        extracted_data = self._extract_json(response.content, find_object=True)
        return extracted_data if extracted_data else {}

    async def chat_for_define(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        framework_type: str,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Handle chat interaction for the Define tool with hybrid JSON output.

        Args:
            message: User's message
            conversation_history: Previous conversation (only chat_response parts)
            framework_type: Selected framework type
            language: Response language ("en" or "he")

        Returns:
            Dict with 'chat_response' and 'framework_data'
        """
        system_prompt = get_define_system_prompt(framework_type, language=language)
        messages = [SystemMessage(content=system_prompt)]

        for msg in conversation_history:
            content = msg["content"]

            if isinstance(content, str) and content.strip().startswith("{"):
                try:
                    parsed = json.loads(content)
                    if "chat_response" in parsed:
                        content = parsed["chat_response"]
                except json.JSONDecodeError:
                    pass

            if msg["role"] == "user":
                messages.append(HumanMessage(content=content))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=message))
        response = await self._invoke_with_retry(self.gemini_flash, messages)
        result = self._extract_json(response.content, find_object=True)

        if result and "chat_response" in result:
            return {
                "chat_response": result.get("chat_response", ""),
                "framework_data": result.get("framework_data", {}),
                "formulated_questions": result.get("formulated_questions"),
                "finer_assessment": result.get("finer_assessment"),
            }
        else:
            return {
                "chat_response": response.content,
                "framework_data": {}
            }

    async def assess_finer(
        self,
        research_question: str,
        framework_type: str,
        framework_data: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Evaluate a research question using the FINER criteria.

        Args:
            research_question: The formulated research question to evaluate
            framework_type: The framework used (PICO, CoCoPop, etc.)
            framework_data: The extracted framework components
            language: Response language ("en" or "he")

        Returns:
            Dict with FINER scores, overall assessment, and suggestions
        """
        prompt = get_finer_assessment_prompt(
            research_question=research_question,
            framework_type=framework_type,
            framework_data=framework_data,
            language=language
        )

        messages = [HumanMessage(content=prompt)]
        response = await self._invoke_with_retry(self.gemini_flash, messages)
        result = self._extract_json(response.content, find_object=True)

        if result and "F" in result and "overall" in result:
            return result
        else:
            return {
                "F": {"score": "medium", "reason": "Unable to fully assess feasibility"},
                "I": {"score": "medium", "reason": "Unable to fully assess interest"},
                "N": {"score": "medium", "reason": "Unable to fully assess novelty"},
                "E": {"score": "high", "reason": "No obvious ethical concerns"},
                "R": {"score": "medium", "reason": "Unable to fully assess relevance"},
                "overall": "revise",
                "suggestions": ["Please try again with a clearer research question"]
            }


# Global instance
ai_service = AIService()
