---
description: Review code changes for quality, patterns, and bugs using the code-reviewer agent
allowed_tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Code Review Workflow

## Review Target
$ARGUMENTS

Default: Review all uncommitted changes

---

## Phase 1: Determine Scope

```bash
# Check what has changed
git status
git diff --stat
git diff --staged --stat
git log --oneline -5
```

### Scope Rules:
- If `$ARGUMENTS` specifies files → review those files
- If `$ARGUMENTS` says "recent changes" → `git diff HEAD~1`
- If `$ARGUMENTS` says "since last commit" → `git diff HEAD`
- If `$ARGUMENTS` says "PR" or "branch" → `git diff main...HEAD`
- If no arguments → review uncommitted + staged changes

---

## Phase 2: Call @code-reviewer

Invoke the code-reviewer agent with the identified scope:

```
Review the following code changes:

Scope: {determined scope}
Files: {list of files}
Change type: {feature/bugfix/refactor}

Focus areas:
1. Project pattern compliance (FastAPI service layer, auth, TypeScript types)
2. Bug detection (null access, race conditions, missing error handling)
3. Performance issues (N+1 queries, unnecessary re-renders)
4. Medical domain specifics (PMID handling, data integrity)
```

---

## Phase 3: Report

Present the code review findings to the user in a clear, actionable format.

### If issues found:
1. List all issues by severity
2. Provide specific file:line references
3. Suggest fixes with code examples
4. Ask if user wants auto-fix for applicable issues

### If no issues:
1. Confirm code looks good
2. Note any positive patterns observed
3. Suggest optional improvements (as nits)

---

## Phase 4: Auto-Fix (if requested)

If the user agrees to auto-fix:
1. Apply fixes for all Critical and Major issues
2. Run syntax/type checks after each fix
3. Present remaining Minor/Nit issues for manual review
