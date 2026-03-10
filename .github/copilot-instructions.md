# CampX — Global Copilot Instructions

You are working on **CampX**, a hyper-local, trust-first, peer-to-peer campus marketplace for university students.

## Quick Context

- **Two repos**: `campx-client` (React + Vite + TypeScript → Vercel) and `campx-server` (Express + TypeScript + Prisma → Railway)
- **Database**: PostgreSQL 16 on Railway, managed via Prisma ORM (14 models)
- **Auth**: Clerk (Google OAuth + email/password)
- **Payments**: Razorpay escrow (test mode) — funds held until buyer confirms receipt
- **Chat**: Ably real-time messaging
- **Images**: Cloudinary (3 presets: items, IDs, avatars)
- **Maps**: Mapbox GL JS (location picker, campus boundaries)
- **Emails**: Resend (transactional)

## Before Coding ANYTHING

1. Read `context.md` — full architecture, schema, API endpoints, tech stack
2. Read `to-do.md` — current phase and assigned tasks
3. Read `projectstatus.md` — what's done, what's blocked
4. Read `agent.md` — agent-specific rules and coordination protocols

## Three Specialized Agents

This project uses 3 agents working in parallel:

| Agent | Scope | Instruction File |
|---|---|---|
| **Agent F** (Frontend) | `campx-client` repo — UI, components, pages, hooks | `.agents/frontend-agent.md` |
| **Agent B** (Backend) | `campx-server` repo — API, database, services, middleware | `.agents/backend-agent.md` |
| **Agent A** (Admin) | Both repos — admin panel, deployment, cross-repo coordination | `.agents/admin-agent.md` |

**Before starting any task, load the corresponding agent file for your role.**

## Universal Code Rules

- **TypeScript strict mode** — no `any`, no untyped functions
- **Named exports** over default exports (except page components)
- **Zod validation** on every API endpoint and every form
- **JSDoc** on all exported functions
- **No commented-out code** — use git history
- **Commit format**: `{type}({scope}): {description}` (e.g., `feat(auth): add Clerk webhook`)
- **Branch format**: `phase/{number}/{agent}-{description}`

## After Completing Tasks

Update `projectstatus.md` with:
- Tasks completed (reference IDs like `1B.1`, `2F.3`)
- Files created/modified
- Cross-agent requests if any
- Blockers discovered
