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
    get_finer_assessment_prompt,
    get_hedge_for_framework,
    FRAMEWORK_SCHEMAS,
    VALIDATED_HEDGES
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

    def _contains_hebrew(self, text: str) -> bool:
        """Check if text contains Hebrew characters"""
        if not isinstance(text, str):
            return False
        return any('\u0590' <= char <= '\u05FF' for char in text)

    async def _translate_to_english(self, text: str) -> str:
        """Translate Hebrew text to English using AI"""
        if not self._contains_hebrew(text):
            return text

        messages = [
            HumanMessage(content=f"""Translate this Hebrew text to English for use in a medical research context.
Return ONLY the English translation, nothing else.

Text: {text}""")
        ]

        response = await self._invoke_with_retry(self.gemini_flash, messages)
        return response.content.strip()

    async def _translate_framework_data(self, framework_data: Dict[str, Any]) -> Dict[str, Any]:
        """Translate all Hebrew values in framework_data to English"""
        translated = {}
        for key, value in framework_data.items():
            if isinstance(value, str) and self._contains_hebrew(value):
                translated[key] = await self._translate_to_english(value)
            else:
                translated[key] = value
        return translated

    def _generate_fallback_query(self, framework_data: Dict[str, Any], framework_type: str) -> str:
        """
        Generate a proper PubMed query from framework data when AI fails.
        Creates Boolean query with proper structure based on framework type.
        """
        # Map common framework keys to their role
        population_keys = ['population', 'P', 'patient', 'participants', 'condition', 'Co']
        intervention_keys = ['intervention', 'I', 'exposure', 'E', 'phenomenon', 'Ph']
        comparison_keys = ['comparison', 'C', 'control']
        outcome_keys = ['outcome', 'O', 'result', 'evaluation', 'Ev']

        def extract_search_terms(value: str) -> list:
            """Extract meaningful search terms from a value."""
            if not value or not isinstance(value, str):
                return []

            # Remove the research question if it's embedded
            if '?' in value and len(value) > 100:
                return []

            # Split on common delimiters
            terms = []
            clean_value = value.strip()

            # If it's a short phrase (likely a concept), use it directly
            if len(clean_value) < 80:
                # Remove parenthetical abbreviations for cleaner search
                import re
                clean_value = re.sub(r'\s*\([^)]*\)\s*', ' ', clean_value).strip()
                if clean_value:
                    terms.append(clean_value)

            return terms

        # Collect terms by category
        population_terms = []
        intervention_terms = []
        comparison_terms = []
        outcome_terms = []

        for key, value in framework_data.items():
            key_lower = key.lower()
            extracted = extract_search_terms(value)

            if any(pk.lower() in key_lower for pk in population_keys):
                population_terms.extend(extracted)
            elif any(ik.lower() in key_lower for ik in intervention_keys):
                intervention_terms.extend(extracted)
            elif any(ck.lower() in key_lower for ck in comparison_keys):
                comparison_terms.extend(extracted)
            elif any(ok.lower() in key_lower for ok in outcome_keys):
                outcome_terms.extend(extracted)

        # Build query parts
        query_parts = []

        if population_terms:
            p_query = " OR ".join([f'"{t}"[tiab]' for t in population_terms[:2]])
            query_parts.append(f'({p_query})')

        if intervention_terms:
            i_query = " OR ".join([f'"{t}"[tiab]' for t in intervention_terms[:2]])
            query_parts.append(f'({i_query})')

        if comparison_terms:
            c_query = " OR ".join([f'"{t}"[tiab]' for t in comparison_terms[:2]])
            query_parts.append(f'({c_query})')

        if outcome_terms:
            o_query = " OR ".join([f'"{t}"[tiab]' for t in outcome_terms[:2]])
            query_parts.append(f'({o_query})')

        if query_parts:
            return " AND ".join(query_parts)
        else:
            # Last resort: use any non-empty values
            all_terms = []
            for value in framework_data.values():
                if value and isinstance(value, str) and len(value.strip()) < 50:
                    all_terms.append(f'"{value.strip()}"[tiab]')
            if all_terms:
                return " AND ".join(all_terms[:3])
            return ""

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

        # Translate framework data to English if needed (PubMed requires English)
        english_framework_data = await self._translate_framework_data(framework_data)

        # Build the request with translated data
        framework_text = "\n".join([
            f"- {key}: {value}"
            for key, value in english_framework_data.items()
            if value  # Only include non-empty values
        ])

        # Get recommended hedge for this framework type
        hedge = get_hedge_for_framework(framework_type)
        hedge_info = ""
        if hedge:
            hedge_info = f"""
For the clinical_filtered query, use this validated filter:
{hedge['name']}: {hedge['query']}
(Source: {hedge['citation']})"""

        # Use a focused prompt that emphasizes JSON output
        query_prompt = f"""You are a PubMed search expert. Create search queries for this {framework_type} framework:

{framework_text}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no explanations outside JSON.

JSON Structure Required:
{{
  "message": "Brief description of the search strategy (1-2 sentences)",
  "concepts": [
    {{"component": "P", "terms": ["elderly[tiab]", "aged[tiab]", "\\"Aged\\"[Mesh]"]}}
  ],
  "queries": {{
    "broad": "(population terms) AND (intervention terms)",
    "focused": "(population terms) AND (intervention terms) AND (outcome terms)",
    "clinical_filtered": "focused query AND clinical trial filter"
  }},
  "toolbox": [
    {{"label": "Limit to Last 5 Years", "query": "AND (2020:2025[dp])"}},
    {{"label": "English Only", "query": "AND English[lang]"}},
    {{"label": "Exclude Animals", "query": "NOT (animals[mh] NOT humans[mh])"}}
  ]
}}

Query Building Rules:
1. Each concept = (synonym1[tiab] OR synonym2[tiab] OR "MeSH Term"[Mesh])
2. Combine concepts with AND
3. Use truncation: child* (matches child, children, childhood)
4. Quote multi-word terms: "heart failure"[tiab]
5. Boolean operators MUST be UPPERCASE: AND, OR, NOT
{hedge_info}

Generate professional PubMed queries now. Return ONLY the JSON object."""

        messages = [
            HumanMessage(content=query_prompt)
        ]

        # Get response from Gemini (using flash for speed)
        response = await self._invoke_with_retry(self.gemini_flash, messages)

        # Parse JSON response with robust extraction
        result = self._extract_json(response.content, find_object=True)

        if result and "queries" in result:
            # Ensure framework_type and framework_data are included
            result["framework_type"] = framework_type
            result["framework_data"] = english_framework_data  # Use English version

            # Ensure required fields exist
            if "message" not in result:
                result["message"] = "Query strategy generated successfully."
            if "concepts" not in result:
                result["concepts"] = []
            if "toolbox" not in result:
                result["toolbox"] = []

            # Ensure queries has required fields
            queries = result.get("queries", {})
            if isinstance(queries, dict):
                if "broad" not in queries:
                    queries["broad"] = ""
                if "focused" not in queries:
                    queries["focused"] = ""
                if "clinical_filtered" not in queries:
                    queries["clinical_filtered"] = ""
                result["queries"] = queries

            return result
        else:
            # Log the raw response for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to parse query response: {response.content[:500] if response.content else 'Empty response'}")

            # Generate fallback query from framework data
            fallback_query = self._generate_fallback_query(english_framework_data, framework_type)

            return {
                "message": "Query generated using simplified strategy. For best results, try regenerating.",
                "concepts": [],
                "queries": {
                    "broad": fallback_query,
                    "focused": fallback_query,
                    "clinical_filtered": fallback_query
                },
                "toolbox": [
                    {"label": "Limit to Last 5 Years", "query": 'AND ("2020/01/01"[Date - Publication] : "3000"[Date - Publication])'},
                    {"label": "English Language Only", "query": "AND English[lang]"},
                    {"label": "Exclude Animal Studies", "query": "NOT (animals[mh] NOT humans[mh])"}
                ],
                "framework_type": framework_type,
                "framework_data": english_framework_data
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
        # Get the FINER assessment prompt
        prompt = get_finer_assessment_prompt(
            research_question=research_question,
            framework_type=framework_type,
            framework_data=framework_data,
            language=language
        )

        messages = [HumanMessage(content=prompt)]

        # Get response from Gemini Flash (fast evaluation)
        response = await self._invoke_with_retry(self.gemini_flash, messages)

        # Parse JSON response
        result = self._extract_json(response.content, find_object=True)

        if result and "F" in result and "overall" in result:
            return result
        else:
            # Fallback if parsing fails
            return {
                "F": {"score": "medium", "reason": "Unable to fully assess feasibility"},
                "I": {"score": "medium", "reason": "Unable to fully assess interest"},
                "N": {"score": "medium", "reason": "Unable to fully assess novelty"},
                "E": {"score": "high", "reason": "No obvious ethical concerns"},
                "R": {"score": "medium", "reason": "Unable to fully assess relevance"},
                "overall": "revise",
                "suggestions": ["Please try again with a clearer research question"]
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
