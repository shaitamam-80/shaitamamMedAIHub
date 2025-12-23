"""
MedAI Hub - Search Configuration
Centralized search filters and constants for PubMed query building
"""

# Priority order for PICO framework components
PICO_PRIORITY = {"P": 1, "I": 2, "C": 3, "O": 4, "E": 5, "S": 6, "T": 7, "F": 8}

# Generic terms that should NOT be expanded to MeSH
# These are too broad and bring irrelevant results (e.g., "Vaccine Efficacy" for "Efficacy")
# For these terms, we use only the free-text [tiab] search
GENERIC_TERMS_NO_MESH = {
    # Outcome-related generic terms
    "efficacy",
    "effectiveness",
    "effect",
    "effects",
    "outcome",
    "outcomes",
    "result",
    "results",
    "response",
    "improvement",
    "reduction",
    "change",
    "changes",
    "benefit",
    "benefits",
    "impact",
    "success",
    "failure",
    # Quality/safety generic terms
    "safety",
    "quality",
    "risk",
    "adverse",
    "side effect",
    "side effects",
    "tolerance",
    "tolerability",
    # Time-related generic terms
    "long-term",
    "short-term",
    "duration",
    "follow-up",
    "maintenance",
    # Comparison generic terms
    "comparison",
    "versus",
    "compared",
    "difference",
    "differences",
}

# Drug class to specific drug names mapping
# When user mentions a drug class (e.g., "SSRIs"), expand to include specific drug names
# Clinical trials often use specific drug names in titles, not class names
DRUG_CLASS_EXPANSIONS = {
    # SSRIs - Selective Serotonin Reuptake Inhibitors
    "ssri": ["Fluoxetine", "Paroxetine", "Sertraline", "Citalopram", "Escitalopram", "Fluvoxamine"],
    "ssris": [
        "Fluoxetine",
        "Paroxetine",
        "Sertraline",
        "Citalopram",
        "Escitalopram",
        "Fluvoxamine",
    ],
    "serotonin uptake inhibitors": [
        "Fluoxetine",
        "Paroxetine",
        "Sertraline",
        "Citalopram",
        "Escitalopram",
        "Fluvoxamine",
    ],
    "selective serotonin reuptake inhibitor": [
        "Fluoxetine",
        "Paroxetine",
        "Sertraline",
        "Citalopram",
        "Escitalopram",
        "Fluvoxamine",
    ],
    # SNRIs - Serotonin-Norepinephrine Reuptake Inhibitors
    "snri": ["Venlafaxine", "Duloxetine", "Desvenlafaxine", "Levomilnacipran", "Milnacipran"],
    "snris": ["Venlafaxine", "Duloxetine", "Desvenlafaxine", "Levomilnacipran", "Milnacipran"],
    # TCAs - Tricyclic Antidepressants
    "tca": [
        "Amitriptyline",
        "Nortriptyline",
        "Imipramine",
        "Desipramine",
        "Clomipramine",
        "Doxepin",
    ],
    "tcas": [
        "Amitriptyline",
        "Nortriptyline",
        "Imipramine",
        "Desipramine",
        "Clomipramine",
        "Doxepin",
    ],
    "tricyclic antidepressant": [
        "Amitriptyline",
        "Nortriptyline",
        "Imipramine",
        "Desipramine",
        "Clomipramine",
        "Doxepin",
    ],
    # Benzodiazepines
    "benzodiazepine": [
        "Diazepam",
        "Lorazepam",
        "Alprazolam",
        "Clonazepam",
        "Oxazepam",
        "Chlordiazepoxide",
    ],
    "benzodiazepines": [
        "Diazepam",
        "Lorazepam",
        "Alprazolam",
        "Clonazepam",
        "Oxazepam",
        "Chlordiazepoxide",
    ],
    # Atypical Antipsychotics
    "atypical antipsychotic": [
        "Risperidone",
        "Olanzapine",
        "Quetiapine",
        "Aripiprazole",
        "Ziprasidone",
        "Clozapine",
    ],
    "atypical antipsychotics": [
        "Risperidone",
        "Olanzapine",
        "Quetiapine",
        "Aripiprazole",
        "Ziprasidone",
        "Clozapine",
    ],
    # NSAIDs
    "nsaid": ["Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Meloxicam", "Indomethacin"],
    "nsaids": ["Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Meloxicam", "Indomethacin"],
    # Statins
    "statin": [
        "Atorvastatin",
        "Simvastatin",
        "Rosuvastatin",
        "Pravastatin",
        "Lovastatin",
        "Fluvastatin",
    ],
    "statins": [
        "Atorvastatin",
        "Simvastatin",
        "Rosuvastatin",
        "Pravastatin",
        "Lovastatin",
        "Fluvastatin",
    ],
    # ACE Inhibitors
    "ace inhibitor": [
        "Lisinopril",
        "Enalapril",
        "Ramipril",
        "Captopril",
        "Benazepril",
        "Perindopril",
    ],
    "ace inhibitors": [
        "Lisinopril",
        "Enalapril",
        "Ramipril",
        "Captopril",
        "Benazepril",
        "Perindopril",
    ],
    # Beta Blockers
    "beta blocker": [
        "Metoprolol",
        "Atenolol",
        "Propranolol",
        "Carvedilol",
        "Bisoprolol",
        "Nebivolol",
    ],
    "beta blockers": [
        "Metoprolol",
        "Atenolol",
        "Propranolol",
        "Carvedilol",
        "Bisoprolol",
        "Nebivolol",
    ],
    # PPIs - Proton Pump Inhibitors
    "ppi": ["Omeprazole", "Esomeprazole", "Pantoprazole", "Lansoprazole", "Rabeprazole"],
    "ppis": ["Omeprazole", "Esomeprazole", "Pantoprazole", "Lansoprazole", "Rabeprazole"],
    "proton pump inhibitor": [
        "Omeprazole",
        "Esomeprazole",
        "Pantoprazole",
        "Lansoprazole",
        "Rabeprazole",
    ],
}

# Predefined toolbox filters (cleaned up)
TOOLBOX_FILTERS = [
    # Age Filters
    {
        "category": "Age",
        "label": "Adults (19+)",
        "query": 'AND ("adult"[Mesh] OR adult*[tiab])',
        "description": "Limit to adult population",
    },
    {
        "category": "Age",
        "label": "Children (0-18)",
        "query": 'AND ("child"[Mesh] OR "adolescent"[Mesh] OR child*[tiab] OR pediatric[tiab])',
        "description": "Limit to pediatric population",
    },
    {
        "category": "Age",
        "label": "Elderly (65+)",
        "query": 'AND ("aged"[Mesh] OR elderly[tiab] OR "older adult*"[tiab])',
        "description": "Limit to elderly population",
    },
    # Article Type Filters
    {
        "category": "Article Type",
        "label": "Systematic Reviews",
        "query": 'AND (systematic review[pt] OR meta-analysis[pt] OR "systematic review"[tiab])',
        "description": "Systematic reviews and meta-analyses",
    },
    {
        "category": "Article Type",
        "label": "RCTs Only",
        "query": 'AND (randomized controlled trial[pt] OR "randomized controlled trial"[tiab])',
        "description": "Randomized controlled trials",
    },
    {
        "category": "Article Type",
        "label": "Clinical Trials",
        "query": 'AND (clinical trial[pt] OR "clinical trial"[tiab])',
        "description": "Clinical trials",
    },
    {
        "category": "Article Type",
        "label": "Guidelines",
        "query": 'AND (practice guideline[pt] OR guideline[pt] OR "clinical guideline"[tiab])',
        "description": "Clinical guidelines",
    },
    {
        "category": "Article Type",
        "label": "Observational Studies",
        "query": "AND (cohort studies[Mesh] OR case-control studies[Mesh] OR observational[tiab])",
        "description": "Observational studies",
    },
    {
        "category": "Article Type",
        "label": "Case Reports",
        "query": "AND (case reports[pt])",
        "description": "Case reports",
    },
    # Date Filters (removed static "2020-Present")
    {
        "category": "Date",
        "label": "Last 5 Years",
        "query": 'AND ("last 5 years"[dp])',
        "description": "Published in last 5 years",
    },
    {
        "category": "Date",
        "label": "Last 10 Years",
        "query": 'AND ("last 10 years"[dp])',
        "description": "Published in last 10 years",
    },
    # Language Filters
    {
        "category": "Language",
        "label": "English Only",
        "query": "AND English[lang]",
        "description": "English language only",
    },
    {
        "category": "Language",
        "label": "Free Full Text",
        "query": "AND free full text[sb]",
        "description": "Free full text available",
    },
    # Study Design Filters (consolidated - removed duplicate "Exclude Animals")
    {
        "category": "Study Design",
        "label": "Humans Only",
        "query": "AND humans[Mesh]",
        "description": "Exclude animal-only studies",
    },
]
