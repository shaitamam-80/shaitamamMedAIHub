# Implementation Work Plan: MedAI Smart Screener

This checklist guides the development of the Smart Screener module based on the specification.

🟢 Phase 1: Database & Backend Infrastructure
Objective: Enable data storage and basic processing logic.
[ ] Database: Run SQL schema in Supabase (create screening_criteria, article_decisions).
[ ] Criteria Library: Create backend/app/core/gems/criteria_library.py with all codes (P1, I1, S-Ex1, etc.).
[ ] Models: Define Pydantic models in backend/app/api/models/screening.py (CriteriaConfig, ArticleDecision).
[ ] Medline Parser: Implement backend/app/services/medline_parser.py (Strict parsing logic).
[ ] PubMed Service: Update backend/app/services/pubmed_service.py with fetch_details_as_medline() method.

🟡 Phase 2: Core Logic Engines
Objective: Build the Hybrid Filtering Brain.
[ ] Rule Engine (Layer A): Implement backend/app/services/rule_engine.py (Date, Language, PT filters).
[ ] AI Service (Layer B): Update backend/app/services/ai_service.py:

[ ] Implement analyze_abstract_gems().

[ ] Create Prompt Templates for Systematic vs Scoping reviews.
[ ] Orchestrator: Implement backend/app/services/screening_service.py to connect Fetch -> Parse -> Rule -> AI -> Save.
[ ] API Routes: Create backend/app/api/routes/screening.py with /process-pmids endpoint.
[ ] Main: Register the new router in backend/main.py.

🔵 Phase 3: Frontend Wizard (The UI)
Objective: Create the 4-step user experience.
[ ] API Client: Add screeningApi to frontend/lib/api/screening.ts.
[ ] Components: Create folder frontend/components/screening/steps/.
[ ] Step1Framework.tsx: Display PICO data.
[ ] Step2ReviewType.tsx: Selection cards (Systematic/Scoping/Quick).
[ ] Step3Criteria.tsx: Checkbox interface for Criteria Library.
[ ] Step4Execution.tsx: Progress bar and console logs.
[ ] Wizard Container: Implement frontend/components/screening/ScreeningWizard.tsx to manage state/navigation.
[ ] Page: Create frontend/app/screening/page.tsx that loads project context and renders Wizard.

🟣 Phase 4: Integration & Polish
Objective: Connect it to the rest of the app.
[ ] Navigation: Add "Start Screening" button in Query Tool results page and Projects dashboard.
[ ] Results View: Update Review Tool to display the AI decisions (ai_status, reason, evidence_quote).
[ ] Testing:
[ ] Run a test with a "Review" article (Should be blocked by Layer A).
[ ] Run a test with a valid RCT (Should be accepted by Layer B).
[ ] Verify "Evidence Quote" is accurate.

🚀 Ready for Handoff
Once Phase 1 & 2 are done, the Backend is ready.
Once Phase 3 is done, the UI is ready.
Phase 4 connects them.
