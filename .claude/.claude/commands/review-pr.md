---
description: Comprehensive PR review combining code-reviewer, security-reviewer, and qa-agent
allowed_tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Pull Request Review Workflow

## PR Target
$ARGUMENTS

Default: Review current branch against main/develop

---

## Phase 1: Gather PR Context

```bash
# Current branch
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"

# Determine base branch
if git rev-parse --verify main >/dev/null 2>&1; then
  BASE="main"
elif git rev-parse --verify develop >/dev/null 2>&1; then
  BASE="develop"
else
  BASE="HEAD~5"
fi
echo "Base branch: $BASE"

# Changes overview
echo "=== Commits ==="
git log $BASE..HEAD --oneline 2>/dev/null || git log --oneline -10

echo "=== Files Changed ==="
git diff $BASE --name-only 2>/dev/null || git diff HEAD~5 --name-only

echo "=== Stats ==="
git diff $BASE --stat 2>/dev/null || git diff HEAD~5 --stat

echo "=== Diff ==="
git diff $BASE 2>/dev/null | head -500
```

---

## Phase 2: Parallel Review (3 agents)

Run all three reviews concurrently:

### 2.1 Code Review (@code-reviewer)

```
Review the PR changes for:
- Code quality and readability
- Project pattern compliance
- Bug detection
- Performance issues
- API design correctness
```

### 2.2 Security Review (@security-reviewer)

```
Security review of PR changes:
- Auth on new/modified routes
- Input validation
- Data exposure risks
- Injection vulnerabilities
- Secrets exposure
```

### 2.3 QA Review (@qa-agent)

```
QA review of PR changes:
- Functional correctness
- Edge cases handled
- Error states covered
- Test coverage adequate
- Integration points verified
```

---

## Phase 3: Consolidated PR Report

Combine all three reviews into a single PR review:

```markdown
## PR Review Summary

### Branch: {branch} → {base}
### Commits: {count}
### Files Changed: {count}

---

### Overall Verdict: ✅ APPROVE | ⚠️ CHANGES REQUESTED | ❌ REJECT

---

### Code Review
| Severity | Count |
|----------|-------|
| Critical | {n} |
| Major | {n} |
| Minor | {n} |
| Nit | {n} |

{Top issues listed}

### Security Review
| Risk Level | Finding |
|-----------|---------|
| {level} | {description} |

{Security findings listed}

### QA Review
| Check | Status |
|-------|--------|
| Syntax | ✅/❌ |
| Types | ✅/❌ |
| Tests | ✅/❌ |
| Patterns | ✅/❌ |

{QA findings listed}

---

### Action Items
1. **Must Fix:** {list of critical/blocking issues}
2. **Should Fix:** {list of important issues}
3. **Optional:** {list of suggestions}

---

### Positive Highlights
- ✨ {good practices observed}
```

---

## Phase 4: Interactive Resolution

After presenting the report:
1. Ask user which issues to fix
2. Apply fixes for approved items
3. Re-run relevant checks
4. Update report with fix status

---

## Phase 5: Final Verdict

After all fixes applied:
1. Re-run all three reviews on fixed code
2. Confirm all Critical/Major issues resolved
3. Give final APPROVE/REJECT recommendation
