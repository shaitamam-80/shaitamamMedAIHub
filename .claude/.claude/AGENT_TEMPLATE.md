# Agent Template for MedAI Hub

This template defines the required structure for all agents in this project.
Copy this template when creating new agents.

---

## Required Sections for Every Agent

### 1. YAML Frontmatter
```yaml
---
name: agent-name
description: Brief description of what this agent does
allowed_tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
model: claude-sonnet-4-20250514  # Optional: specify model
---
```

### 2. Thinking Log Requirement (MANDATORY)

Every agent MUST write its thinking process before taking action.

### 3. Feedback Loop Protocol (MANDATORY)

Every agent MUST implement the feedback loop pattern.

### 4. Handoff Report (MANDATORY)

Every agent MUST end with a structured handoff report.

---

## Standard Thinking Log Format

```markdown
# Agent: {agent-name}
# Task: {task-description}
# Timestamp: {YYYY-MM-DD HH:MM:SS}
# Called By: {parent-agent or human}

## 1. My Understanding
What I believe is being asked of me:
- [Point 1]
- [Point 2]

## 2. Context Analysis
Relevant information I found:
- File: {path} - {what I learned}
- Pattern: {what I noticed}

## 3. Thinking Process
### Thinking Level: {think|think hard|think harder|ultrathink}

{Detailed reasoning here}

### Options Considered
1. Option A: {description} - Pros: {}, Cons: {}
2. Option B: {description} - Pros: {}, Cons: {}

### Decision
I chose Option {X} because: {reasoning}

## 4. Planned Actions
1. [ ] Action 1 - {description}
2. [ ] Action 2 - {description}

## 5. Execution Log
- {HH:MM:SS} Started: {action}
- {HH:MM:SS} Completed: {action} - Result: {outcome}
- {HH:MM:SS} Issue encountered: {description} - Resolution: {how fixed}

## 6. Self-Review Checklist
- [ ] Did I complete all planned actions?
- [ ] Did I follow project patterns?
- [ ] Are there any side effects?
- [ ] Is documentation needed?

## 7. Summary
{What was accomplished and any important notes}
```

---

## Standard Feedback Loop Protocol

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: RECEIVE TASK                                   │
│  - Parse the request                                    │
│  - Identify thinking level needed                       │
│  - Create thinking log file                             │
├─────────────────────────────────────────────────────────┤
│  STEP 2: ANALYZE (write to thinking log)                │
│  - Understand context                                   │
│  - Identify dependencies                                │
│  - Plan approach                                        │
├─────────────────────────────────────────────────────────┤
│  STEP 3: EXECUTE                                        │
│  - Perform actions                                      │
│  - Log each significant step                            │
│  - Handle errors gracefully                             │
├─────────────────────────────────────────────────────────┤
│  STEP 4: SELF-REVIEW                                    │
│  - Did I complete the task fully?                       │
│  - Are there any issues?                                │
│  - YES issues → Return to STEP 3 with fixes            │
│  - NO issues → Continue to STEP 5                       │
├─────────────────────────────────────────────────────────┤
│  STEP 5: REPORT                                         │
│  - Generate handoff report                              │
│  - Include thinking log location                        │
│  - List all changes made                                │
├─────────────────────────────────────────────────────────┤
│  STEP 6: AWAIT FEEDBACK                                 │
│  - If parent requests changes → Return to STEP 1        │
│  - If approved → Task complete                          │
└─────────────────────────────────────────────────────────┘
```

---

## Standard Handoff Report Format

```markdown
## Agent Handoff Report

### Agent: {name}
### Task: {description}
### Status: ✅ COMPLETE | ⚠️ NEEDS_REVIEW | ❌ FAILED | 🔄 NEEDS_FIXES

### Summary
{Brief description of what was accomplished}

### Files Modified
| File | Change Type | Description |
|------|-------------|-------------|
| path/to/file.py | Created | New API endpoint |
| path/to/other.tsx | Modified | Added error handling |

### Issues Found
| Severity | Issue | Status | Notes |
|----------|-------|--------|-------|
| High | Missing auth check | Fixed | Added Depends(get_current_user) |
| Medium | No error handling | Fixed | Added try/except |
| Low | Missing docstring | Deferred | Not critical |

### Tests Performed
- [ ] Syntax check passed
- [ ] Type check passed
- [ ] Related tests pass
- [ ] Manual verification done

### Recommendations
1. {Recommendation 1}
2. {Recommendation 2}

### Dependencies for Next Steps
- Requires: {what must happen before next step}
- Blocks: {what is waiting for this}

### Thinking Log Location
`.claude/logs/{agent-name}-{timestamp}.md`

### Time Spent
- Analysis: {X} minutes
- Execution: {Y} minutes
- Total: {Z} minutes
```

---

## Thinking Level Guide

| Level | Keyword | Token Usage | When to Use |
|-------|---------|-------------|-------------|
| Basic | `think` | Low | Simple, routine tasks |
| Medium | `think hard` | Medium | Multi-step tasks, some complexity |
| High | `think harder` | High | Complex logic, debugging, integration |
| Maximum | `ultrathink` | Very High | Architecture, critical decisions, security |

### Usage in Prompts
```
think about the best way to name this variable

think hard about how to handle edge cases in this function

think harder about why this bug is occurring and all possible causes

ultrathink about the database schema design and all implications
```
