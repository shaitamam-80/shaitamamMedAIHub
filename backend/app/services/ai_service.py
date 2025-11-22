"""
MedAI Hub - AI Service
Handles interactions with Google Gemini via LangChain
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import Dict, Any, List, Optional
import json
from app.core.config import settings


class AIService:
    """Service for AI operations using Google Gemini"""

    def __init__(self):
        # Initialize Gemini Pro for heavy lifting
        self.gemini_pro = ChatGoogleGenerativeAI(
            model=settings.GEMINI_PRO_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

        # Initialize Gemini Flash for speed
        self.gemini_flash = ChatGoogleGenerativeAI(
            model=settings.GEMINI_FLASH_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

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

        # Build the system prompt based on framework type
        system_prompt = self._build_extraction_prompt(framework_type)

        # Convert conversation to LangChain messages
        messages = [SystemMessage(content=system_prompt)]

        for msg in conversation:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # Add extraction request
        messages.append(
            HumanMessage(
                content="Based on our conversation, extract the framework data as JSON. "
                "Return ONLY valid JSON with no additional text."
            )
        )

        # Get response from Gemini Flash (faster for extraction)
        response = await self.gemini_flash.ainvoke(messages)

        # Parse JSON response
        try:
            # Try to extract JSON from response
            content = response.content
            # Find JSON in response (handle cases where AI adds extra text)
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                extracted_data = json.loads(json_str)
                return extracted_data
            else:
                return {}
        except json.JSONDecodeError:
            # If parsing fails, return empty dict
            return {}

    async def chat_for_define(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        framework_type: str,
    ) -> str:
        """
        Handle chat interaction for the Define tool

        Args:
            message: User's message
            conversation_history: Previous conversation
            framework_type: Selected framework type

        Returns:
            AI's response
        """

        system_prompt = f"""You are a helpful research assistant helping formulate a research question using the {framework_type} framework.

Your role is to:
1. Ask clarifying questions to understand the research topic
2. Guide the researcher through each component of the {framework_type} framework
3. Help refine and structure their research question
4. Be conversational and supportive

{self._get_framework_description(framework_type)}

Keep responses concise and focused. Ask one question at a time."""

        messages = [SystemMessage(content=system_prompt)]

        # Add conversation history
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # Add current message
        messages.append(HumanMessage(content=message))

        # Get streaming response from Gemini Flash
        response = await self.gemini_flash.ainvoke(messages)

        return response.content

    async def generate_pubmed_query(self, framework_data: Dict[str, str]) -> str:
        """
        Generate PubMed boolean search query from framework data

        Args:
            framework_data: Extracted framework fields

        Returns:
            PubMed search query string
        """

        prompt = f"""You are a medical librarian expert in creating PubMed search queries.

Given the following research question components:
{json.dumps(framework_data, indent=2)}

Generate an effective PubMed boolean search query using:
- AND, OR, NOT operators
- MeSH terms where appropriate
- Field tags like [Title/Abstract], [MeSH Terms]
- Appropriate wildcards (*)

Return ONLY the search query, no explanations."""

        messages = [HumanMessage(content=prompt)]

        response = await self.gemini_flash.ainvoke(messages)

        return response.content.strip()

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
        response = await self.gemini_pro.ainvoke(messages)

        # Parse JSON response
        try:
            content = response.content
            json_start = content.find("[")
            json_end = content.rfind("]") + 1
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                results = json.loads(json_str)
                return results
            else:
                return []
        except json.JSONDecodeError:
            return []

    def _build_extraction_prompt(self, framework_type: str) -> str:
        """Build system prompt for extracting framework data"""

        descriptions = {
            "PICO": """Extract PICO components:
- P (Population): Who are the patients/population?
- I (Intervention): What is the intervention being studied?
- C (Comparison): What is the comparison/control?
- O (Outcome): What outcomes are being measured?""",
            "CoCoPop": """Extract CoCoPop components:
- Condition: What is the health condition or disease?
- Context: What is the setting or context?
- Population: Who is the target population?""",
            "PEO": """Extract PEO components:
- P (Population): Who is the population?
- E (Exposure): What is the exposure or phenomenon?
- O (Outcome): What is the outcome of interest?""",
            "SPIDER": """Extract SPIDER components:
- S (Sample): Who is the sample?
- PI (Phenomenon of Interest): What is being studied?
- D (Design): What is the study design?
- E (Evaluation): What is being evaluated?
- R (Research type): What type of research?""",
        }

        base_description = descriptions.get(
            framework_type,
            f"Extract components for {framework_type} framework based on the conversation.",
        )

        return f"""You are analyzing a conversation to extract structured research question components.

{base_description}

Analyze the conversation and extract the relevant information into a JSON object.
If information is not available for a field, use an empty string."""

    def _get_framework_description(self, framework_type: str) -> str:
        """Get description of framework for chat context"""

        descriptions = {
            "PICO": "PICO Framework: Population, Intervention, Comparison, Outcome",
            "CoCoPop": "CoCoPop Framework: Condition, Context, Population",
            "PEO": "PEO Framework: Population, Exposure, Outcome",
            "SPIDER": "SPIDER Framework: Sample, Phenomenon of Interest, Design, Evaluation, Research type",
        }

        return descriptions.get(framework_type, f"{framework_type} Research Framework")


# Global instance
ai_service = AIService()
