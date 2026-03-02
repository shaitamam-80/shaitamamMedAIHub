# Claude Code Agent System for MedAI Hub

This directory contains the complete agent system for AI-assisted development of MedAI Hub.

## Directory Structure

```
.claude/
├── README.md                 # This file
├── AGENT_TEMPLATE.md         # Template for creating new agents
├── settings.json             # Hooks, permissions, and configuration
├── agents/                   # Agent definitions
│   ├── orchestrator.md       # 🎯 Master coordinator (NEW)
│   ├── backend-agent.md      # 🐍 FastAPI/Python specialist (NEW)
│   ├── frontend-agent.md     # ⚛️ Next.js/React specialist (NEW)
│   ├── ui-ux-agent.md        # 🎨 Design/UX specialist (NEW)
│   ├── devops-agent.md       # 🚀 CI/CD/Infrastructure (NEW)
│   ├── qa-agent.md           # ✅ Quality assurance
│   ├── api-sync-agent.md     # 🔄 Backend/frontend sync
│   ├── hebrew-validator.md   # 🔤 Hebrew content validation
│   ├── db-migration-agent.md # 🗄️ Database changes
│   ├── docs-agent.md         # 📝 Documentation maintenance
│   ├── deploy-checker.md     # 🚦 Deployment readiness
│   ├── parallel-work-agent.md # ⚡ Parallel development
│   ├── code-reviewer.md      # 🔍 Code review specialist
│   ├── security-reviewer.md  # 🔒 Security audit specialist
│   └── debugger.md            # 🐛 Debug & fix specialist
├── commands/                 # Custom slash commands
│   ├── new-feature.md       # /project:new-feature
│   ├── fix-bug.md           # /project:fix-bug
│   ├── add-endpoint.md      # /project:add-endpoint
│   ├── parallel-tasks.md    # /project:parallel-tasks
│   ├── pre-deploy.md        # /project:pre-deploy
│   ├── review-code.md       # /project:review-code
│   ├── review-security.md   # /project:review-security
│   └── review-pr.md         # /project:review-pr
└── logs/                     # Thinking logs and activity logs
    ├── sessions.log         # Session start timestamps
    ├── activity.log         # File modification log
    └── reminders.log        # Action reminders
```

## Quick Start

### Using Commands

```
/project:new-feature Add batch review capability for multiple abstracts
/project:fix-bug Query generation returns Hebrew characters
/project:add-endpoint POST /api/v1/review/batch for batch screening
/project:parallel-tasks Backend API + Frontend UI for export feature
/project:pre-deploy Production deployment check
/project:review-code Review my recent changes
/project:review-security Full security audit
/project:review-pr Review this branch as a PR
```

### Calling Agents Directly

```
Call @qa-agent to review my changes
Call @api-sync-agent to verify backend/frontend sync
Call @hebrew-validator to check query output
Call @db-migration-agent to create schema changes
Call @docs-agent to update documentation
Call @deploy-checker to verify deployment readiness
Call @parallel-work-agent to set up parallel development
```

### Using Review Agents (Natural Language)

```
Use code-reviewer to review the recent changes
Use security-reviewer to check this project for vulnerabilities
Use debugger to fix the build error
Review the code I changed since the last commit
Check src/auth/ for security issues
Run the tests and fix any failures
```

## Core Principles

### 1. Every Agent Writes a Thinking Log

Before taking action, agents write their reasoning to `.claude/logs/{agent-name}-{timestamp}.md`

This enables:
- Transparency in decision making
- Debugging when things go wrong
- Learning from past approaches

### 2. Feedback Loops

Every agent follows this cycle:
1. Receive task
2. Analyze and plan (write to thinking log)
3. Execute
4. Self-review
5. Report results
6. Iterate if needed

### 3. Structured Handoffs

Agents communicate via standardized reports:
- Status (Complete/Needs Fixes/Failed)
- Files modified
- Issues found
- Recommendations
- Thinking log location

### 4. Thinking Levels

Use appropriate depth for the task:

| Keyword | Use For |
|---------|---------|
| `think` | Simple tasks |
| `think hard` | Moderate complexity |
| `think harder` | Complex problems |
| `ultrathink` | Critical decisions |

## Agent Responsibilities

| Agent | Specialty | When to Call |
|-------|-----------|--------------|
| @orchestrator | **Master coordinator** | Complex requests, multi-agent workflows |
| @backend-agent | FastAPI, Python, APIs | Backend code changes, new endpoints |
| @frontend-agent | Next.js, React, TypeScript | Frontend code changes, UI implementation |
| @ui-ux-agent | Design, accessibility, UX | New screens, UI improvements, design specs |
| @devops-agent | CI/CD, infrastructure | Deployments, monitoring, infrastructure |
| @qa-agent | Code quality, testing | After any code changes |
| @api-sync-agent | Backend/frontend sync | After API changes |
| @hebrew-validator | Hebrew detection | Query-related changes |
| @db-migration-agent | Database schema | Schema changes |
| @docs-agent | Documentation | After any significant changes |
| @deploy-checker | Deployment readiness | Before deployments |
| @parallel-work-agent | Parallel development | Multiple concurrent tasks |
| @code-reviewer | Code quality review | Review code changes, before merges |
| @security-reviewer | Security audit | Security checks, vulnerability scanning |
| @debugger | Bug diagnosis & fixing | Build errors, test failures, runtime bugs |

### Agent Hierarchy

```
                    ┌─────────────────┐
                    │  @orchestrator  │
                    │ (coordinates)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ @ui-ux-agent  │   │@backend-agent │   │@frontend-agent│
│   (design)    │   │   (API/DB)    │   │    (UI)       │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │           ┌───────┴───────┐           │
        │           │               │           │
        ▼           ▼               ▼           ▼
┌───────────────────────────────────────────────────────┐
│                    @qa-agent (reviews all)             │
├───────────────────────────────────────────────────────┤
│  @api-sync-agent  │  @hebrew-validator  │  @docs-agent│
└───────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌─────────────┐   ┌─────────────┐
            │@deploy-check│   │@devops-agent│
            └─────────────┘   └─────────────┘
```

## Hooks

The `settings.json` configures automatic hooks:

### On Session Start
- Creates log directory
- Records session timestamp

### Before File Write
- Blocks writes to protected files (.env, secrets)

### After Python File Write
- Syntax check with py_compile
- Logs to activity.log

### After TypeScript File Write
- Type check with tsc
- Logs to activity.log

### After Route/Schema/API Changes
- Logs reminder to update documentation

## Parallel Development

For working on multiple features simultaneously:

1. Use Git Worktrees to isolate branches
2. Use Task Tool for parallel execution
3. Coordinate merges via @parallel-work-agent

```bash
# Create worktrees
git worktree add ../medai-hub-feature-a -b feature/a
git worktree add ../medai-hub-feature-b -b feature/b

# Work in parallel
# Each worktree gets its own Claude Code session

# Merge when done
git merge feature/a
git merge feature/b
git worktree remove ../medai-hub-feature-a
git worktree remove ../medai-hub-feature-b
```

## Creating New Agents

1. Copy `AGENT_TEMPLATE.md`
2. Fill in agent-specific details
3. Add to `agents/` directory
4. Register in `settings.json` if auto-triggers needed

## Creating New Commands

1. Create markdown file in `commands/`
2. Add YAML frontmatter with description
3. Use `$ARGUMENTS` for user input
4. Define phases with agent callouts

## Log Files

### sessions.log
Records session start times for tracking work history.

### activity.log
Records file modifications with timestamps.

### reminders.log
Collects action reminders from hooks (e.g., "Update documentation").

### {agent}-{timestamp}.md
Detailed thinking logs from agent executions.

## Best Practices

1. **Always check reminders.log** before ending a session
2. **Use the right thinking level** for task complexity
3. **Let agents finish their feedback loops** before interrupting
4. **Review thinking logs** when debugging unexpected behavior
5. **Keep CLAUDE.md updated** - it's the project's memory

## Troubleshooting

### Agent not responding as expected
- Check the thinking log for its reasoning
- Verify the agent file hasn't been corrupted
- Try calling with more specific instructions

### Hooks not firing
- Check `settings.json` syntax (valid JSON)
- Verify matcher patterns are correct
- Check hook commands work in bash

### Parallel tasks conflicting
- Use Git Worktrees for file isolation
- Check @parallel-work-agent's conflict analysis
- Consider phased execution instead

## Version History

- **v3.0** (2026-03-02): Review agents and commands
  - NEW: @code-reviewer - Code quality and pattern review
  - NEW: @security-reviewer - Security audit and vulnerability scanning
  - NEW: @debugger - Bug diagnosis and fix specialist
  - NEW: /project:review-code - Code review command
  - NEW: /project:review-security - Security audit command
  - NEW: /project:review-pr - Comprehensive PR review (3 agents in parallel)
  - Total: 15 agents, 8 commands

- **v2.0** (2024-12-01): Complete agent system with specialists
  - NEW: @orchestrator - Master coordinator for complex workflows
  - NEW: @backend-agent - FastAPI/Python specialist
  - NEW: @frontend-agent - Next.js/React specialist
  - NEW: @ui-ux-agent - Design and accessibility specialist
  - NEW: @devops-agent - CI/CD and infrastructure specialist
  - Total: 12 agents, 5 commands
  - Full hierarchy with orchestration support
  
- **v1.0** (2024-12-01): Initial agent system
  - 7 agents: qa, api-sync, hebrew-validator, db-migration, docs, deploy-checker, parallel-work
  - 5 commands: new-feature, fix-bug, add-endpoint, parallel-tasks, pre-deploy
  - Hooks for syntax checking and reminders
