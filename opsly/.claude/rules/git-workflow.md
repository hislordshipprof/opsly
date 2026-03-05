# Git Workflow Rules — OPSLY

## Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `docs`: Documentation only
- `test`: Adding/updating tests
- `chore`: Build, config, dependencies
- `perf`: Performance improvement
- `style`: Formatting (no code change)

### Scope
- `auth`: Authentication/RBAC
- `work-orders`: Work order module
- `properties`: Properties/units module
- `websocket`: WebSocket gateway/events
- `escalations`: Escalation system
- `metrics`: KPI/metrics module
- `ai`: AI agents, ADK, Gemini
- `voice`: Voice widget, Gemini Live
- `dashboard`: Manager command center
- `tenant`: Tenant portal
- `technician`: Technician view
- `prisma`: Schema, migrations, seed
- `config`: Environment, Docker, deploy

### Examples

```bash
# Feature
feat(work-orders): add work order creation with auto-priority

# Bug fix
fix(websocket): correct JWT validation on handshake

# Refactor
refactor(auth): extract role validation to shared guard

# Multiple changes
feat(dashboard): implement manager command center

- Add KPI cards with WebSocket updates
- Add live work order table
- Create SLA countdown timer component
```

## Branch Strategy — MANDATORY

Every milestone or major implementation MUST be built on its own branch off `main`.
**NEVER commit milestone work directly to main.**

```
main (protected — merge only via PR or user-approved merge)
  └── milestone-1/foundation
  └── milestone-2/work-orders
  └── milestone-3/websockets
  └── milestone-4/gemini-vision
  └── milestone-5/ai-agents
  └── milestone-6/voice
  └── milestone-7/dashboard
  └── milestone-8/technician-voice
  └── milestone-9/escalations
  └── milestone-10/demo-polish
  └── fix/auth-token-refresh
  └── refactor/prisma-queries
```

### Branch Naming
- `milestone-N/<short-name>` — Milestone branches (ALWAYS create before starting milestone work)
- `fix/<description>` — Bug fixes
- `refactor/<description>` — Code improvements
- `hotfix/<description>` — Urgent fixes on main

### Workflow for Each Milestone
```
1. Ensure you are on main and it is up to date
2. Create branch: git checkout -b milestone-N/<name>
3. Do all work on this branch (commit frequently)
4. When milestone is verified complete, push branch
5. Merge to main only when user approves (PR or local merge)
6. Next milestone: checkout main, pull, create new branch
```

### Merging Rules
- Merge milestone branches to main only after ALL tasks in the milestone are DONE
- User must approve the merge — never auto-merge
- After merging, the next milestone branch is created off the updated main

## Protected Rules

- **NEVER** force push to main
- **NEVER** commit directly to main (all work on milestone/feature branches)
- **NEVER** commit secrets or credentials (.env, API keys)
- **NEVER** skip pre-commit hooks without approval
- **NEVER** add `Co-Authored-By` lines to commits
- **NEVER** commit files outside `opsly/backend/` and `opsly/frontend/` (except `.gitignore`)

## What Goes to the Repo (Enforced by .gitignore)

**TRACKED** — only source code:
- `opsly/backend/` — NestJS app
- `opsly/frontend/` — React app
- `.gitignore` — repo config

**IGNORED** — everything else is local-only:
- `CallSphere/` — reference repo
- `CLAUDE.md` — Claude build instructions (root + opsly/)
- `opsly/.claude/` — rules, agents, skills, settings
- `opsly/.tasks/` — milestone tracking
- `opsly/OPSLY_PRD.md` — product spec
- `.env` files, secrets, credentials

## When to Commit

- After completing each task within a milestone
- When a module passes its verification criteria
- Before switching context to a different module
- Frequently enough to not lose work
