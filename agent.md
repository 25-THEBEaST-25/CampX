# CampX — Agent Rules & Coordination

> **Last Updated**: 2026-02-26
> **Agents**: 3 specialized agents + 1 human orchestrator

---

## Agent Overview

| Agent | Name | Domain | Primary Repo | Color Tag | Instruction File |
|---|---|---|---|---|---|
| **F** | Frontend Agent | UI, components, pages, client-side integrations | `campx-client` | 🟦 Blue | `.agents/frontend-agent.md` |
| **B** | Backend Agent | API, database, server-side services, Prisma | `campx-server` | 🟩 Green | `.agents/backend-agent.md` |
| **A** | Admin/Integration Agent | Cross-repo work, admin panel, deployment, testing | Both repos | 🟧 Orange | `.agents/admin-agent.md` |

> **Each agent has a dedicated instruction file** in `.agents/` with complete rules, code patterns, examples, and forbidden actions. Load the appropriate file at the start of every session.

---

## Global Rules (ALL Agents)

### 1. Context Loading Protocol

Every agent session MUST begin by reading these files in order:
1. `context.md` — full project context, architecture, schema, tech stack
2. `to-do.md` — current phase, specific tasks assigned
3. `projectstatus.md` — what's done, what's in progress, blockers
4. `agent.md` (this file) — rules to follow

**If any of these files are missing or outdated, STOP and alert the orchestrator.**

### 2. Task Execution Protocol

```
1. Read context files (above)
2. Identify your assigned tasks for the current phase
3. Check projectstatus.md for dependencies / blockers
4. Implement tasks in order (respect task IDs like 1B.1, 1F.2)
5. After completing each task, update projectstatus.md:
   - Mark task as COMPLETED with timestamp
   - Note any deviations from plan
   - Note any blockers discovered
6. Run verification checks before ending session
7. Provide handoff notes for next agent / next session
```

### 3. Code Standards

#### TypeScript
- **Strict mode**: `strict: true` in tsconfig
- **No `any`**: Use proper types. If type is unknown, create an interface
- **No `as` type assertions** unless absolutely necessary (document why)
- **Named exports** over default exports (except page components)
- **Barrel exports** (`index.ts`) in each directory for clean imports

#### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ItemCard.tsx`, `LocationPicker.tsx` |
| Files (utils/hooks) | camelCase | `useItems.ts`, `api.ts` |
| Files (routes) | PascalCase | `Home.tsx`, `ItemDetail.tsx` |
| React components | PascalCase | `export function ItemCard()` |
| Hooks | camelCase, `use` prefix | `useItems`, `useDebounce` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_IMAGE_SIZE` |
| Types/Interfaces | PascalCase | `Item`, `UserProfile`, `CreateItemInput` |
| Enums (Prisma) | PascalCase | `ListingType`, `ItemStatus` |
| API routes | kebab-case | `/api/wallet/history`, `/api/confirm-receipt` |
| CSS classes | Tailwind utility classes | Never write custom CSS unless unavoidable |
| Environment vars | UPPER_SNAKE_CASE | `VITE_API_URL`, `DATABASE_URL` |

#### Error Handling
- **Backend**: All route handlers wrapped in try-catch. Use `next(error)` for the global error handler
- **Frontend**: TanStack Query `onError` callbacks + Sonner toast
- **Never swallow errors silently** — always log or report
- **API errors**: Return consistent shape `{ error: string, code: string }`

#### Comments
- **JSDoc** for all exported functions (params + return)
- **Inline comments** only for non-obvious logic (WHY, not WHAT)
- **TODO comments**: `// TODO(agent-X): description` — include agent tag
- **No commented-out code** — use git history

### 4. File Ownership Rules

```
Agent F owns:
├── campx-client/src/app/         # All pages except admin/*
├── campx-client/src/components/  # All components
├── campx-client/src/hooks/       # All hooks
├── campx-client/src/lib/         # Client utilities
├── campx-client/src/types/       # Shared frontend types
├── campx-client/src/styles/      # CSS
└── campx-client/public/          # Static assets

Agent B owns:
├── campx-server/src/routes/      # All route handlers
├── campx-server/src/middleware/  # All middleware
├── campx-server/src/services/   # All service modules
├── campx-server/src/validators/ # Zod schemas
├── campx-server/src/lib/        # Server utilities
├── campx-server/src/types/      # Server types
├── campx-server/prisma/         # Schema + migrations + seed
└── campx-server/src/index.ts    # App entry

Agent A owns:
├── campx-client/src/app/routes/admin/*  # Admin panel pages
├── campx-client/vercel.json             # Deployment config
├── campx-server/railway.json            # Deployment config
├── campx-server/Dockerfile              # Docker config
├── context.md                             # Project context
├── to-do.md                               # Plan updates
├── projectstatus.md                       # Status tracking
└── agent.md                               # This file
```

**Cross-ownership rule**: If an agent needs to modify a file owned by another agent, they MUST:
1. Document the change needed in `projectstatus.md` under "Cross-Agent Requests"
2. Make the change with a comment: `// Modified by Agent X for: reason`
3. Note it in their handoff notes

### 5. API Contract Rules

When Agent B creates/modifies an API endpoint:
1. Document the endpoint in `context.md` API table (or note it for Agent A to update)
2. Define the request/response TypeScript types in `campx-server/src/types/`
3. Agent F must mirror these types in `campx-client/src/types/`

**Types must be kept in sync manually.** Any type change by Agent B must be flagged in `projectstatus.md` for Agent F to pick up.

### 6. Git Conventions

#### Branch Naming
```
phase/{number}/{agent}-{description}
Examples:
  phase/1/backend-prisma-setup
  phase/1/frontend-clerk-auth
  phase/3/frontend-browse-page
  phase/4/backend-razorpay
```

#### Commit Messages
```
{type}({scope}): {description}

Types: feat, fix, refactor, style, docs, test, chore
Scope: auth, items, payments, chat, wallet, admin, ui, db

Examples:
  feat(auth): add Clerk webhook endpoint for user sync
  feat(items): implement browse page with filters and pagination
  fix(payments): correct escrow release calculation
  refactor(db): add index on items.collegeId for performance
  docs(api): update endpoint documentation in context.md
```

#### PR Rules
- One PR per task group (e.g., all Phase 1 Backend tasks = 1 PR)
- PR description must reference task IDs: "Implements 1B.1, 1B.2, 1B.3"
- Must pass lint + type check before merge

---

## Agent-Specific Rules

### Agent F (Frontend) — 🟦

#### Tech Mandates
- **shadcn/ui** for all UI primitives — never build a Button, Card, Input, etc. from scratch
- **Framer Motion** for all animations — no CSS transitions/keyframes for component animations
- **TanStack Query** for ALL server state — never use `useState` + `useEffect` to fetch data
- **React Hook Form + Zod** for all forms — never use uncontrolled forms or `useState` for form state
- **Clerk hooks** (`useAuth`, `useUser`, `useClerk`) for all auth state — never store tokens manually

#### Design System & Visual Identity

> **Style**: Material Design foundations with a youthful, energetic campus vibe

##### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0A0A0A` | Page background (near-black) |
| `--surface` | `#121212` | Cards, modals, sheets |
| `--surface-variant` | `#1E1E1E` | Elevated surfaces, hover states |
| `--primary` | `#A855F7` (purple-500) | Primary accent — buttons, links, active states |
| `--primary-light` | `#C084FC` (purple-400) | Hover states, highlights |
| `--primary-dark` | `#7C3AED` (purple-600) | Pressed states, deeper accents |
| `--secondary` | `#E9D5FF` (purple-100) | Tags, badges, subtle highlights |
| `--text-primary` | `#FAFAFA` | Headings, body text |
| `--text-secondary` | `#A1A1AA` (zinc-400) | Muted text, captions |
| `--text-tertiary` | `#71717A` (zinc-500) | Placeholders, disabled text |
| `--border` | `#27272A` (zinc-800) | Card borders, dividers |
| `--success` | `#22C55E` | Confirmed, delivered, positive states |
| `--warning` | `#F59E0B` | Pending, attention needed |
| `--destructive` | `#EF4444` | Errors, cancellations, delete actions |

##### Typography

| Role | Font Family | Weight | Usage |
|---|---|---|---|
| **Brand / Logo** | `Fairplay Display` | 700 (Bold) | "CampX" wordmark, hero headings |
| **Body / UI** | `Poppins` | 300–600 | All other text — headings, body, buttons, captions |

Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Tailwind config:
```typescript
fontFamily: {
  brand: ['"Playfair Display"', 'serif'],
  sans: ['Poppins', 'system-ui', 'sans-serif'],
}
```

Usage:
- `font-brand` — only for the "CampX" logo text and major hero headings
- `font-sans` (default) — everything else (Poppins is the base font)

##### Gradient Buttons & Glow

Primary action buttons use a **purple gradient with a subtle glow**:

```css
/* Primary gradient button */
.btn-primary-gradient {
  background: linear-gradient(135deg, #7C3AED, #A855F7, #C084FC);
  color: #FAFAFA;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.35);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.btn-primary-gradient:hover {
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.55);
  transform: translateY(-1px);
}
.btn-primary-gradient:active {
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
  transform: translateY(0);
}
```

Tailwind utility approach (preferred):
```tsx
<Button
  className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400
             text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]
             hover:shadow-[0_0_30px_rgba(168,85,247,0.55)]
             hover:-translate-y-0.5 transition-all duration-200"
>
  List Item
</Button>
```

**Button hierarchy**:
| Variant | Style | Use Case |
|---|---|---|
| Primary (CTA) | Purple gradient + glow | Main actions: "List Item", "Buy Now", "Send Offer" |
| Secondary | `bg-surface-variant` + purple text | Supporting actions: "Save", "Filter" |
| Ghost | Transparent + purple text | Tertiary actions: "Cancel", "Back" |
| Destructive | Red solid | Dangerous actions: "Delete", "Report" |

##### Visual Details

- **Border radius**: `rounded-xl` (12px) on cards, `rounded-lg` (8px) on buttons/inputs
- **Card style**: Dark surface (`bg-[#121212]`) with `border border-zinc-800` and subtle hover glow
- **Hover glow on cards**: `hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]`
- **Elevation**: Use `box-shadow` glow instead of Material Design's grey shadow — keeps the dark-theme cohesion
- **Animations**: Smooth Framer Motion springs (`type: "spring", stiffness: 300, damping: 25`)
- **Iconography**: Lucide React icons, 20px default size, `text-zinc-400` default color
- **Spacing rhythm**: 4px base grid — use Tailwind spacing scale (`p-2`, `p-4`, `gap-3`, `gap-6`)

#### Component Architecture
```
// Every component follows this structure:

// 1. Imports
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

// 2. Types
interface ItemCardProps {
  item: Item
  onFavorite?: (id: string) => void
}

// 3. Component (named export)
export function ItemCard({ item, onFavorite }: ItemCardProps) {
  // 3a. Hooks (query, mutations, state)
  // 3b. Derived values
  // 3c. Handlers
  // 3d. Render
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* JSX */}
    </motion.div>
  )
}
```

#### Responsive Breakpoints
```
sm: 640px   — small tablets
md: 768px   — tablets
lg: 1024px  — small laptops
xl: 1280px  — desktops
2xl: 1536px — large screens

Default grid: 1 col → sm:2 cols → lg:3 cols → xl:4 cols
```

#### Loading States (mandatory)
Every page/component that fetches data MUST have:
1. **Skeleton loader** (shimmer) during initial load
2. **Error state** with retry button
3. **Empty state** with illustration/message
4. **Optimistic updates** for mutations (favorites, etc.)

#### Image Handling
- All images use Cloudinary URL transformations for responsive sizes
- `<img>` tags must have `loading="lazy"`, `alt` text, `width`, `height`
- Use Cloudinary auto-format: append `f_auto,q_auto` to URLs
- Helper function in `lib/cloudinary.ts`:
  ```typescript
  export function cloudinaryUrl(url: string, width: number): string {
    // Transform Cloudinary URL to add width, format, quality
  }
  ```

### Agent B (Backend) — 🟩

#### Tech Mandates
- **Prisma** for ALL database operations — never write raw SQL unless Prisma can't handle it
- **Zod** for ALL request validation — validate body, params, and query in every endpoint
- **Clerk SDK** for auth verification — never manually decode JWTs
- **Async/await** everywhere — never use callbacks or `.then()` chains

#### Route Handler Pattern
```typescript
// Every route handler follows this structure:

import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/middleware/auth"
import { validate } from "@/middleware/validate"

const router = Router()

// Zod schema
const createItemSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  // ...
})

// Route handler
router.post("/", requireAuth, validate(createItemSchema), async (req, res, next) => {
  try {
    const { title, description } = req.body
    const userId = req.user!.id

    const item = await prisma.item.create({
      data: { title, description, sellerId: userId },
    })

    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

export default router
```

#### Database Rules
- **Never** bypass Prisma with raw queries for standard CRUD
- **Always** use `select` or `include` — never return full models with relations you don't need
- **Always** add `where` clauses for ownership checks (don't trust request params alone)
- **Cursor-based pagination** for all list endpoints:
  ```typescript
  const items = await prisma.item.findMany({
    take: 20,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
  })
  ```
- **Transactions** for multi-table operations (payment verification, fund release)
  ```typescript
  await prisma.$transaction(async (tx) => {
    // Multiple operations that must all succeed
  })
  ```

#### Security Rules
- **CORS**: Only allow `FRONTEND_URL` origin in production
- **Rate limiting**: Per-endpoint limits (see Phase 8)
- **Input validation**: Zod on EVERY endpoint — no exceptions
- **Authorization**: Check ownership/participation before EVERY mutation
- **Sensitive data**: Never log passwords, tokens, payment details
- **Webhooks**: Always verify signatures (Clerk, Razorpay)
- **Service role key**: Razorpay secret, Clerk secret, Ably key — NEVER expose to frontend

#### Prisma Migration Protocol
1. Modify `schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Run `npx prisma generate`
4. Update `seed.ts` if new tables need seed data
5. Document schema changes in `projectstatus.md`

### Agent A (Admin/Integration) — 🟧

#### Responsibilities
1. **Admin Panel UI** — all pages under `/admin/*`
2. **Deployment Configuration** — Vercel + Railway configs
3. **Cross-repo coordination** — ensure types are in sync
4. **Documentation** — keep `context.md`, `to-do.md`, `projectstatus.md` updated
5. **Testing** — end-to-end flow verification
6. **Environment setup** — `.env.example` files, setup guides

#### Admin Panel Rules
- Reuse shadcn/ui components from Agent F's setup
- Admin pages should be functional over beautiful — data tables, forms, action buttons
- Use `DataTable` pattern (shadcn + TanStack Table) for all admin lists
- Every admin action must have a confirmation dialog
- All admin routes protected by `isAdmin` check (Clerk metadata)

#### Coordination Rules
- After each phase, verify:
  - [ ] Frontend types match backend response shapes
  - [ ] API endpoints documented in context.md
  - [ ] No hardcoded URLs (use env vars)
  - [ ] Both repos build without errors
  - [ ] projectstatus.md is current

---

## Inter-Agent Communication

### Handoff Template

When ending a session, every agent must write in `projectstatus.md`:

```markdown
### Handoff from Agent [F/B/A] — [Date]

**Completed Tasks**: [list task IDs]

**Files Created/Modified**:
- `path/to/file.ts` — description of what it does

**Known Issues**:
- Issue description + which agent should fix it

**Blockers for Next Agent**:
- What's missing that the next agent needs

**Cross-Agent Requests**:
- "Agent B: I need the POST /api/items response to include `isFavorited` boolean"
- "Agent F: The Clerk webhook now sends `user.updated` events too, update the types"

**Next Up**:
- What tasks should be done next (reference task IDs)
```

### Type Sync Protocol

When backend changes a response shape:
1. Agent B updates `campx-server/src/types/index.ts`
2. Agent B notes in `projectstatus.md`: "TYPE CHANGE: Item response now includes `isFavorited: boolean`"
3. Agent F picks this up and updates `campx-client/src/types/index.ts`

### API Contract Freeze

After Phase 3, the core API endpoints are **frozen**. No breaking changes without:
1. Notification in `projectstatus.md`
2. Both agents acknowledging the change
3. Frontend updating within the same phase

---

## Quality Gates Per Phase

Before a phase is marked COMPLETE, ALL of these must pass:

### Phase Gate Checklist
- [ ] All assigned tasks marked completed
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors
- [ ] Backend: all endpoints return expected responses (manual test)
- [ ] Frontend: all pages render without console errors
- [ ] `projectstatus.md` updated with completion status
- [ ] Handoff notes written
- [ ] `context.md` updated if architecture/API changed

---

## Emergency Protocols

### "I'm Stuck" Protocol
If an agent encounters a blocker:
1. Document it in `projectstatus.md` under "Blockers"
2. Describe what was attempted
3. Suggest potential solutions
4. Tag which agent can help: "NEEDS Agent B" / "NEEDS Agent F"
5. Move on to the next non-blocked task if possible

### "Something Broke" Protocol
If an agent's change breaks something:
1. **Don't panic** — document what broke
2. If it's in your own repo: fix it immediately
3. If it's in another agent's repo: add to "Cross-Agent Requests" in projectstatus.md
4. Never silently modify another agent's code without documentation

### "Scope Creep" Protocol
If a task is growing beyond its planned scope:
1. Complete the core requirement first
2. Note enhancements as "NICE TO HAVE" in projectstatus.md
3. Don't implement enhancements unless all core tasks in the phase are done
4. Move enhancements to Phase 8 (Polish) if needed

---

## Environment Setup Guide (For Each Agent's First Session)

### Agent B — First Session Setup
```bash
# 1. Create repo
mkdir campx-server && cd campx-server
git init
npm init -y

# 2. Install dependencies
npm install express @clerk/express razorpay ably resend cloudinary cors helmet express-rate-limit zod @prisma/client dotenv
npm install -D typescript @types/express @types/node @types/cors tsx prisma eslint

# 3. Initialize TypeScript + Prisma
npx tsc --init
npx prisma init

# 4. Set up .env from .env.example
cp .env.example .env
# Fill in credentials

# 5. Push schema + seed
npx prisma migrate dev --name init
npx prisma db seed
```

### Agent F — First Session Setup
```bash
# 1. Create repo
npm create vite@latest campx-client -- --template react-ts
cd campx-client

# 2. Install dependencies
npm install @clerk/clerk-react @tanstack/react-query react-router-dom framer-motion ably mapbox-gl react-map-gl react-hook-form @hookform/resolvers zod sonner lucide-react date-fns clsx tailwind-merge class-variance-authority @radix-ui/react-slot
npm install -D tailwindcss postcss autoprefixer @types/mapbox-gl

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Initialize shadcn/ui
npx shadcn-ui@latest init

# 5. Install shadcn components
npx shadcn-ui@latest add button card input badge skeleton dropdown-menu avatar separator tooltip sheet select textarea tabs dialog

# 6. Set up .env from .env.example
cp .env.example .env
# Fill in credentials
```
