"""
MedAI Hub - Skill Loader Service
=================================

Loads SKILL.md and knowledge base files from the skills directory.
These skills were migrated from the SR-Portal frontend and contain
comprehensive system prompts for each stage of the systematic review pipeline.

Directory structure:
    app/core/skills/
        research-question/
            SKILL.md
            KNOWLEDGE-BASE.md
            PUBMED-SEARCH.md
        protocol-builder/
            SKILL.md
            KNOWLEDGE-BASE.md
        ...
"""

import logging
import os
from pathlib import Path
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# Base path for skills directory
SKILLS_DIR = Path(__file__).parent.parent / "core" / "skills"


class SkillContent:
    """Loaded skill content with system prompt and knowledge bases."""

    def __init__(
        self,
        skill_name: str,
        system_prompt: str,
        knowledge_bases: dict[str, str],
        combined_instruction: str,
    ):
        self.skill_name = skill_name
        self.system_prompt = system_prompt
        self.knowledge_bases = knowledge_bases
        self.combined_instruction = combined_instruction

    def __repr__(self) -> str:
        kb_count = len(self.knowledge_bases)
        prompt_len = len(self.system_prompt)
        return f"<SkillContent '{self.skill_name}' prompt={prompt_len}chars kbs={kb_count}>"


def _read_file_safe(filepath: Path) -> Optional[str]:
    """Read a file safely, returning None if not found."""
    try:
        if filepath.exists():
            content = filepath.read_text(encoding="utf-8")
            return content.strip()
    except Exception as e:
        logger.warning(f"Failed to read {filepath}: {e}")
    return None


@lru_cache(maxsize=32)
def load_skill(skill_name: str, knowledge_base_names: tuple[str, ...] = ()) -> SkillContent:
    """
    Load a skill's SKILL.md and optional knowledge base files.

    Args:
        skill_name: Name of the skill directory (e.g., 'research-question')
        knowledge_base_names: Tuple of knowledge base filenames to load
                             (e.g., ('KNOWLEDGE-BASE.md', 'PUBMED-SEARCH.md'))

    Returns:
        SkillContent with system prompt and combined instruction

    Raises:
        FileNotFoundError: If the skill directory or SKILL.md doesn't exist
    """
    skill_dir = SKILLS_DIR / skill_name

    if not skill_dir.exists():
        raise FileNotFoundError(f"Skill directory not found: {skill_dir}")

    # Load main SKILL.md
    skill_file = skill_dir / "SKILL.md"
    system_prompt = _read_file_safe(skill_file)

    if not system_prompt:
        raise FileNotFoundError(f"SKILL.md not found in {skill_dir}")

    # Load knowledge base files
    knowledge_bases: dict[str, str] = {}

    if knowledge_base_names:
        for kb_name in knowledge_base_names:
            kb_path = skill_dir / kb_name
            kb_content = _read_file_safe(kb_path)
            if kb_content:
                knowledge_bases[kb_name] = kb_content
                logger.debug(f"Loaded knowledge base: {kb_name} ({len(kb_content)} chars)")
            else:
                logger.warning(f"Knowledge base not found: {kb_path}")
    else:
        # Auto-discover knowledge bases (all .md files except SKILL.md)
        for md_file in skill_dir.glob("*.md"):
            if md_file.name != "SKILL.md":
                kb_content = _read_file_safe(md_file)
                if kb_content:
                    knowledge_bases[md_file.name] = kb_content

    # Build combined instruction
    parts = [system_prompt]
    for kb_name, kb_content in knowledge_bases.items():
        parts.append(f"\n\n---\n## Knowledge Base: {kb_name}\n\n{kb_content}")

    combined_instruction = "\n".join(parts)

    logger.info(
        f"Loaded skill '{skill_name}': "
        f"prompt={len(system_prompt)} chars, "
        f"knowledge_bases={len(knowledge_bases)}, "
        f"combined={len(combined_instruction)} chars"
    )

    return SkillContent(
        skill_name=skill_name,
        system_prompt=system_prompt,
        knowledge_bases=knowledge_bases,
        combined_instruction=combined_instruction,
    )


def get_available_skills() -> list[str]:
    """List all available skill directories."""
    if not SKILLS_DIR.exists():
        return []

    skills = []
    for item in sorted(SKILLS_DIR.iterdir()):
        if item.is_dir() and (item / "SKILL.md").exists():
            skills.append(item.name)
    return skills


# Stage-to-skill mapping (matches SR-Portal's stage-config.ts)
STAGE_SKILL_MAP: dict[str, dict] = {
    "idea": {
        "skill_name": "systematic-review",
        "knowledge_bases": (),
        "model": "flash",
    },
    "question": {
        "skill_name": "research-question",
        "knowledge_bases": ("KNOWLEDGE-BASE.md", "PUBMED-SEARCH.md"),
        "model": "pro",
    },
    "protocol": {
        "skill_name": "protocol-builder",
        "knowledge_bases": ("KNOWLEDGE-BASE.md",),
        "model": "pro",
    },
    "search": {
        "skill_name": "pubmed-query",
        "knowledge_bases": (),
        "model": "pro",
    },
    "screening": {
        "skill_name": "pubmed-screening",
        "knowledge_bases": ("KNOWLEDGE-BASE.md",),
        "model": "pro",
    },
    "extraction": {
        "skill_name": "data-extraction",
        "knowledge_bases": ("EXTRACTION-TEMPLATES.md",),
        "model": "pro",
    },
    "rob": {
        "skill_name": "risk-of-bias",
        "knowledge_bases": ("ROB-TOOLS.md",),
        "model": "pro",
    },
    "synthesis": {
        "skill_name": "meta-analysis",
        "knowledge_bases": ("FORMULAS.md",),
        "model": "pro",
    },
    "grade": {
        "skill_name": "grade-assessment",
        "knowledge_bases": (),
        "model": "pro",
    },
    "manuscript": {
        "skill_name": "manuscript-writer",
        "knowledge_bases": (),
        "model": "pro",
    },
}

STANDALONE_SKILL_MAP: dict[str, dict] = {
    "article-appraisal": {
        "skill_name": "article-appraisal",
        "knowledge_bases": (),
        "model": "pro",
    },
    "find-journal": {
        "skill_name": "find-journal",
        "knowledge_bases": (),
        "model": "flash",
    },
}


def get_skill_for_stage(stage_slug: str) -> Optional[dict]:
    """Get skill configuration for a stage slug."""
    return STAGE_SKILL_MAP.get(stage_slug) or STANDALONE_SKILL_MAP.get(stage_slug)


def load_skill_for_stage(stage_slug: str) -> SkillContent:
    """
    Load the skill for a given stage slug.

    Args:
        stage_slug: Stage identifier (e.g., 'question', 'protocol', 'screening')

    Returns:
        SkillContent for the stage

    Raises:
        ValueError: If the stage slug is unknown
        FileNotFoundError: If the skill files are missing
    """
    config = get_skill_for_stage(stage_slug)
    if not config:
        raise ValueError(f"Unknown stage: {stage_slug}")

    return load_skill(
        skill_name=config["skill_name"],
        knowledge_base_names=tuple(config.get("knowledge_bases", ())),
    )
