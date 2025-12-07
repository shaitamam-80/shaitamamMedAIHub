"""
MedAI Hub - Screening Service (Orchestrator)
Manages the Smart Screener pipeline: Fetch -> Parse -> Rule Engine -> AI -> Save.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

from app.api.models.screening import (
    CriteriaConfig,
    ArticleDecisionCreate,
    ScreeningCriteriaCreate,
)
from app.services.pubmed_service import pubmed_service
from app.services.medline_parser import MedlineParser
from app.services.rule_engine import RuleEngine
from app.services.database import db_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class ScreeningService:
    """
    Orchestrates the screening process.
    """

    async def save_criteria_config(
        self, project_id: UUID, config: CriteriaConfig, user_id: str
    ) -> UUID:
        """Save a snapshot of criteria configuration."""
        # Check if project exists and belongs to the user
        project = await db_service.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if project.get("user_id") != user_id:
            raise PermissionError("You do not have permission to access this project")

        # Create record in DB
        # Note: We need to implement create_screening_criteria in db_service or do it raw here if possible?
        # Since db_service is typed, we should look if we can add a method there or use a generic insert.
        # But for now, we'll try to use the 'screening_criteria' table directly via supabase client if exposed,
        # or assuming the user added the table, we'll suggest adding a method to db_service later.
        # For now, let's use the client directly exposed in db_service.

        data = {
            "project_id": str(project_id),
            "review_type": config.review_type,
            "filters": config.dict(),
        }

        response = db_service.client.table("screening_criteria").insert(data).execute()
        if not response.data:
            raise Exception("Failed to save criteria config")

        return response.data[0]["id"]

    async def process_pmids(
        self, project_id: UUID, pmids: List[str], criteria_config: CriteriaConfig, user_id: str
    ) -> Dict[str, Any]:
        """
        Run the full screening pipeline on a list of PMIDs.
        """
        if not pmids:
            return {"processed": 0, "included": 0, "excluded": 0}

        # Verify project ownership
        project = await db_service.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if project.get("user_id") != user_id:
            raise PermissionError("You do not have permission to access this project")

        # 1. Fetch MEDLINE data
        logger.info(f"Fetching {len(pmids)} PMIDs in MEDLINE format...")
        raw_medline = await pubmed_service.fetch_details_as_medline(pmids)

        # 2. Parse
        parser = MedlineParser()
        abstracts = parser.parse_content(raw_medline)
        logger.info(f"Parsed {len(abstracts)} abstracts")

        # 3. Initialize Engines
        rule_engine = RuleEngine(criteria_config)

        results = []
        included_count = 0
        excluded_count = 0

        # 4. Get project's framework data for AI context
        framework_data = project.get("framework_data", {})
        framework_type = project.get("framework_type", "PICO")
        if framework_data:
            framework_data["framework_type"] = framework_type

        # 5. Collect all criteria codes for AI prompt
        all_criteria_codes = []
        all_criteria_codes.extend(criteria_config.population.codes)
        all_criteria_codes.extend(criteria_config.study_design.inclusion_codes)
        all_criteria_codes.extend(criteria_config.study_design.exclusion_codes)

        # 6. Processing Loop
        for abstract in abstracts:
            if not abstract.pmid:
                continue

            decision = ArticleDecisionCreate(
                project_id=project_id,
                pmid=abstract.pmid,
                title=abstract.title,
                source="pending",
                status="pending",
            )

            # Layer A: Rule Engine (fast metadata filters)
            status, reason = rule_engine.evaluate(abstract)

            if status == "excluded":
                decision.source = "rule_engine"
                decision.status = "excluded"
                decision.reason = reason
                excluded_count += 1
            else:
                # Layer B: AI Service (semantic analysis)
                logger.info(f"Running AI analysis on PMID {abstract.pmid}")

                ai_result = await ai_service.analyze_abstract_gems(
                    abstract_text=abstract.abstract or "",
                    title=abstract.title or "",
                    framework_data=framework_data,
                    criteria_codes=all_criteria_codes,
                    review_type=criteria_config.review_type
                )

                # Update decision with AI results
                decision.source = "ai_model"
                decision.status = ai_result["status"]
                decision.reason = ai_result["reason"]
                decision.evidence_quote = ai_result.get("evidence_quote")
                decision.study_type_classification = ai_result.get("study_type")

                # Count based on AI decision
                if ai_result["status"] == "included":
                    included_count += 1
                elif ai_result["status"] == "excluded":
                    excluded_count += 1
                # "unclear" doesn't increment either counter (requires human review)

            results.append(decision)

            # Save decision to DB
            # Upsert by (project_id, pmid)
            decision_data = decision.dict(exclude_none=True)
            # Make sure UUIDs are strings
            decision_data["project_id"] = str(decision_data["project_id"])

            try:
                db_service.client.table("article_decisions").upsert(
                    decision_data, on_conflict="project_id, pmid"
                ).execute()
            except Exception as e:
                logger.error(f"Failed to save decision for {abstract.pmid}: {e}")

        return {
            "processed": len(results),
            "included": included_count,
            "excluded": excluded_count,
            "details": results,
        }


screening_service = ScreeningService()
