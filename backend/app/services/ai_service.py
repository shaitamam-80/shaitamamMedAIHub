"""
MedAI Hub - AI Service
Handles interactions with Google Gemini via LangChain
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import Dict, Any, List, Optional
import json
import re
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core.exceptions import ResourceExhausted
from app.core.config import settings
from app.core.prompts import (
    get_define_system_prompt,
    get_extraction_prompt,
    get_query_system_prompt,
    FRAMEWORK_SCHEMAS
)


class AIService:
    """Service for AI operations using Google Gemini"""

    def __init__(self):
        # Rate limiting: max 5 concurrent API calls
        self._semaphore = asyncio.Semaphore(5)

        # Initialize Gemini models
        # Using gemini-2.5-flash for all tasks (best balance of speed and quality)
        # Note: gemini-1.5-* models are deprecated, use gemini-2.5-flash instead
        self.gemini_pro = ChatGoogleGenerativeAI(
            model=settings.GEMINI_PRO_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

        self.gemini_flash = ChatGoogleGenerativeAI(
            model=settings.GEMINI_FLASH_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(ResourceExhausted)
    )
    async def _invoke_with_retry(self, model, messages):
        """
        Invoke model with rate limiting and automatic retry on ResourceExhausted.

        Args:
            model: The Gemini model to use
            messages: List of messages to send

        Returns:
            Model response
        """
        async with self._semaphore:
            return await model.ainvoke(messages)

    def _extract_json(self, text: str, find_object: bool = True) -> Optional[Dict[str, Any]]:
        """
        Robustly extract JSON from AI response text.

        Args:
            text: Response text that may contain JSON
            find_object: If True, look for {...}. If False, look for [...]

        Returns:
            Parsed JSON object/array or None
        """
        try:
            if find_object:
                # Find first { and last }
                json_start = text.find("{")
                json_end = text.rfind("}") + 1
            else:
                # Find first [ and last ]
                json_start = text.find("[")
                json_end = text.rfind("]") + 1

            if json_start >= 0 and json_end > json_start:
                json_str = text[json_start:json_end]
                return json.loads(json_str)

            # Try parsing the whole text
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
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

        # Use the new extraction prompt
        system_prompt = get_extraction_prompt(conversation, framework_type)

        # Simple one-shot extraction
        messages = [HumanMessage(content=system_prompt)]

        # Get response from Gemini Flash (faster for extraction)
        response = await self._invoke_with_retry(self.gemini_flash, messages)

        # Parse JSON response
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

        # Use the new define system prompt with language
        system_prompt = get_define_system_prompt(framework_type, language=language)

        messages = [SystemMessage(content=system_prompt)]

        # Add conversation history - extract only chat_response to avoid pollution
        for msg in conversation_history:
            content = msg["content"]

            # If content is JSON with chat_response, extract it
            if isinstance(content, str) and content.strip().startswith("{"):
                try:
                    parsed = json.loads(content)
                    if "chat_response" in parsed:
                        content = parsed["chat_response"]
                except json.JSONDecodeError:
                    pass  # Use original content

            if msg["role"] == "user":
                messages.append(HumanMessage(content=content))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=content))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Get response from Gemini Flash
        response = await self._invoke_with_retry(self.gemini_flash, messages)

        # Parse the hybrid JSON response
        result = self._extract_json(response.content, find_object=True)

        if result and "chat_response" in result and "framework_data" in result:
            return result
        else:
            # Fallback if AI didn't follow format
            return {
                "chat_response": response.content,
                "framework_data": {}
            }

    async def generate_pubmed_query(
        self,
        framework_data: Dict[str, Any],
        framework_type: str
    ) -> Dict[str, Any]:
        """
        Generate comprehensive PubMed search strategy from framework data.

        Args:
            framework_data: Extracted framework fields
            framework_type: Framework name

        Returns:
            Dict with message, concepts, queries, toolbox, framework_type, framework_data
        """

        # Use the new query system prompt
        system_prompt = get_query_system_prompt(framework_type)

        # Build the request
        framework_text = "\n".join([
            f"**{key}:** {value}"
            for key, value in framework_data.items()
            if value  # Only include non-empty values
        ])

        user_message = f"""Generate a comprehensive PubMed search strategy for this {framework_type} framework:

{framework_text}

Return the complete JSON structure as specified in your instructions."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ]

        # Get response from Gemini (using flash for speed)
        response = await self._invoke_with_retry(self.gemini_flash, messages)

        # Parse JSON response with robust extraction
        result = self._extract_json(response.content, find_object=True)

        if result and "message" in result and "concepts" in result and "queries" in result:
            # Ensure framework_type and framework_data are included
            result["framework_type"] = framework_type
            result["framework_data"] = framework_data

            # Ensure toolbox exists (even if empty)
            if "toolbox" not in result:
                result["toolbox"] = []

            return result
        else:
            # Fallback structure if parsing fails
            return {
                "message": "Failed to generate query strategy. Please try again.",
                "concepts": [],
                "queries": {
                    "broad": "",
                    "focused": "",
                    "clinical_filtered": ""
                },
                "toolbox": [],
                "framework_type": framework_type,
                "framework_data": framework_data
            }

    async def analyze_abstract_batch(
        self, abstracts: List[Dict[str, Any]], criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Analyze a batch of abstracts for inclusion/exclusion

        Args:
            abstracts: List of abstracts with pmid, title, abstract
            criteria: Inclusion/exclusion criteria (from framework_data)

        Returns:
            List of decisions with reasoning
        """

        # Build prompt with criteria
        criteria_text = json.dumps(criteria, indent=2)

        prompt = f"""You are screening research abstracts for a systematic review.

INCLUSION CRITERIA:
{criteria_text}

For each abstract below, determine if it should be INCLUDED or EXCLUDED.
Provide brief reasoning for your decision.

Abstracts:
"""

        for idx, abstract in enumerate(abstracts, 1):
            prompt += f"""
{idx}. PMID: {abstract.get('pmid', 'N/A')}
   Title: {abstract.get('title', 'N/A')}
   Abstract: {abstract.get('abstract', 'N/A')[:500]}...

"""

        prompt += """
Return your analysis as a JSON array with this structure:
[
  {
    "pmid": "12345",
    "decision": "include" or "exclude",
    "reasoning": "Brief explanation"
  },
  ...
]

Return ONLY valid JSON, no additional text."""

        messages = [HumanMessage(content=prompt)]

        # Use Gemini Pro for batch analysis (better reasoning)
        response = await self._invoke_with_retry(self.gemini_pro, messages)

        # Parse JSON response
        results = self._extract_json(response.content, find_object=False)
        return results if results else []


# Global instance
ai_service = AIService()
