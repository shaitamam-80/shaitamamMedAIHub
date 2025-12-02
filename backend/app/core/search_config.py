"""
MedAI Hub - Search Configuration
Centralized search filters and constants for PubMed query building
"""

# Priority order for PICO framework components
PICO_PRIORITY = {
    'P': 1, 'I': 2, 'C': 3, 'O': 4,
    'E': 5, 'S': 6, 'T': 7, 'F': 8
}

# Predefined toolbox filters (cleaned up)
TOOLBOX_FILTERS = [
    # Age Filters
    {"category": "Age", "label": "Adults (19+)", "query": 'AND ("adult"[Mesh] OR adult*[tiab])', "description": "Limit to adult population"},
    {"category": "Age", "label": "Children (0-18)", "query": 'AND ("child"[Mesh] OR "adolescent"[Mesh] OR child*[tiab] OR pediatric[tiab])', "description": "Limit to pediatric population"},
    {"category": "Age", "label": "Elderly (65+)", "query": 'AND ("aged"[Mesh] OR elderly[tiab] OR "older adult*"[tiab])', "description": "Limit to elderly population"},

    # Article Type Filters
    {"category": "Article Type", "label": "Systematic Reviews", "query": 'AND (systematic review[pt] OR meta-analysis[pt] OR "systematic review"[tiab])', "description": "Systematic reviews and meta-analyses"},
    {"category": "Article Type", "label": "RCTs Only", "query": 'AND (randomized controlled trial[pt] OR "randomized controlled trial"[tiab])', "description": "Randomized controlled trials"},
    {"category": "Article Type", "label": "Clinical Trials", "query": 'AND (clinical trial[pt] OR "clinical trial"[tiab])', "description": "Clinical trials"},
    {"category": "Article Type", "label": "Guidelines", "query": 'AND (practice guideline[pt] OR guideline[pt] OR "clinical guideline"[tiab])', "description": "Clinical guidelines"},
    {"category": "Article Type", "label": "Observational Studies", "query": 'AND (cohort studies[Mesh] OR case-control studies[Mesh] OR observational[tiab])', "description": "Observational studies"},
    {"category": "Article Type", "label": "Case Reports", "query": 'AND (case reports[pt])', "description": "Case reports"},

    # Date Filters (removed static "2020-Present")
    {"category": "Date", "label": "Last 5 Years", "query": 'AND ("last 5 years"[dp])', "description": "Published in last 5 years"},
    {"category": "Date", "label": "Last 10 Years", "query": 'AND ("last 10 years"[dp])', "description": "Published in last 10 years"},

    # Language Filters
    {"category": "Language", "label": "English Only", "query": "AND English[lang]", "description": "English language only"},
    {"category": "Language", "label": "Free Full Text", "query": "AND free full text[sb]", "description": "Free full text available"},

    # Study Design Filters (consolidated - removed duplicate "Exclude Animals")
    {"category": "Study Design", "label": "Humans Only", "query": "AND humans[Mesh]", "description": "Exclude animal-only studies"},
]
