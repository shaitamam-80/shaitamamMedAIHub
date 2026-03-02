---
description: Run a security audit on the project or specific files using the security-reviewer agent
allowed_tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Security Review Workflow

## Review Target
$ARGUMENTS

Default: Full project security audit

---

## Phase 1: Determine Scope

### If specific scope provided:
- Review only the specified files/directories

### If no scope (full audit):
```bash
echo "=== Security-relevant files ==="
ls backend/app/api/routes/*.py backend/app/core/auth.py backend/app/core/config.py backend/Dockerfile backend/requirements.txt frontend/package.json 2>/dev/null

echo "=== Environment Files (should not exist in git) ==="
git ls-files | grep -i "\.env" || echo "None tracked (good)"
```

---

## Phase 2: Call @security-reviewer

Invoke the security-reviewer agent:

```
Security review for MedAI Hub:

Scope: {determined scope}

Priority checks:
1. Authentication - All /api/v1/* routes require auth
2. Authorization - Users can only access their own data (IDOR check)
3. Injection - SQL injection, command injection, prompt injection
4. Secrets - No hardcoded keys, tokens, or passwords
5. CORS - Proper origin restrictions
6. Dependencies - Known vulnerabilities
7. Data exposure - Error messages don't leak internals
8. Input validation - All inputs validated via Pydantic
9. Docker security - Non-root user, minimal image
10. Supabase RLS - Row-level security policies
```

---

## Phase 3: Automated Scans

Run automated security checks. **Only run full scans when scope is "full audit"; for specific files, limit grep to those files.**

```bash
# Secrets + debug mode (backend)
echo "=== Backend: secrets & debug ==="
grep -rn -E "eyJ|sk-|password\s*=|DEBUG\s*=\s*True" backend/ --include="*.py" 2>/dev/null | grep -v "# " | head -30

# Secrets (frontend)
echo "=== Frontend: secrets ==="
grep -rn -E "eyJ|sk-" frontend/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

# Dangerous patterns
echo "=== Dangerous patterns ==="
grep -rn -E "dangerouslySetInnerHTML|eval\(|shell=True" backend/ frontend/src/ --include="*.py" --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

# .gitignore coverage
echo "=== .gitignore check ==="
grep -E "\.env|secret|credential|password" .gitignore 2>/dev/null || echo "WARNING: .gitignore may be incomplete"
```

---

## Phase 4: Report

Present security findings with:
1. Executive summary (overall risk level)
2. Findings by severity (Critical → Info)
3. Specific remediation steps for each finding
4. Priority order for fixes

---

## Phase 5: Remediation (if requested)

If user wants auto-fix:
1. Fix Critical findings immediately
2. Fix High findings
3. Present Medium/Low for manual review
4. Re-run security scan to verify fixes
