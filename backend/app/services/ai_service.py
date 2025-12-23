"""
MedAI Hub - AI Service
Handles interactions with Google Gemini via LangChain
"""

import asyncio
import json
import re
from typing import Any

from google.api_core.exceptions import ResourceExhausted
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.prompts import (
    get_define_system_prompt,
    get_extraction_prompt,
    get_finer_assessment_prompt,
    get_query_system_prompt,
)
from app.core.search_config import PICO_PRIORITY


class AIService:
    """Service for AI operations using Google Gemini"""

    def __init__(self):
        # Rate limiting: max 5 concurrent API calls
        self._semaphore = asyncio.Semaphore(5)
        self._gemini_pro: ChatGoogleGenerativeAI | None = None
        self._gemini_flash: ChatGoogleGenerativeAI | None = None

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
                raise ValueError(
                    "GOOGLE_API_KEY is not set. Please configure it in environment variables."
                )
            self._gemini_flash = ChatGoogleGenerativeAI(
                model=settings.GEMINI_FLASH_MODEL,
                google_api_key=api_key,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
            )
        return self._gemini_flash

    @retry(
        stop=stop_after_attempt(2),  # Reduced from 3 for faster failure
        wait=wait_exponential(multiplier=1, min=1, max=5),  # Faster retry
        retry=retry_if_exception_type(ResourceExhausted),
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
                return await asyncio.wait_for(model.ainvoke(messages), timeout=timeout_seconds)
            except TimeoutError:
                logger.error(f"AI request timed out after {timeout_seconds}s")
                raise
            except ResourceExhausted as e:
                logger.warning(f"API quota exhausted, retry will occur: {e}")
                raise  # Will be retried by @retry decorator
            except Exception as e:
                logger.error(f"Unexpected error during AI invocation: {type(e).__name__}: {e}")
                raise

    def _extract_json(self, text: str, find_object: bool = True) -> dict[str, Any] | None:
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
        self, conversation: list[dict[str, str]], framework_type: str
    ) -> dict[str, Any]:
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
        conversation_history: list[dict[str, str]],
        framework_type: str,
        language: str = "en",
    ) -> dict[str, Any]:
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

        if result and "chat_response" in result:
            # Return all parsed fields including formulated_questions and finer_assessment
            return {
                "chat_response": result.get("chat_response", ""),
                "framework_data": result.get("framework_data", {}),
                "formulated_questions": result.get("formulated_questions"),
                "finer_assessment": result.get("finer_assessment"),
            }
        else:
            # Fallback if AI didn't follow format
            return {"chat_response": response.content, "framework_data": {}}

    def _contains_hebrew(self, text: str) -> bool:
        """Check if text contains Hebrew characters"""
        if not isinstance(text, str):
            return False
        return any("\u0590" <= char <= "\u05ff" for char in text)

    async def _translate_to_english(self, text: str) -> str:
        """Translate Hebrew text to English using AI"""
        if not self._contains_hebrew(text):
            return text

        messages = [
            HumanMessage(
                content=f"""Translate this Hebrew text to English for use in a medical research context.
Return ONLY the English translation, nothing else.

Text: {text}"""
            )
        ]

        response = await self._invoke_with_retry(self.gemini_flash, messages)
        return response.content.strip()

    async def _translate_framework_data(self, framework_data: dict[str, Any]) -> dict[str, Any]:
        """Translate all Hebrew values in framework_data to English in ONE API call"""
        import logging

        logger = logging.getLogger(__name__)

        # Find which fields need translation
        fields_to_translate = {
            key: value
            for key, value in framework_data.items()
            if isinstance(value, str) and self._contains_hebrew(value)
        }

        if not fields_to_translate:
            return framework_data.copy()

        logger.info(f"Translating {len(fields_to_translate)} Hebrew fields to English")

        # Translate all fields in one API call
        fields_text = "\n".join([f"{key}: {value}" for key, value in fields_to_translate.items()])

        messages = [
            HumanMessage(
                content=f"""Translate these Hebrew medical research terms to English.
Return ONLY a JSON object with the same keys and English translations.
Do NOT include any Hebrew characters in your response.

{fields_text}

Example response format:
{{"population": "Adults with diabetes", "intervention": "Exercise therapy"}}"""
            )
        ]

        result = framework_data.copy()

        try:
            response = await self._invoke_with_retry(self.gemini_flash, messages)
            translations = self._extract_json(response.content, find_object=True)

            if translations:
                # Merge translations with original data
                result.update(translations)

                # Verify no Hebrew remains - if it does, translate field by field
                still_hebrew = {
                    k: v
                    for k, v in result.items()
                    if isinstance(v, str) and self._contains_hebrew(v)
                }

                if still_hebrew:
                    logger.warning(
                        f"Hebrew still present after batch translation: {list(still_hebrew.keys())}"
                    )
                    # Force translate each remaining Hebrew field
                    for key, value in still_hebrew.items():
                        try:
                            translated = await self._force_translate_single(value)
                            if not self._contains_hebrew(translated):
                                result[key] = translated
                            else:
                                # Last resort: transliterate or use generic placeholder
                                result[key] = f"[{key} - see original]"
                                logger.error(f"Could not translate field {key}, using placeholder")
                        except TimeoutError:
                            logger.error(f"Single field translation timed out for {key}")
                            result[key] = f"[{key} - translation timeout]"
                        except Exception as e:
                            logger.error(
                                f"Single field translation failed for {key}: {type(e).__name__}: {e}"
                            )
                            result[key] = f"[{key} - see original]"

                return result
        except TimeoutError:
            logger.error("Batch translation timed out, attempting field-by-field translation")
            # Fallback: translate each field individually
            for key, value in fields_to_translate.items():
                try:
                    translated = await self._force_translate_single(value)
                    if not self._contains_hebrew(translated):
                        result[key] = translated
                except TimeoutError:
                    logger.error(f"Individual translation timed out for {key}")
                except Exception as e2:
                    logger.error(
                        f"Individual translation failed for {key}: {type(e2).__name__}: {e2}"
                    )
        except json.JSONDecodeError as e:
            logger.error(f"Translation response was not valid JSON: {e}")
            # Fallback: translate each field individually
            for key, value in fields_to_translate.items():
                try:
                    translated = await self._force_translate_single(value)
                    if not self._contains_hebrew(translated):
                        result[key] = translated
                except Exception as e2:
                    logger.error(
                        f"Individual translation failed for {key}: {type(e2).__name__}: {e2}"
                    )
        except Exception as e:
            logger.error(f"Unexpected translation error: {type(e).__name__}: {e}")
            # Fallback: translate each field individually
            for key, value in fields_to_translate.items():
                try:
                    translated = await self._force_translate_single(value)
                    if not self._contains_hebrew(translated):
                        result[key] = translated
                except Exception as e2:
                    logger.error(
                        f"Individual translation failed for {key}: {type(e2).__name__}: {e2}"
                    )

        return result

    async def _force_translate_single(self, hebrew_text: str) -> str:
        """Force translate a single Hebrew text to English"""
        messages = [
            HumanMessage(
                content=f"""Translate this Hebrew text to English medical terminology.
Return ONLY the English translation. No Hebrew characters allowed.

Hebrew: {hebrew_text}

English translation:"""
            )
        ]

        response = await self._invoke_with_retry(self.gemini_flash, messages, timeout_seconds=10)
        return response.content.strip()

    async def translate_framework_to_english(
        self, framework_data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Public method for translating framework data to English.

        This is a lightweight method for use with the new programmatic
        query builder that only needs translation, not full query generation.

        Args:
            framework_data: Dict with framework components (may contain Hebrew)

        Returns:
            Dict with all values translated to English
        """
        import logging

        logger = logging.getLogger(__name__)

        # Find which fields need translation
        fields_to_translate = {
            key: value
            for key, value in framework_data.items()
            if isinstance(value, str) and self._contains_hebrew(value)
        }

        if not fields_to_translate:
            logger.info("No Hebrew detected, returning original framework data")
            return framework_data.copy()

        logger.info(f"Translating {len(fields_to_translate)} Hebrew fields to English")

        # Use batch translation for efficiency
        return await self._translate_framework_data(framework_data)

    def generate_simple_fallback_query(
        self, framework_data: dict[str, Any], framework_type: str
    ) -> str:
        """
        Public method to generate a simple fallback query.
        Used when Query Builder/MeSH API fails.

        This is a synchronous, no-external-API method that creates
        a basic Boolean query from framework data.

        Args:
            framework_data: Framework data dict
            framework_type: Framework name (PICO, PEO, etc.)

        Returns:
            Simple PubMed query string
        """
        return self._generate_fallback_query(framework_data, framework_type)

    def build_fallback_response(
        self,
        fallback_query: str,
        framework_type: str,
        framework_data: dict[str, Any],
        reason: str = "api_failure",
    ) -> dict[str, Any]:
        """
        Public method to build a complete V2 response structure from a fallback query.
        Used when Query Builder/MeSH API fails.

        This ensures the frontend always receives a valid JSON response
        even when external APIs fail.

        Args:
            fallback_query: The generated fallback query string
            framework_type: Framework name
            framework_data: Framework data
            reason: Reason for fallback

        Returns:
            Complete V2 response dict with legacy compatibility
        """
        translation_status = {
            "success": False,
            "fields_translated": [],
            "fields_failed": [],
            "method": "simple_fallback",
        }
        warnings = [
            {
                "code": "FALLBACK_USED",
                "message": f"Using simplified fallback due to: {reason}",
                "severity": "warning",
            }
        ]

        return self._build_fallback_response(
            fallback_query, framework_type, framework_data, translation_status, warnings, reason
        )

    def _build_fallback_response(
        self,
        fallback_query: str,
        framework_type: str,
        framework_data: dict[str, Any],
        translation_status: dict[str, Any],
        warnings: list[dict[str, str]],
        reason: str,
    ) -> dict[str, Any]:
        """
        Build a standardized fallback response when AI generation fails.

        Args:
            fallback_query: The generated fallback query string
            framework_type: Framework name
            framework_data: Framework data
            translation_status: Translation status dict
            warnings: List of warning messages
            reason: Reason for fallback (timeout, error, etc.)

        Returns:
            Complete response dict with V2 and legacy fields
        """
        reason_messages = {
            "timeout": "Query generation timed out. Using simplified fallback strategy.",
            "quota_exceeded": "API quota exceeded. Using simplified fallback strategy.",
            "error": "An error occurred during generation. Using simplified fallback strategy.",
            "hebrew_detected": "Hebrew characters detected in query. Using English-only fallback.",
            "parse_failed": "Failed to parse AI response. Using simplified fallback strategy.",
        }

        message = reason_messages.get(reason, "Using fallback query generation strategy.")

        # Basic toolbox
        basic_toolbox = [
            {
                "category": "Publication Date",
                "label": "Last 5 Years",
                "query": 'AND ("2020/01/01"[Date - Publication] : "3000"[Date - Publication])',
                "description": "Limit to articles published in the last 5 years",
            },
            {
                "category": "Language",
                "label": "English Only",
                "query": "AND English[lang]",
                "description": "Limit to English language publications",
            },
            {
                "category": "Study Design",
                "label": "Exclude Animal Studies",
                "query": "NOT (animals[mh] NOT humans[mh])",
                "description": "Exclude animal-only studies",
            },
            {
                "category": "Article Type",
                "label": "Systematic Reviews",
                "query": "AND (systematic review[pt] OR meta-analysis[pt])",
                "description": "Limit to systematic reviews and meta-analyses",
            },
            {
                "category": "Article Type",
                "label": "Randomized Controlled Trials",
                "query": "AND (randomized controlled trial[pt] OR randomized[tiab])",
                "description": "Limit to RCTs",
            },
        ]

        # Generate concepts from framework_data so UI isn't empty
        # Use centralized mappings for consistency
        key_to_label = {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "E": "Exposure",
            "S": "Study Design",
            "T": "Timeframe",
            "population": "Population",
            "intervention": "Intervention",
            "comparator": "Comparison",
            "comparison": "Comparison",
            "outcome": "Outcome",
            "exposure": "Exposure",
        }
        # Map full-word keys to single letters for PICO_PRIORITY lookup
        key_normalization = {
            "population": "P",
            "intervention": "I",
            "comparator": "C",
            "comparison": "C",
            "outcome": "O",
            "exposure": "E",
            "timeframe": "T",
            "study": "S",
            "factor": "F",
        }

        concepts = []
        for key, value in framework_data.items():
            if not value or key.lower() in ["research_question", "framework_type"]:
                continue
            # Normalize key to single letter for consistent priority lookup
            if len(key) == 1:
                normalized_key = key.upper()
            else:
                normalized_key = key_normalization.get(key.lower(), key[0].upper())
            label = key_to_label.get(key, key_to_label.get(key.lower(), key.title()))
            concepts.append(
                {
                    "concept_number": PICO_PRIORITY.get(
                        normalized_key, 99
                    ),  # Use centralized priority
                    "component": label,
                    "key": normalized_key,
                    "label": label,
                    "original_value": value,
                    "mesh_terms": [],
                    "free_text_terms": [f'"{value}"[tiab]'],
                    "entry_terms": [],
                }
            )

        # Sort by concept_number (PICO order using centralized priority)
        concepts.sort(key=lambda c: c["concept_number"])

        # Build V2 response structure
        return {
            # V2 fields
            "report_intro": f"This is a simplified search strategy for your {framework_type} framework. {message}",
            "concepts": concepts,  # NOW POPULATED from framework_data
            "strategies": {
                "comprehensive": {
                    "name": "Fallback Query (Basic Boolean)",
                    "purpose": "Simplified search when advanced generation fails",
                    "formula": "Basic AND combination of framework components",
                    "query": fallback_query,
                    "expected_yield": "Variable",
                    "use_cases": ["Emergency fallback", "Basic searches"],
                },
                "direct": {
                    "name": "Same as Comprehensive (Fallback)",
                    "purpose": "Simplified search",
                    "formula": "Same as comprehensive",
                    "query": fallback_query,
                    "expected_yield": "Variable",
                    "use_cases": ["Fallback mode"],
                },
                "clinical": {
                    "name": "Same as Comprehensive (Fallback)",
                    "purpose": "Simplified search",
                    "formula": "Same as comprehensive",
                    "query": fallback_query,
                    "query_broad": fallback_query,
                    "query_narrow": fallback_query,
                    "expected_yield": "Variable",
                    "use_cases": ["Fallback mode"],
                },
            },
            "toolbox": basic_toolbox,
            "formatted_report": f"# Fallback Search Strategy\n\n{message}\n\n## Query\n\n```\n{fallback_query}\n```\n\nFor best results, please try regenerating with more specific framework data.",
            # Legacy compatibility
            "queries": {
                "broad": fallback_query,
                "focused": fallback_query,
                "clinical_filtered": fallback_query,
            },
            "message": message,
            # Metadata
            "framework_type": framework_type,
            "framework_data": framework_data,
            # Transparency
            "translation_status": translation_status,
            "warnings": warnings,
        }

    def _generate_fallback_query(self, framework_data: dict[str, Any], framework_type: str) -> str:
        """
        Generate a proper PubMed query from framework data when AI fails.
        Creates Boolean query with proper structure based on framework type.
        """
        import logging

        logger = logging.getLogger(__name__)

        logger.info(
            f"Generating fallback query for {framework_type} with data: {list(framework_data.keys())}"
        )

        def extract_search_terms(value: str) -> list:
            """Extract meaningful search terms from a value."""
            if not value or not isinstance(value, str):
                return []

            # Remove the research question if it's embedded
            if "?" in value and len(value) > 100:
                return []

            # Split on common delimiters
            terms = []
            clean_value = value.strip()

            # If it's a short phrase (likely a concept), use it directly
            if len(clean_value) < 80:
                # Remove parenthetical abbreviations for cleaner search
                clean_value = re.sub(r"\s*\([^)]*\)\s*", " ", clean_value).strip()
                if clean_value:
                    terms.append(clean_value)

            return terms

        def matches_category(key: str, exact_keys: list, partial_keys: list) -> bool:
            """Check if key matches category by exact match or partial match."""
            key_upper = key.strip().upper()
            key_lower = key.strip().lower()

            # Exact match for single letter keys
            if key_upper in exact_keys:
                return True

            # Partial match for longer keys
            return any(pk.lower() in key_lower for pk in partial_keys)

        # Collect terms by category using better matching
        population_terms = []
        intervention_terms = []
        comparison_terms = []
        outcome_terms = []

        for key, value in framework_data.items():
            extracted = extract_search_terms(value)
            if not extracted:
                continue

            # Population: P, population, patient, participants, sample
            if matches_category(
                key, ["P"], ["population", "patient", "participant", "sample", "condition"]
            ):
                population_terms.extend(extracted)
                logger.debug(f"Population match: {key} -> {extracted}")
            # Intervention: I, intervention, exposure, treatment
            elif matches_category(
                key, ["I", "E"], ["intervention", "exposure", "treatment", "phenomenon"]
            ):
                intervention_terms.extend(extracted)
                logger.debug(f"Intervention match: {key} -> {extracted}")
            # Comparison: C, comparison, control, comparator
            elif matches_category(key, ["C"], ["comparison", "control", "comparator"]):
                comparison_terms.extend(extracted)
                logger.debug(f"Comparison match: {key} -> {extracted}")
            # Outcome: O, outcome, result
            elif matches_category(key, ["O"], ["outcome", "result", "evaluation"]):
                outcome_terms.extend(extracted)
                logger.debug(f"Outcome match: {key} -> {extracted}")

        # Build query parts
        query_parts = []

        if population_terms:
            p_query = " OR ".join([f'"{t}"[tiab]' for t in population_terms[:2]])
            query_parts.append(f"({p_query})")

        if intervention_terms:
            i_query = " OR ".join([f'"{t}"[tiab]' for t in intervention_terms[:2]])
            query_parts.append(f"({i_query})")

        if comparison_terms:
            c_query = " OR ".join([f'"{t}"[tiab]' for t in comparison_terms[:2]])
            query_parts.append(f"({c_query})")

        if outcome_terms:
            o_query = " OR ".join([f'"{t}"[tiab]' for t in outcome_terms[:2]])
            query_parts.append(f"({o_query})")

        if query_parts:
            final_query = " AND ".join(query_parts)
            logger.info(
                f"Generated fallback query with {len(query_parts)} parts: {final_query[:200]}..."
            )
            return final_query
        else:
            # Last resort: use any non-empty values
            logger.warning(
                "No categorized terms found, using last resort for framework_data values"
            )
            all_terms = []
            for key, value in framework_data.items():
                if (
                    value
                    and isinstance(value, str)
                    and len(value.strip()) < 80
                    and len(value.strip()) > 2
                ):
                    # Skip keys that are likely metadata
                    if key.lower() not in ["research_question", "framework_type", "project_id"]:
                        all_terms.append(f'"{value.strip()}"[tiab]')
                        logger.info(f"Last resort term from {key}: {value[:50]}")
            if all_terms:
                final_query = " AND ".join(all_terms[:4])
                logger.info(f"Last resort query: {final_query}")
                return final_query
            logger.error("Could not generate any fallback query - no usable terms found")
            return ""

    async def generate_pubmed_query(
        self, framework_data: dict[str, Any], framework_type: str
    ) -> dict[str, Any]:
        """
        Generate comprehensive PubMed search strategy from framework data.

        Args:
            framework_data: Extracted framework fields
            framework_type: Framework name

        Returns:
            Dict with V2 format (report_intro, concepts, strategies, toolbox, formatted_report)
            AND legacy format (queries, message) for backward compatibility
        """
        import logging

        logger = logging.getLogger(__name__)

        # Track translation status for transparency
        translation_status = {
            "success": False,
            "fields_translated": [],
            "fields_failed": [],
            "method": "none_needed",
        }
        warnings = []

        # Translate framework data to English if needed (PubMed requires English)
        fields_needing_translation = [
            key
            for key, value in framework_data.items()
            if isinstance(value, str) and self._contains_hebrew(value)
        ]

        if fields_needing_translation:
            try:
                english_framework_data = await self._translate_framework_data(framework_data)

                # Check which fields were successfully translated
                successfully_translated = []
                failed_translation = []

                for key in fields_needing_translation:
                    if key in english_framework_data:
                        if self._contains_hebrew(str(english_framework_data[key])):
                            failed_translation.append(key)
                        else:
                            successfully_translated.append(key)

                translation_status = {
                    "success": len(failed_translation) == 0,
                    "fields_translated": successfully_translated,
                    "fields_failed": failed_translation,
                    "method": "batch" if successfully_translated else "failed",
                }

                if failed_translation:
                    warnings.append(
                        {
                            "code": "TRANSLATION_PARTIAL",
                            "message": f"Some fields could not be translated to English: {', '.join(failed_translation)}",
                            "severity": "warning",
                        }
                    )
            except Exception as e:
                logger.error(f"Translation failed: {e}")
                english_framework_data = framework_data
                translation_status["method"] = "failed"
                warnings.append(
                    {
                        "code": "TRANSLATION_FAILED",
                        "message": "Translation service failed, using original text",
                        "severity": "error",
                    }
                )
        else:
            english_framework_data = framework_data
            translation_status["success"] = True

        # Build the request with translated data
        framework_text = "\n".join(
            [
                f"- **{key}**: {value}"
                for key, value in english_framework_data.items()
                if value  # Only include non-empty values
            ]
        )

        # Use the new V2 prompt from query.py
        system_prompt = get_query_system_prompt(framework_type)

        # Add the user's framework data to the prompt
        user_prompt = f"""Generate a professional search strategy report for this {framework_type} framework:

{framework_text}

Return a complete JSON object following the V2 structure with report_intro, concepts, strategies, toolbox, and formatted_report.
IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no explanations outside JSON."""

        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]

        # Get response from Gemini with timeout (increased to 45s for complex prompts)
        try:
            response = await self._invoke_with_retry(
                self.gemini_flash, messages, timeout_seconds=45
            )
        except TimeoutError:
            logger.error(f"Query generation timed out after 45s for framework {framework_type}")
            warnings.append(
                {
                    "code": "TIMEOUT",
                    "message": "Query generation timed out, using fallback strategy",
                    "severity": "warning",
                }
            )
            # Return fallback immediately on timeout
            fallback_query = self._generate_fallback_query(english_framework_data, framework_type)
            return self._build_fallback_response(
                fallback_query,
                framework_type,
                english_framework_data,
                translation_status,
                warnings,
                "timeout",
            )
        except ResourceExhausted as e:
            logger.error(f"API quota exhausted during query generation: {e}")
            warnings.append(
                {
                    "code": "QUOTA_EXCEEDED",
                    "message": "API quota exceeded, using fallback strategy",
                    "severity": "error",
                }
            )
            fallback_query = self._generate_fallback_query(english_framework_data, framework_type)
            return self._build_fallback_response(
                fallback_query,
                framework_type,
                english_framework_data,
                translation_status,
                warnings,
                "quota_exceeded",
            )
        except Exception as e:
            logger.error(f"Query generation failed with unexpected error: {type(e).__name__}: {e}")
            warnings.append(
                {
                    "code": "UNEXPECTED_ERROR",
                    "message": f"Unexpected error: {type(e).__name__}",
                    "severity": "error",
                }
            )
            # Return fallback immediately on error
            fallback_query = self._generate_fallback_query(english_framework_data, framework_type)
            return self._build_fallback_response(
                fallback_query,
                framework_type,
                english_framework_data,
                translation_status,
                warnings,
                "error",
            )

        # Parse JSON response with robust extraction
        result = self._extract_json(response.content, find_object=True)

        # Try to parse V2 format first
        if result and "strategies" in result:
            # V2 format detected - process and add backward compatibility
            logger.info("V2 format response detected")

            # Extract strategies
            strategies = result.get("strategies", {})
            comprehensive = strategies.get("comprehensive", {})
            direct = strategies.get("direct", {})
            clinical = strategies.get("clinical", {})

            # Build legacy queries dict for backward compatibility
            legacy_queries = {
                "broad": comprehensive.get("query", ""),
                "focused": direct.get("query", ""),
                "clinical_filtered": clinical.get("query_broad", clinical.get("query", "")),
            }

            # Validate no Hebrew in queries
            has_hebrew_in_query = False
            for query_type, query_text in legacy_queries.items():
                if isinstance(query_text, str) and self._contains_hebrew(query_text):
                    has_hebrew_in_query = True
                    logger.error(f"Hebrew detected in {query_type} query - using fallback")
                    warnings.append(
                        {
                            "code": "HEBREW_DETECTED",
                            "message": f"Hebrew characters detected in {query_type} query",
                            "severity": "error",
                        }
                    )
                    break

            if has_hebrew_in_query:
                # Generate clean English-only fallback query
                fallback_query = self._generate_fallback_query(
                    english_framework_data, framework_type
                )
                return self._build_fallback_response(
                    fallback_query,
                    framework_type,
                    english_framework_data,
                    translation_status,
                    warnings,
                    "hebrew_detected",
                )

            # Build complete V2 response with legacy compatibility
            return {
                # V2 fields
                "report_intro": result.get(
                    "report_intro", "Search strategy report generated successfully."
                ),
                "concepts": result.get("concepts", []),
                "strategies": strategies,
                "toolbox": result.get("toolbox", []),
                "formatted_report": result.get("formatted_report", ""),
                # Legacy compatibility fields
                "queries": legacy_queries,
                "message": result.get("report_intro", "Query strategy generated successfully.")[
                    :200
                ],  # Truncate for legacy
                # Metadata
                "framework_type": framework_type,
                "framework_data": english_framework_data,
                "research_question": framework_data.get("research_question"),
                # New transparency fields
                "translation_status": translation_status,
                "warnings": warnings,
            }

        # Try legacy format (old response structure)
        elif result and "queries" in result:
            logger.info("Legacy format response detected, converting to V2")

            # Ensure framework_type and framework_data are included
            result["framework_type"] = framework_type
            result["framework_data"] = english_framework_data

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

            # Validate no Hebrew in queries
            has_hebrew_in_query = False
            for query_type, query_text in queries.items():
                if isinstance(query_text, str) and self._contains_hebrew(query_text):
                    has_hebrew_in_query = True
                    logger.error(f"Hebrew detected in {query_type} query - using fallback")
                    warnings.append(
                        {
                            "code": "HEBREW_DETECTED",
                            "message": f"Hebrew characters detected in {query_type} query",
                            "severity": "error",
                        }
                    )
                    break

            if has_hebrew_in_query:
                # Generate clean English-only fallback query
                fallback_query = self._generate_fallback_query(
                    english_framework_data, framework_type
                )
                result["queries"] = {
                    "broad": fallback_query,
                    "focused": fallback_query,
                    "clinical_filtered": fallback_query,
                }
                result["message"] = (
                    "Query regenerated to ensure English-only terms for PubMed compatibility."
                )
                warnings.append(
                    {
                        "code": "FALLBACK_USED",
                        "message": "Fallback query used due to Hebrew detection",
                        "severity": "warning",
                    }
                )

            # Add transparency fields
            result["translation_status"] = translation_status
            result["warnings"] = warnings

            return result

        else:
            # Failed to parse - use fallback
            logger.error(
                f"Failed to parse query response: {response.content[:500] if response.content else 'Empty response'}"
            )
            warnings.append(
                {
                    "code": "PARSE_FAILED",
                    "message": "Failed to parse AI response, using fallback",
                    "severity": "error",
                }
            )

            # Generate fallback query from framework data
            fallback_query = self._generate_fallback_query(english_framework_data, framework_type)
            return self._build_fallback_response(
                fallback_query,
                framework_type,
                english_framework_data,
                translation_status,
                warnings,
                "parse_failed",
            )

    async def assess_finer(
        self,
        research_question: str,
        framework_type: str,
        framework_data: dict[str, Any],
        language: str = "en",
    ) -> dict[str, Any]:
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
            language=language,
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
                "suggestions": ["Please try again with a clearer research question"],
            }

    async def analyze_abstract_batch(
        self, abstracts: list[dict[str, Any]], criteria: dict[str, Any]
    ) -> list[dict[str, Any]]:
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
{idx}. PMID: {abstract.get("pmid", "N/A")}
   Title: {abstract.get("title", "N/A")}
   Abstract: {abstract.get("abstract", "N/A")[:500]}...

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

    async def decompose_to_mesh_concepts(
        self, framework_data: dict[str, str], framework_type: str
    ) -> dict[str, list[str]]:
        """
        Decompose framework components into individual MeSH-searchable concepts.

        For example:
        "Adults with generalized anxiety disorder" -> ["Adults", "Generalized Anxiety Disorder"]

        This allows each concept to be searched separately in the MeSH database.

        Args:
            framework_data: Dict with framework components (P, I, C, O, etc.)
            framework_type: Framework type (PICO, PEO, etc.)

        Returns:
            Dict mapping component keys to lists of decomposed MeSH concepts
        """
        import logging

        logger = logging.getLogger(__name__)

        # Filter out empty values and special keys
        components = {
            key: value
            for key, value in framework_data.items()
            if value and key.lower() not in ["research_question", "framework_type"]
        }

        if not components:
            return {}

        # Build prompt
        components_text = "\n".join([f"- {key}: {value}" for key, value in components.items()])

        prompt = f"""You are a medical librarian expert in MeSH (Medical Subject Headings) terminology.

TASK: Decompose each research component into individual concepts that can be searched in MeSH.

IMPORTANT RULES:
1. Break down composite phrases into separate searchable terms
2. Each term should be a potential MeSH descriptor (official medical terminology)
3. Do NOT keep phrases like "Adults with X" - split into "Adults" AND "X"
4. Use FULL medical terminology, NOT abbreviations (e.g., "Cognitive Behavioral Therapy" not "CBT")
5. Common abbreviations like SSRIs, GAD should be expanded to their full form
6. If input contains both abbreviation and full term, use ONLY the full term
7. AVOID REDUNDANCY: Do NOT output generic terms (like "Anxiety") that duplicate or overlap with the condition in P. For outcomes, focus on MEASURABLE outcomes (e.g., "Treatment Outcome", "Efficacy", "Remission") not symptoms that overlap with the condition.

Framework type: {framework_type}

Components to decompose:
{components_text}

Return ONLY a JSON object where each key maps to an array of individual MeSH-searchable concepts.

Example:
Input: "P": "Adults with generalized anxiety disorder"
Output: "P": ["Adult", "Generalized Anxiety Disorder"]

Input: "I": "Cognitive-Behavioral Therapy (CBT)"
Output: "I": ["Cognitive Behavioral Therapy"]

Input: "C": "SSRIs or benzodiazepines"
Output: "C": ["Selective Serotonin Reuptake Inhibitors", "Benzodiazepines"]

Input: "O": "Anxiety symptoms, daily functioning, long-term outcomes"
Output: "O": ["Activities of Daily Living", "Treatment Outcome", "Efficacy"]
(Note: "Anxiety" is redundant with condition in P, so we use measurable outcomes only)

Return JSON:"""

        try:
            messages = [HumanMessage(content=prompt)]
            response = await self._invoke_with_retry(
                self.gemini_flash, messages, timeout_seconds=20
            )

            result = self._extract_json(response.content, find_object=True)

            if result:
                # Validate and clean the result
                cleaned = {}
                for key, terms in result.items():
                    if isinstance(terms, list):
                        # Filter out empty strings
                        cleaned[key] = [
                            t.strip() for t in terms if isinstance(t, str) and t.strip()
                        ]

                logger.info(f"Decomposed {len(cleaned)} components into MeSH concepts")
                return cleaned
            else:
                logger.warning("AI returned invalid JSON for MeSH decomposition")
                return {}

        except TimeoutError:
            logger.warning("Timeout decomposing to MeSH concepts")
            return {}
        except Exception as e:
            logger.warning(f"Error decomposing to MeSH concepts: {e}")
            return {}

    async def generate_free_text_terms(
        self, framework_data: dict[str, str], framework_type: str
    ) -> dict[str, list[str]]:
        """
        Generate free-text search terms for each framework component using AI.

        This complements MeSH terms by suggesting:
        - Synonyms and variations
        - Common abbreviations
        - Related terminology
        - Spelling variations (UK/US)

        Args:
            framework_data: Dict with framework components (P, I, C, O, etc.)
            framework_type: Framework type (PICO, PEO, etc.)

        Returns:
            Dict mapping component keys to lists of free-text terms
        """
        import logging

        logger = logging.getLogger(__name__)

        # Filter out empty values and special keys
        components = {
            key: value
            for key, value in framework_data.items()
            if value and key.lower() not in ["research_question", "framework_type"]
        }

        if not components:
            return {}

        # Build prompt
        components_text = "\n".join([f"- {key}: {value}" for key, value in components.items()])

        prompt = f"""You are a medical librarian expert in PubMed search strategies.

For each research component below, generate 3-6 free-text search terms that would help find relevant articles in PubMed.

Include:
- Synonyms and alternative phrasings
- Common abbreviations (e.g., CBT for Cognitive Behavioral Therapy, GAD for Generalized Anxiety Disorder)
- Spelling variations (UK/US spelling)
- Related but distinct terms

Do NOT include:
- Very broad or generic terms
- Terms that would retrieve irrelevant results

Framework type: {framework_type}

Components:
{components_text}

Return ONLY a JSON object mapping each component key to an array of free-text terms.
Format terms for PubMed [tiab] search (no quotes needed, I'll add them).

Example response:
{{
  "P": ["elderly patients", "older adults", "geriatric population", "aged 65 and over"],
  "I": ["CBT", "cognitive therapy", "behavioral therapy", "psychotherapy"],
  "O": ["depression symptoms", "depressive disorder", "mood improvement"]
}}"""

        try:
            messages = [HumanMessage(content=prompt)]
            response = await self._invoke_with_retry(
                self.gemini_flash, messages, timeout_seconds=20
            )

            result = self._extract_json(response.content, find_object=True)

            if result:
                # Validate and clean the result
                cleaned = {}
                for key, terms in result.items():
                    if isinstance(terms, list):
                        # Filter out empty strings and limit to 6 terms
                        cleaned[key] = [
                            t.strip() for t in terms if isinstance(t, str) and t.strip()
                        ][:6]

                logger.info(f"Generated free-text terms for {len(cleaned)} components")
                return cleaned
            else:
                logger.warning("AI returned invalid JSON for free-text terms")
                return {}

        except TimeoutError:
            logger.warning("Timeout generating free-text terms")
            return {}
        except Exception as e:
            logger.warning(f"Error generating free-text terms: {e}")
            return {}

    async def analyze_abstract_gems(
        self,
        abstract_text: str,
        title: str,
        framework_data: dict[str, str],
        criteria_codes: list[str],
        review_type: str = "systematic",
    ) -> dict[str, Any]:
        """
        Analyze an abstract using GEMS methodology (Layer B - AI Analysis).

        Args:
            abstract_text: The abstract to analyze
            title: Article title
            framework_data: PICO/PEO/SPIDER data (e.g., {"P": "Adults", "I": "Exercise"})
            criteria_codes: Selected criteria codes (e.g., ["P1", "I1", "S2"])
            review_type: "systematic", "scoping", or "quick"

        Returns:
            {
                "status": "included" | "excluded" | "unclear",
                "reason": "Explanation of decision",
                "evidence_quote": "Verbatim quote from abstract supporting decision",
                "study_type": "RCT" | "Cohort" | "Case-Control" | "Review" | etc.,
                "confidence": 0.0-1.0
            }
        """
        import logging

        logger = logging.getLogger(__name__)

        # Import screening prompts
        from app.core.prompts.screening import get_criteria_text_for_prompt, get_screening_prompt

        # Validate inputs
        if not abstract_text or not title:
            logger.warning("Missing abstract or title for AI analysis")
            return {
                "status": "unclear",
                "reason": "Missing abstract or title for analysis",
                "evidence_quote": "",
                "study_type": "Other",
                "confidence": 0.0,
            }

        # Get framework type from framework_data or default
        framework_type = framework_data.get("framework_type", "PICO")

        try:
            # Build criteria text from codes
            criteria_text = get_criteria_text_for_prompt(criteria_codes)

            # Build complete screening prompt
            prompt = get_screening_prompt(
                abstract_text=abstract_text,
                title=title,
                framework_data=framework_data,
                framework_type=framework_type,
                criteria_text=criteria_text,
                review_type=review_type,
            )

            # Send to AI with timeout (30s for screening)
            messages = [HumanMessage(content=prompt)]
            response = await self._invoke_with_retry(
                self.gemini_flash, messages, timeout_seconds=30
            )

            # Parse JSON response
            result = self._extract_json(response.content, find_object=True)

            if result and "status" in result:
                # Validate and normalize response
                status = result.get("status", "unclear").lower()
                if status not in ["included", "excluded", "unclear"]:
                    status = "unclear"

                # Ensure confidence is a float between 0 and 1
                confidence = result.get("confidence", 0.5)
                if isinstance(confidence, (int, float)):
                    confidence = max(0.0, min(1.0, float(confidence)))
                else:
                    confidence = 0.5

                # Truncate evidence quote if too long
                evidence_quote = result.get("evidence_quote", "")
                if len(evidence_quote) > 200:
                    evidence_quote = evidence_quote[:197] + "..."

                return {
                    "status": status,
                    "reason": result.get("reason", "AI analysis completed"),
                    "evidence_quote": evidence_quote,
                    "study_type": result.get("study_type", "Other"),
                    "confidence": confidence,
                }
            else:
                # Failed to parse - return unclear
                logger.warning(f"Failed to parse AI screening response: {response.content[:200]}")
                return {
                    "status": "unclear",
                    "reason": "AI returned invalid response format",
                    "evidence_quote": "",
                    "study_type": "Other",
                    "confidence": 0.0,
                }

        except TimeoutError:
            logger.error(f"AI screening timed out for PMID title: {title[:50]}")
            return {
                "status": "unclear",
                "reason": "AI analysis timed out - needs manual review",
                "evidence_quote": "",
                "study_type": "Other",
                "confidence": 0.0,
            }
        except ResourceExhausted as e:
            logger.error(f"API quota exhausted during screening: {e}")
            return {
                "status": "unclear",
                "reason": "API quota exceeded - needs manual review",
                "evidence_quote": "",
                "study_type": "Other",
                "confidence": 0.0,
            }
        except Exception as e:
            logger.error(f"Unexpected error during AI screening: {type(e).__name__}: {e}")
            return {
                "status": "unclear",
                "reason": f"AI analysis error: {type(e).__name__}",
                "evidence_quote": "",
                "study_type": "Other",
                "confidence": 0.0,
            }


# Global instance
ai_service = AIService()
