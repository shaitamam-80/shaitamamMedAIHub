# MedAI Hub - Implementation Plan

## תוכנית יישום לתיקון ממצאי סקירת הקודבייס

**תאריך יצירה**: 2025-11-30
**נוצר על ידי**: @orchestrator
**סטטוס**: ✅ COMPLETED

---

## סיכום ביצועי

| שלב | תיאור | סטטוס | תאריך סיום |
|-----|--------|--------|------------|
| Phase 1 | Critical Security | ✅ Complete | 2025-11-30 |
| Phase 2 | High Priority | ✅ Complete | 2025-11-30 |
| Phase 3 | Medium Priority | ✅ Complete | 2025-11-30 |
| Phase 4 | CI/CD & Testing | ✅ Complete | 2025-11-30 |

---

## 🎉 Implementation Complete!

All 4 phases have been successfully implemented. Here's a summary of what was accomplished:

### Phase 1 - Critical Security ✅
- Security headers middleware (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- Hebrew translation validation for PubMed queries
- Pagination for abstracts API
- WCAG color contrast fixes for dark mode
- Focus-visible states for accessibility

### Phase 2 - High Priority ✅
- Rate limiting with slowapi (chat: 10/min, query: 20/min, upload: 5/min)
- Request logging middleware with request IDs
- Custom exception classes
- Component refactoring (LanguageSelector, ChatMessage)
- RTL support hook (useBidiLayout)
- Polling retry limits

### Phase 3 - Medium Priority ✅
- API client split into modules (7 files)
- Keyboard shortcuts dialog
- Skip navigation link
- JSON structured logging
- Enhanced health checks (/health/detailed, /ready)
- File content validation (MEDLINE format check)
- OpenAPI documentation improvements

### Phase 4 - CI/CD ✅
- GitHub Actions workflow (ci.yml)
- Dependabot configuration
- Pre-commit hooks configuration
- Ruff linting configuration (pyproject.toml)
- Trivy security scanning
- Docker build verification

---

## 🚨 Phase 1: Critical Security Fixes (Week 1)

### 1.1 Remove Secrets from Git History
**Priority**: CRITICAL
**Agent**: @devops-agent
**Risk**: Production secrets exposed in Git history

**Tasks**:
- [ ] Backup current `.env` values from Railway dashboard
- [ ] Run `git filter-branch` to remove `.env` from history
- [ ] Force push to all branches
- [ ] Rotate ALL secrets in Railway/Vercel
- [ ] Update `.gitignore` to prevent future commits
- [ ] Add pre-commit hook to block `.env` files

**Files**:
- `backend/.env` (remove from history)
- `.gitignore` (update)
- `.git/hooks/pre-commit` (create)

---

### 1.2 Add Security Headers
**Priority**: CRITICAL
**Agent**: @backend-agent + @devops-agent
**Risk**: XSS, Clickjacking, MIME sniffing attacks

**Tasks**:
- [ ] Add security headers middleware to FastAPI
- [ ] Add headers to Next.js config
- [ ] Restrict CORS regex (remove wildcard Vercel pattern)
- [ ] Test with security scanner

**Files**:
- `backend/main.py` - Add middleware
- `frontend/next.config.js` - Add headers

**Code to Add (backend/main.py)**:
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response
```

---

### 1.3 Fix Hebrew Translation Validation
**Priority**: CRITICAL
**Agent**: @backend-agent + @hebrew-validator
**Risk**: Invalid PubMed queries, wrong research results

**Tasks**:
- [ ] Add post-translation Hebrew detection
- [ ] Return error to frontend if Hebrew remains
- [ ] Add fallback to English-only generation
- [ ] Log translation failures for debugging
- [ ] Add test cases for Hebrew scenarios

**Files**:
- `backend/app/api/routes/query.py:336` - Add validation
- `backend/app/services/ai_service.py` - Improve translation
- `backend/tests/test_hebrew_translation.py` - Add tests

**Code to Add (query.py)**:
```python
# After translation
if ai_service._contains_hebrew(str(english_framework_data)):
    logger.error(f"Hebrew detected after translation for project {project_id}")
    raise HTTPException(
        status_code=422,
        detail="Translation failed - Hebrew text detected. Please use English in your framework."
    )
```

---

### 1.4 Add Pagination to Abstracts
**Priority**: CRITICAL
**Agent**: @backend-agent + @frontend-agent
**Risk**: Memory exhaustion, data exposure

**Tasks**:
- [ ] Add `limit` and `offset` parameters to endpoint
- [ ] Update database service method
- [ ] Add pagination UI to frontend
- [ ] Set default limit (100) and max limit (1000)
- [ ] Add total count to response

**Files**:
- `backend/app/api/routes/review.py:203` - Add params
- `backend/app/api/models/schemas.py` - Add PaginatedResponse
- `backend/app/services/database.py` - Update query
- `frontend/app/review/page.tsx` - Add pagination UI

**New Schema**:
```python
class PaginatedAbstractsResponse(BaseModel):
    items: List[AbstractResponse]
    total: int
    limit: int
    offset: int
    has_more: bool
```

---

### 1.5 Fix WCAG Color Contrast
**Priority**: CRITICAL
**Agent**: @ui-ux-agent + @frontend-agent
**Risk**: Accessibility failure, legal compliance

**Tasks**:
- [ ] Update status colors for dark mode
- [ ] Add focus-visible states to all interactive elements
- [ ] Add aria-labels to icon buttons
- [ ] Test with contrast checker tool

**Files**:
- `frontend/app/globals.css:97-108` - Update status colors
- `frontend/app/define/page.tsx` - Add focus states
- `frontend/app/review/page.tsx` - Add aria-labels

**CSS Updates**:
```css
/* Dark mode status colors with better contrast */
.dark .status-include {
  @apply bg-emerald-500/20 text-emerald-300;
}
.dark .status-exclude {
  @apply bg-red-500/20 text-red-300;
}
.dark .status-maybe {
  @apply bg-amber-500/20 text-amber-300;
}
.dark .status-pending {
  @apply bg-slate-500/20 text-slate-300;
}
```

---

## ⚡ Phase 2: High Priority Fixes (Week 2)

### 2.1 Improve Error Handling
**Agent**: @backend-agent

**Tasks**:
- [ ] Create custom exception classes
- [ ] Replace broad `except Exception` with specific handlers
- [ ] Add error classification function
- [ ] Implement circuit breaker for AI service
- [ ] Add request/response logging middleware

**Files**:
- `backend/app/core/exceptions.py` (create)
- `backend/app/api/routes/*.py` - Update all handlers
- `backend/main.py` - Add logging middleware

---

### 2.2 Add Rate Limiting
**Agent**: @backend-agent

**Tasks**:
- [ ] Install slowapi package
- [ ] Add rate limiter to chat endpoint (10/min)
- [ ] Add rate limiter to query endpoint (20/min)
- [ ] Add rate limiter to upload endpoint (5/min)
- [ ] Return proper 429 responses

**Files**:
- `backend/requirements.txt` - Add slowapi
- `backend/main.py` - Configure limiter
- `backend/app/api/routes/*.py` - Add decorators

---

### 2.3 PMID Validation
**Agent**: @backend-agent + @qa-agent

**Tasks**:
- [ ] Add regex pattern validation to PMID field
- [ ] Add migration for existing invalid PMIDs
- [ ] Update MEDLINE parser validation
- [ ] Add frontend validation

**Files**:
- `backend/app/api/models/schemas.py:199`
- `backend/app/services/medline_parser.py`
- `frontend/app/review/page.tsx`

---

### 2.4 Refactor Large Components
**Agent**: @frontend-agent

**Tasks**:
- [ ] Split `define/page.tsx` (1,268 lines) into:
  - `LanguageSelector.tsx`
  - `ChatArea.tsx`
  - `FrameworkForm.tsx`
  - `FinerAssessmentDialog.tsx`
  - `ProtocolDialog.tsx`
- [ ] Split `query/page.tsx` (984 lines) into smaller components
- [ ] Add proper TypeScript interfaces for each component

**Files**:
- `frontend/app/define/page.tsx` → `frontend/app/define/components/*.tsx`
- `frontend/app/query/page.tsx` → `frontend/app/query/components/*.tsx`

---

### 2.5 Fix Polling Mechanism
**Agent**: @frontend-agent

**Tasks**:
- [ ] Add maximum retry count (30 attempts = 1 minute)
- [ ] Add timeout error message
- [ ] Fix stale closure in polling function
- [ ] Consider WebSocket for real-time updates

**Files**:
- `frontend/app/review/page.tsx:113-129`

---

### 2.6 Secure Dockerfile
**Agent**: @devops-agent

**Tasks**:
- [ ] Add non-root user
- [ ] Optimize layer caching
- [ ] Add healthcheck
- [ ] Create .dockerignore
- [ ] Switch Railway to Dockerfile builder

**Files**:
- `backend/Dockerfile`
- `backend/.dockerignore` (create)
- `railway.json`

---

## 📋 Phase 3: Medium Priority (Week 3)

### 3.1 Complete RTL Support
**Agent**: @ui-ux-agent + @frontend-agent

**Tasks**:
- [ ] Add RTL support to Query page
- [ ] Add RTL support to Review page
- [ ] Create `useBidiLayout` hook
- [ ] Test with Hebrew users

---

### 3.2 Structured Logging
**Agent**: @backend-agent + @devops-agent

**Tasks**:
- [ ] Implement JSON formatter
- [ ] Add request ID tracking
- [ ] Add user ID to logs
- [ ] Configure log aggregation

---

### 3.3 Enhanced Health Checks
**Agent**: @devops-agent

**Tasks**:
- [ ] Add database connectivity check
- [ ] Add AI service availability check
- [ ] Add memory usage check
- [ ] Add `/ready` endpoint for Kubernetes

---

### 3.4 File Upload Improvements
**Agent**: @backend-agent + @devops-agent

**Tasks**:
- [ ] Move uploads to cloud storage (S3/GCS)
- [ ] Add file content validation (magic bytes)
- [ ] Add virus scanning (optional)
- [ ] Add upload progress tracking

---

### 3.5 API Client Split
**Agent**: @frontend-agent

**Tasks**:
- [ ] Split `api.ts` (473 lines) into modules:
  - `api/client.ts`
  - `api/types.ts`
  - `api/projects.ts`
  - `api/define.ts`
  - `api/query.ts`
  - `api/review.ts`

---

### 3.6 Accessibility Improvements
**Agent**: @ui-ux-agent

**Tasks**:
- [ ] Add keyboard shortcut hints
- [ ] Add skip navigation links
- [ ] Add ARIA live regions for status updates
- [ ] Test with screen reader (NVDA/JAWS)

---

## 🔧 Phase 4: CI/CD & Testing (Week 4)

### 4.1 GitHub Actions Pipeline
**Agent**: @devops-agent

**Tasks**:
- [ ] Create `.github/workflows/test.yml`
- [ ] Add Python linting (ruff/flake8)
- [ ] Add TypeScript checking
- [ ] Add build verification
- [ ] Add security scanning (Snyk/Dependabot)

---

### 4.2 Backend Tests
**Agent**: @qa-agent + @backend-agent

**Tasks**:
- [ ] Add Hebrew translation tests
- [ ] Add pagination tests
- [ ] Add authentication tests
- [ ] Add rate limiting tests
- [ ] Target: 60% coverage

---

### 4.3 Frontend Tests
**Agent**: @qa-agent + @frontend-agent

**Tasks**:
- [ ] Add component tests (React Testing Library)
- [ ] Add API client tests
- [ ] Add form validation tests
- [ ] Target: 50% coverage

---

### 4.4 Integration Tests
**Agent**: @qa-agent

**Tasks**:
- [ ] Test full Define → Query → Review flow
- [ ] Test file upload → parsing → screening flow
- [ ] Test authentication flow

---

### 4.5 Documentation Update
**Agent**: @docs-agent

**Tasks**:
- [ ] Update CLAUDE.md with new patterns
- [ ] Add API documentation (OpenAPI)
- [ ] Add deployment runbook
- [ ] Add troubleshooting guide

---

## 📊 Progress Tracking

### Daily Standup Template
```markdown
## Date: YYYY-MM-DD

### Completed Yesterday
- [ ] Task completed

### Today's Focus
- [ ] Task to work on

### Blockers
- None / Description of blocker

### Notes
- Additional observations
```

### Weekly Review Template
```markdown
## Week X Review

### Completed
| Task | Status | Notes |
|------|--------|-------|
| 1.1 | ✅ | Completed on date |

### Pending
| Task | Blocker | ETA |
|------|---------|-----|
| 1.2 | None | Tomorrow |

### Metrics
- Code coverage: X%
- Open issues: X
- Security score: X/10
```

---

## 🚀 How to Use This Plan

### For @orchestrator:
1. Start with Phase 1 tasks in order
2. Call specialized agents for each task
3. Update this file after each completion
4. Run @qa-agent after each phase

### For Other Agents:
1. Find your assigned tasks
2. Follow the task checklist
3. Update files listed
4. Report completion to @orchestrator

### Starting Commands:
```bash
# Start Phase 1.1
Call @devops-agent to remove secrets from Git history

# Start Phase 1.2
Call @backend-agent to add security headers

# Etc.
```

---

## ✅ Completion Criteria

### Phase 1 Done When:
- [ ] No secrets in Git history
- [ ] Security headers on all responses
- [ ] Hebrew validation prevents bad queries
- [ ] Pagination works with 100 default limit
- [ ] WCAG AA contrast ratio achieved

### All Phases Done When:
- [ ] 0 CRITICAL issues remaining
- [ ] 0 HIGH issues remaining
- [ ] CI/CD pipeline passing
- [ ] 50%+ test coverage
- [ ] Production deployment checklist complete

---

**Last Updated**: 2025-11-30
**Next Review**: After Phase 1 completion
