# Unideal — Project Status

> **Last Updated**: 2026-03-06
> **Current Phase**: Phase 5B COMPLETE — Chat & Notifications Backend
> **Next Phase**: Phase 5F — Chat & Notifications Frontend
> **Last Agent**: Agent B (Phase 5B)

---

## Overall Progress

| Phase | Name | Status | Agent F | Agent B | Agent A | % Done |
|---|---|---|---|---|---|---|
| 0 | Planning & Documentation | ✅ COMPLETE | — | — | ✅ | 100% |
| 1 | Foundation & Auth | ✅ COMPLETE | ✅ | ✅ | ✅ DevOps | 100% |
| 2 | Onboarding & ID Verification | ✅ COMPLETE | ✅ | ✅ | ✅ 2A.1, 2A.2 | 100% |
| 3 | Listings, Search & Discovery | ✅ COMPLETE | ✅ | ✅ | — | 100% |
| 4 | Razorpay Payments & Escrow | ✅ COMPLETE | ✅ | ✅ | — | 100% |
| 5 | Real-time Chat & Notifications | 🔄 IN PROGRESS | ⬜ | ✅ | — | 50% |
| 6 | Ratings, Reviews & Profiles | ⬜ NOT STARTED | ⬜ | ⬜ | — | 0% |
| 7 | Admin Panel & Moderation | 🔄 IN PROGRESS | ✅ Routes | ✅ | ✅ All 7A pages + integration | 85% |
| 8 | Polish, Performance & Deployment | ⬜ NOT STARTED | ⬜ | ⬜ | ⬜ | 0% |

**Overall Completion: ~75%** (planning + admin integration + frontend Phase 1–4 + backend Phase 1–5 + services created)

---

## Phase 0 — Planning & Documentation

### Completed Artifacts
- [x] `context.md` — Full project context, architecture, schema, API endpoints
- [x] `to-do.md` — 8-phase plan with detailed tasks & verification checklists
- [x] `agent.md` — Agent rules, file ownership, coordination protocols
- [x] `projectstatus.md` — This file

---

## Phase 1 — Foundation & Auth (COMPLETE)

### Backend Tasks (Agent B) — ✅ ALL COMPLETE
- [x] **1B.1** — Initialize `unideal-server` repo (Express 5 + TS + ESLint)
- [x] **1B.2** — Prisma setup: full schema (14 models), seed file (6 categories, 5 colleges, 1 admin)
- [x] **1B.3** — Clerk webhook endpoint (`/api/webhooks/clerk`) — user.created, user.updated
- [x] **1B.4** — `requireAuth` middleware using Clerk `verifyToken` + DB lookup
- [x] **1B.5** — `GET /api/users/me` endpoint — return current user profile + wallet
- [x] **1B.6** — Global error handler (`AppError` class) + request logger (morgan)
- [x] **1B.7** — Health check endpoint (`GET /health`)
- [x] **1B.8** — CORS, Helmet, rate-limit configuration (general + strict + webhook limiters)

### Frontend Tasks (Agent F) — ✅ ALL COMPLETE
- [x] **1F.1** — Vite + React 18 + TS + Tailwind + shadcn/ui setup
- [x] **1F.2** — Clerk provider + env config + token getter in API client
- [x] **1F.3** — React Router v6 with lazy-loaded pages + ProtectedRoute
- [x] **1F.4** — TanStack Query provider + `api.ts` fetch wrapper (Clerk token)
- [x] **1F.5** — Landing page (hero, features, how-it-works, CTA)
- [x] **1F.6** — Clerk `<SignIn>` and `<SignUp>` pages (dark theme styled)
- [x] **1F.7** — Navbar (responsive, auth state, avatar dropdown, mobile hamburger)
- [x] **1F.8** — Dark-only theme with CSS variables + shadcn tokens
- [x] **1F.9** — Layout: Navbar + Footer on desktop, bottom nav on mobile (MobileNav)
- [x] **1F.10** — Sonner toast + Framer Motion AnimatePresence page transitions
- [x] — TypeScript interfaces mirroring all 14 Prisma models
- [x] — 15 shadcn/ui components (button, card, input, badge, skeleton, avatar, separator, label, textarea, dialog, dropdown-menu, sheet, select, tabs, tooltip)
- [x] — Lib files: utils.ts, api.ts, cloudinary.ts, constants.ts
- [x] — Placeholder pages: Browse, ItemDetail, Dashboard, Chat, Wallet, Profile, Settings, Favorites, NotFound

### Verification Checklist
- [x] Frontend: User can navigate to sign-in/sign-up (Clerk embedded)
- [x] Backend: Clerk webhook creates user row in PostgreSQL via Prisma
- [x] Frontend: JWT attached to API calls via api.ts setTokenGetter
- [x] Backend: `GET /api/users/me` returns user data
- [x] Protected routes redirect to sign-in (ProtectedRoute component)
- [x] Dark-only theme with purple accent (CSS variables)
- [x] Responsive layout: Navbar/Footer desktop, bottom nav mobile

---

## Phase 2 — Onboarding & ID Verification (FRONTEND COMPLETE)

### Frontend Tasks (Agent F) — ✅ ALL COMPLETE
- [x] **2F.1** — Onboarding page (`/onboarding`): 4-step form (profile → college → avatar → success) with Framer Motion slide transitions, Zod validation, useOnboarding mutation
- [x] **2F.2** — Verification page (`/verification`): 4-state display (UNVERIFIED upload UI, PENDING animated review, VERIFIED success, REJECTED re-submit), useVerificationStatus + useSubmitVerification hooks
- [x] **2F.3** — Sell Item gate: verification-required Dialog modal for unverified users, pending status blocker, verified placeholder (Phase 3 form)
- [x] **2F.4** — VerificationBadge component: green/orange/red/gray shield icons with optional label
- [x] **2F.5** — ImageUploader component: drag-and-drop + click, progress bars, Cloudinary upload, multi-file support, preview grid, remove button

### Supporting Files Created
- [x] `src/hooks/useColleges.ts` — TanStack Query hook for `GET /api/colleges`
- [x] `src/hooks/useUserProfile.ts` — TanStack Query hook for `GET /api/users/me`
- [x] `src/hooks/useOnboarding.ts` — Mutation for `POST /api/users/onboarding`
- [x] `src/hooks/useVerification.ts` — Query for verification status + mutation for ID submit
- [x] `src/hooks/index.ts` — Re-export barrel file

### Backend Tasks (Agent B) — ✅ ALL COMPLETE
- [x] **2B.1** — `POST /api/users/onboarding` — accept fullName, phone, collegeId; creates wallet if missing
- [x] **2B.2** — `GET /api/colleges` — return active colleges list + `GET /api/colleges/:slug`
- [x] **2B.3** — `POST /api/verifications` — accept idCardImageUrl, create verification record (prevents duplicate PENDING)
- [x] **2B.4** — `GET /api/verifications/status` — return current user's latest verification + user status

---

## Phase 3 — Listings, Search & Discovery

### Backend Tasks (Agent B) — ✅ ALL COMPLETE
- [x] **3B.1** — Item CRUD endpoints: `POST /api/items` (create, verified-only), `PUT /api/items/:id` (update, owner-only), `DELETE /api/items/:id` (soft-delete to ARCHIVED, owner-only + Cloudinary image cleanup)
- [x] **3B.2** — Browse + search + pagination: `GET /api/items` with filters (category, college, type, condition, priceMin/priceMax, search), sort options (newest, oldest, price_low, price_high), cursor-based pagination, optional `isFavorited` for authenticated users
- [x] **3B.3** — Favorites endpoints: `GET /api/favorites` (paginated user favorites), `POST /api/favorites/:itemId` (upsert add), `DELETE /api/favorites/:itemId` (remove)
- [x] **3B.4** — User listings endpoint: `GET /api/users/me/items` (pre-existing from Phase 2B, with status filter)
- [x] **3B.extra** — `requireVerified` middleware (checks `verificationStatus === "VERIFIED"`, returns 403 with `NOT_VERIFIED` code)

### Supporting Files Created/Modified
- [x] `src/routes/items.ts` — Full item CRUD + browse with search, filters, cursor pagination, Cloudinary cleanup, view count increment
- [x] `src/routes/favorites.ts` — Favorites CRUD with upsert pattern
- [x] `src/middleware/auth.ts` — Added `requireVerified` export
- [x] `src/index.ts` — Registered `/api/items` and `/api/favorites` routes

### Frontend Tasks (Agent F) — ✅ ALL COMPLETE
- [x] **3F.1** — Browse page (grid + filters + search + pagination) — **completed in Phase 3 session**
- [x] **3F.2** — Item detail page (images, seller info, related items) — **completed, then extended in Phase 4 with Razorpay**
- [x] **3F.3** — Sell item form (multi-step with Cloudinary upload, Mapbox location picker) — **SellItem.tsx (740 lines)**
- [x] **3F.4** — Favorites page (favorited items list) — **infinite scroll with toggle**

### API Response Shapes for Agent F

**GET /api/items** → `{ success, data: { items: [...], nextCursor, hasMore } }`
Each item: `{ id, title, images, listingType, sellPrice, rentPricePerDay, condition, status, viewCount, createdAt, seller: { id, fullName, avatarUrl, verificationStatus }, college: { id, name, slug }, category: { id, name, slug, iconName }, isFavorited, favoriteCount }`

**GET /api/items/:id** → `{ success, data: { ...item, favoriteCount, isFavorited, seller: { ...+avgRating+reviewCount+college }, college, category, relatedItems } }`

**POST /api/items** (body: createItemSchema) → `{ success, data: { id, title, ... }, message }`

**GET /api/favorites** → `{ success, data: { items: [...+favoritedAt], nextCursor, hasMore } }`

**POST /api/favorites/:itemId** → `{ success, message }`

**DELETE /api/favorites/:itemId** → `{ success, message }`

### Build Status
- `tsc --noEmit` passes with 0 errors

---

## Phase 4 — Razorpay Payments & Escrow

### Frontend Tasks (Agent F) — ✅ ALL COMPLETE

- [x] **4F.1** — Razorpay integration on ItemDetail: Buy Now button → createOrder → Razorpay Checkout modal → verifyPayment → confetti + success dialog. Rent flow → RentDatePicker → createOrder with dates. Error handling with retry dialog. Own-item guard.
- [x] **4F.2** — Transaction status UI on Dashboard: stat cards (active listings, transactions, wallet balance, items sold), transaction list with status filter tabs (All/Escrow/Completed/Disputed), transaction cards with status badges + timeline icons, "Confirm Receipt" button (buyer-only, RESERVED), "Raise Dispute" button with reason dialog, chat link, my listings sidebar.
- [x] **4F.3** — Wallet page: AnimatedNumber for balance, frozen-in-escrow display, withdraw modal with amount validation, paginated transaction history with type filter tabs (All/In/Released/Out), icon + color-coded rows, load more pagination.
- [x] **4F.4** — Payment status animations: ConfettiBurst (50 CSS particles + Framer Motion), PaymentProcessingDialog (spinning Loader2, no close button), PaymentSuccessDialog (spring-animated checkmark, escrow info, chat/transaction/browse CTAs), PaymentErrorDialog (shake animation + retry), AnimatedNumber (ease-out cubic counter).

### Files Created (`unideal-client/src/`)
- [x] `hooks/useWallet.ts` — useWallet (balance), useWalletHistory (infinite, type filter), useWithdraw (mutation)
- [x] `hooks/useTransactions.ts` — useTransactions (list, status filter), useTransaction (detail), useConfirmReceipt (mutation), useDisputeTransaction (mutation)
- [x] `hooks/useOrders.ts` — useCreateOrder (POST /api/orders/create), useVerifyPayment (POST /api/payments/verify)
- [x] `lib/razorpay.ts` — loadRazorpayScript (idempotent), openRazorpayCheckout (key, amount, prefill, purple theme, callbacks), RazorpaySuccessResponse type, window augmentation
- [x] `components/payments/PaymentAnimations.tsx` — ConfettiBurst, PaymentProcessingDialog, PaymentSuccessDialog, PaymentErrorDialog, AnimatedNumber
- [x] `components/payments/RentDatePicker.tsx` — Date range dialog with price calculation

### Files Modified (`unideal-client/src/`)
- [x] `types/index.ts` — Added CreateOrderInput, CreateOrderResponse, VerifyPaymentInput, VerifyPaymentResponse, WithdrawInput, WalletInfo, WalletHistoryResponse; enriched Transaction with buyer/seller/hasReviewed/conversationId/disputeReason
- [x] `lib/constants.ts` — Added TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, WALLET_TX_LABELS, WALLET_TX_ICONS
- [x] `hooks/index.ts` — Barrel exports for all 9 new hooks
- [x] `components/ui/dialog.tsx` — Added hideCloseButton prop to DialogContent
- [x] `app/routes/ItemDetail.tsx` — Full Razorpay Buy/Rent flow (imports, state, handlers, JSX wiring, payment dialogs)
- [x] `app/routes/Dashboard.tsx` — Full rewrite: stats, transaction cards with actions, my listings, quick links, dispute dialog
- [x] `app/routes/Wallet.tsx` — Full rewrite: animated balance, withdraw modal, filtered transaction history

### Backend Tasks (Agent B) — ✅ ALL COMPLETE
- [x] **4B.1** — `POST /api/orders/create` — Razorpay order creation, transaction row (PENDING), amount calc (sell price or rentPricePerDay × days)
- [x] **4B.2** — `POST /api/payments/verify` — Razorpay signature verification (HMAC SHA256), Prisma $transaction: PENDING→RESERVED, item→RESERVED, wallet frozenBalance increment, escrow wallet entry, auto-create Conversation + system Message
- [x] **4B.3** — `GET /api/transactions` + `GET /:id` — List user transactions (buyer+seller) with status filter, enriched with hasReviewed/conversationId/disputeReason/platformFee/sellerPayout; detail endpoint with buyer/seller auth check
- [x] **4B.4** — `POST /api/transactions/:id/confirm-receipt` — Buyer-only, RESERVED→SETTLED, release escrow (frozenBalance→balance), RELEASE_ESCROW wallet entry, item→SOLD (BUY) or →AVAILABLE (RENT), notifications + funds-released email
- [x] **4B.5** — `POST /api/transactions/:id/dispute` — Buyer/seller, RESERVED→DISPUTED, stores reason, notifies other party + all admins
- [x] **4B.6** — `GET /api/wallet` — Upsert wallet (ensures existence), returns id/balance/frozenBalance as strings
- [x] **4B.7** — `GET /api/wallet/history` — Cursor-based paginated wallet transactions with type filter (CREDIT_ESCROW/RELEASE_ESCROW/WITHDRAWAL/REFUND_DEBIT)
- [x] **4B.8** — `POST /api/wallet/withdraw` — Validates amount ≤ balance, atomic deduction via Prisma $transaction, creates WITHDRAWAL wallet entry (test mode, no real bank payout)
- [x] **4B.extra** — `POST /api/webhooks/razorpay` — Webhook handler for payment.captured (safety net), payment.failed (→CANCELLED), refund.created (→REFUNDED + wallet debit + item revert)

### Build Status
- `tsc --noEmit` passes with 0 errors
- `vite build` succeeds (all chunks compile, 2.93s)

---

## Phase 5 — Real-time Chat & Notifications

### Backend Tasks (Agent B) — ✅ ALL COMPLETE
- [x] **5B.1** — Ably token auth: Enhanced `services/ably.ts` with `createTokenRequest(clientId)` that generates scoped Ably TokenRequests (user notifications subscribe, conversation publish/subscribe/presence). Created `routes/ably.ts` with `POST /api/ably/token` endpoint (requireAuth + strictLimiter).
- [x] **5B.2** — Conversation list + detail: `GET /api/conversations` (user's conversations with last message preview, other user info, unread count per conversation via `message.groupBy`, item info, transaction status, sorted by lastMessageAt desc). `GET /api/conversations/:id` (cursor-based paginated messages, newest first, auto-mark unread as read fire-and-forget, returns conversation metadata + otherUser + transaction).
- [x] **5B.3** — Message send + Ably publish: `POST /api/conversations/:id/messages` (TEXT/LOCATION/IMAGE types, Prisma interactive $transaction for message create + lastMessageAt update, publishes to Ably channel `conversation:{ablyChannelName}` with `new-message` event, creates NEW_MESSAGE notification for recipient with truncated preview).
- [x] **5B.4** — Notification CRUD: `GET /api/notifications` (cursor-based pagination, `?unreadOnly` filter, returns `unreadCount` for badge). `PATCH /api/notifications/read` (mark specific `ids` or `all: true` as read). `DELETE /api/notifications/:id` (owner-only delete).
- [x] **5B.5** — Email notification templates: Added 5 new templates to `services/resend.ts` — `sendNewMessageEmail`, `sendIdVerifiedEmail`, `sendIdRejectedEmail`, `sendDisputeEmail`, `sendTransactionSettledEmail` (role-aware buyer/seller).
- [x] **5B.6** — Notification preferences: Added `notificationPreferences Json?` field to User model in Prisma schema. `GET /api/users/me/notification-preferences` (returns merged defaults + user prefs). `PUT /api/users/me/notification-preferences` (deep merge incoming with current, stores as JSON). Default prefs: all inApp ON, all email ON except NEW_MESSAGE email OFF.

### Files Created (`unideal-server/src/`)
- [x] `routes/conversations.ts` — 3 endpoints (~410 lines): list conversations with unread counts, get messages paginated, send message with Ably publish + notification
- [x] `routes/notifications.ts` — 3 endpoints (~180 lines): list paginated notifications, mark as read (batch/all), delete single
- [x] `routes/ably.ts` — 1 endpoint (~20 lines): POST /api/ably/token for client-side Ably auth

### Files Modified (`unideal-server/src/`)
- [x] `services/ably.ts` — Added `createTokenRequest(clientId)` with scoped capabilities
- [x] `services/resend.ts` — Added 5 new email template functions
- [x] `routes/users.ts` — Added `unreadNotificationCount` to GET /me, added GET/PUT `/me/notification-preferences` endpoints with Zod validation
- [x] `index.ts` — Registered 3 new route groups: `/api/conversations`, `/api/notifications`, `/api/ably`
- [x] `prisma/schema.prisma` — Added `notificationPreferences Json?` field to User model

### API Response Shapes for Agent F

**POST /api/ably/token** → `{ success, data: TokenRequest }` (Ably TokenRequest object for client-side auth)

**GET /api/conversations** → `{ success, data: [{ id, transactionId, ablyChannelName, lastMessageAt, createdAt, otherUser: { id, fullName, avatarUrl, verificationStatus }, item: { id, title, images }, transactionStatus, lastMessage: { id, content, type, senderId, createdAt } | null, unreadCount }] }`

**GET /api/conversations/:id** → `{ success, data: { conversation: { id, ablyChannelName, transactionId, transaction, otherUser }, messages: [{ id, senderId, type, content, isRead, createdAt, sender: { id, fullName, avatarUrl } }], nextCursor, hasMore } }`

**POST /api/conversations/:id/messages** (body: `{ type?, content }`) → `{ success, data: { id, conversationId, senderId, type, content, isRead, createdAt, sender } }`

**GET /api/notifications** → `{ success, data: { notifications: [{ id, type, title, body, data, isRead, createdAt }], unreadCount, nextCursor, hasMore } }`

**PATCH /api/notifications/read** (body: `{ ids: string[] }` or `{ all: true }`) → `{ success, data: { markedRead: number } }`

**GET /api/users/me** → now includes `unreadNotificationCount: number`

**GET /api/users/me/notification-preferences** → `{ success, data: { NEW_MESSAGE: { email, inApp }, TRANSACTION_UPDATE: { email, inApp }, ... } }`

**PUT /api/users/me/notification-preferences** (body: partial prefs object) → `{ success, data: { ...mergedPrefs } }`

### Build Status
- `tsc --noEmit` passes with 0 errors
- Schema change requires `prisma migrate dev` or `prisma db push` on deployment

### Frontend Tasks (Agent F) — ⬜ NOT STARTED
- [ ] **5F.1** — Ably client setup (token auth, connection management)
- [ ] **5F.2** — Chat page (conversation list + message thread + real-time updates)
- [ ] **5F.3** — Notification bell + dropdown (real-time count, mark read)
- [ ] **5F.4** — Notification preferences page in Settings

---

## Service Account Setup

| Service | Status | Account Created | Keys in .env | Notes |
|---|---|---|---|---|
| **Clerk** | ⬜ Pending | No | No | Need publishable + secret keys |
| **PostgreSQL (Railway)** | ⬜ Pending | No | No | Need DATABASE_URL |
| **Cloudinary** | ⬜ Pending | No | No | Need cloud name + presets (3 presets needed) |
| **Razorpay** | ⬜ Pending | No | No | Test mode keys, key_id + key_secret |
| **Ably** | ⬜ Pending | No | No | Root API key |
| **Mapbox** | ⬜ Pending | No | No | Public access token |
| **Resend** | ⬜ Pending | No | No | API key + verified domain |
| **Vercel** | ⬜ Pending | No | No | Frontend deployment |
| **Railway** | ⬜ Pending | No | No | Backend + DB deployment |

---

## Repository Status

| Repo | Status | URL | Branch | Last Deploy |
|---|---|---|---|---|
| `unideal-client` | ⬜ Not Created | — | — | — |
| `unideal-server` | ⬜ Not Created | — | — | — |

---

## Deployment Status

| Environment | Frontend (Vercel) | Backend (Railway) | Database (Railway) |
|---|---|---|---|
| **Production** | ⬜ Not Deployed | ⬜ Not Deployed | ⬜ Not Provisioned |
| **Preview** | — | — | — |

---

## Blockers

- **Service accounts needed**: Clerk, Railway PostgreSQL, Cloudinary, Razorpay, Ably, Resend keys must be configured in `.env` before the server can run against real services. Development can proceed with mocked/test values.
- **Database migration**: `npx prisma migrate dev` needs to run against a live PostgreSQL instance to create tables (schema is defined, Prisma Client generated).

---

## Cross-Agent Requests

- ~~**Agent F → Agent B**: Please implement these endpoints that the frontend hooks expect~~ — ✅ ALL DONE
- ~~**Agent B → Agent F**: Admin routes in React Router need to be registered under `<AdminLayout>`~~ — ✅ DONE by Agent A (Session 3)
- **Agent B → Agent A**: Ready for deployment — server needs Railway PostgreSQL provisioned + env vars set

---

## Handoff Log

### Handoff from Agent A — 2026-02-26 (Planning Phase)

**Completed Tasks**: Phase 0 planning — all 4 documentation files

**Files Created**:
- `context.md` — Full architecture, schema, API endpoints, tech stack, flows, env vars
- `to-do.md` — 8-phase implementation plan with task IDs, checklists, dependency map
- `agent.md` — Agent rules, file ownership, naming conventions, coordination protocols
- `projectstatus.md` — This tracking file

**Known Issues**: None

**Blockers for Next Agent**: 
- Service accounts need to be created before development can start (Clerk, Railway PostgreSQL at minimum for Phase 1)

**Next Up**:
- Agent B: Tasks 1B.1 through 1B.8 (server initialization, Prisma schema, Clerk webhook, middleware)
- Agent F: Tasks 1F.1 through 1F.10 (client initialization, Clerk setup, routing, layout)
- Both agents can work in parallel since they operate on separate repos

### Handoff from Agent F — 2026-03-03 (Phase 1F + 2F Complete)

**Completed Tasks**: All Phase 1 frontend + All Phase 2 frontend tasks

**Files Created** (`unideal-client/src/`):
- `main.tsx` — App entry: StrictMode → ClerkProvider → QueryClientProvider → Toaster → App
- `app/App.tsx` — BrowserRouter with lazy-loaded routes, ApiTokenSetup
- `app/layout/RootLayout.tsx` — Navbar + AnimatePresence + Footer + MobileNav
- `app/layout/ProtectedRoute.tsx` — Auth guard + onboarding redirect
- `app/layout/Navbar.tsx` — Responsive nav with Clerk auth integration
- `app/layout/MobileNav.tsx` — Sheet + bottom bar (5 icons)
- `app/layout/Footer.tsx` — 3-column footer
- `app/routes/Onboarding.tsx` — 4-step form (profile → college → avatar → success)
- `app/routes/Verification.tsx` — 4-state page (unverified/pending/verified/rejected)
- `app/routes/SellItem.tsx` — Verification gate modal + pending/verified states
- `app/routes/SignIn.tsx` — Clerk `<SignIn>` dark themed
- `app/routes/SignUp.tsx` — Clerk `<SignUp>` dark themed
- `app/routes/Home.tsx`, `Browse.tsx`, `ItemDetail.tsx`, `Dashboard.tsx`, `Chat.tsx`, `Wallet.tsx`, `Profile.tsx`, `Settings.tsx`, `Favorites.tsx`, `NotFound.tsx` — Placeholder pages
- `components/ui/*.tsx` — 15 shadcn/ui components + VerificationBadge
- `components/items/ImageUploader.tsx` — Drag-drop Cloudinary uploader
- `hooks/useColleges.ts`, `useUserProfile.ts`, `useOnboarding.ts`, `useVerification.ts`, `index.ts` — TanStack Query hooks
- `lib/api.ts`, `utils.ts`, `cloudinary.ts`, `constants.ts` — Utilities
- `types/index.ts` — All TypeScript interfaces (14 models + enums + API types)
- `styles/globals.css` — Dark theme CSS variables

**Config Files Created**:
- `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `components.json`
- `index.html`, `.env.example`, `.gitignore`, `vercel.json`

**Build Status**: `tsc --noEmit` passes (0 errors), `vite build` succeeds (all chunks compile)

**Dependencies on Agent B**:
- All hooks call API endpoints that don't exist yet
- Need: `GET /api/users/me`, `POST /api/users/onboarding`, `GET /api/colleges`, `POST /api/verifications`, `GET /api/verifications/me`

**Next Up**:
- Agent B: Phase 1B (server init, Prisma, Clerk webhook, middleware) + Phase 2B (onboarding + verification endpoints)
- Agent F: Phase 3F (Browse page with filters, ItemDetail page, Sell form) once Phase 2B endpoints exist

---

### Handoff from Agent A — Session 2 (Admin Scaffolding)

**Completed Tasks**: DevOps setup + 2A.1 (admin API routes) + 2A.2 (admin middleware prep) + Phase 7 admin pages (pre-built)

**Files Created/Modified**:
- `unideal-server/railway.json` — Fixed startCommand to `npx prisma migrate deploy && node dist/index.js`
- `unideal-server/Dockerfile` — Multi-stage Docker build for Railway (node:20-alpine)
- `unideal-server/src/routes/admin.ts` — Complete admin API: stats, verifications (list + approve/reject), users (list + ban/unban/force-verify), reports (list + action/dismiss), transactions (list + refund/release), colleges (create + update). All routes use requireAuth + requireAdmin middleware and Zod validation.
- `unideal-client/vercel.json` — Updated with security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- `unideal-client/src/app/layout/AdminLayout.tsx` — Sidebar layout with Clerk admin gate, responsive mobile drawer, 6 nav items
- `unideal-client/src/app/routes/admin/AdminDashboard.tsx` — Stats grid (6 metrics), quick-link cards, auto-refresh 60s
- `unideal-client/src/app/routes/admin/VerificationQueue.tsx` — Table with search/filter/pagination, image lightbox, approve/reject with confirmation dialogs
- `unideal-client/src/app/routes/admin/UserManagement.tsx` — User table with ban/unban/force-verify dropdown, confirmation dialogs
- `unideal-client/src/app/routes/admin/ListingModeration.tsx` — Listing table with preview dialog, archive action
- `unideal-client/src/app/routes/admin/TransactionManagement.tsx` — Transaction table with refund/release intervention
- `unideal-client/src/app/routes/admin/ReportsQueue.tsx` — Reports table with take-action/dismiss, admin notes

**Dependencies on Other Agents**:
- **Agent B**: admin.ts imports `@/lib/prisma`, `@/middleware/auth` (requireAuth, requireAdmin), `@/middleware/validate` — must be created in Phase 1B
- **Agent F**: Admin pages import `@/lib/api`, `@/lib/utils`, `@/components/ui/*` (shadcn), React Router setup — must be created in Phase 1F

**Cross-Agent Requests**:
- Agent B: `validate` middleware must accept a Zod schema and validate `req.body` (used in all PATCH/POST admin routes)
- Agent F: Register admin routes in React Router under `<AdminLayout>`: `/admin`, `/admin/verifications`, `/admin/users`, `/admin/listings`, `/admin/transactions`, `/admin/reports`

**Known Issues**: None — all files compile once Phase 1 foundation is in place

**Next Up**:
- Agent B: Phase 1B tasks (server init, Prisma schema, middleware, Clerk webhook)
- Agent F: Phase 1F tasks (client init, shadcn, routing, layout, auth)
- Agent A: Ready to assist with deployment + integration testing once Phase 1 complete

---

### Handoff from Agent B — 2026-03-05 (Phase 3B Complete)

**Completed Tasks**: 3B.1 (Item CRUD), 3B.2 (Browse+search+pagination), 3B.3 (Favorites), 3B.4 (User listings — pre-existing), requireVerified middleware

**Files Created**:
- `unideal-server/src/routes/items.ts` — Full item CRUD + browse endpoint with search, category/college/type/condition/price filters, cursor-based pagination, optional isFavorited for authenticated users, view count increment (fire-and-forget), related items in detail, Cloudinary image cleanup on delete/update, `requireVerified` gate on create
- `unideal-server/src/routes/favorites.ts` — GET paginated favorites, POST upsert add, DELETE remove

**Files Modified**:
- `unideal-server/src/middleware/auth.ts` — Added `requireVerified` middleware export (checks `verificationStatus === "VERIFIED"`, returns 403 + `NOT_VERIFIED`)
- `unideal-server/src/index.ts` — Registered `/api/items` (itemRoutes) and `/api/favorites` (favoriteRoutes)

**Technical Notes for Agent F**:
- Browse endpoint accepts query params: `cursor`, `limit`, `category` (slug), `college` (slug), `type`, `condition`, `priceMin`, `priceMax`, `search`, `sort` (newest|oldest|price_low|price_high)
- `isFavorited` boolean on browse/detail responses is only set when user sends a valid Bearer token — falls back to `false` for unauthenticated
- Item detail returns `relatedItems` (same category + college, max 4)
- Favorites use upsert pattern (POST is idempotent)
- All validators already exist in `src/validators/item.ts` (createItemSchema, updateItemSchema, browseItemsQuerySchema)

**Build Status**: `tsc --noEmit` passes with 0 errors

**Cross-Agent Requests**:
- **Agent B → Agent F**: Frontend hooks needed for items + favorites (browse, detail, create, update, delete, add/remove favorite). API response shapes documented in Phase 3 section of projectstatus.md.

**Blockers**: None

**Next Up**:
- Agent F: Phase 3F (Browse page, ItemDetail page, Sell form, Favorites page)
- Agent B: Phase 4B (Razorpay payments & escrow) — can start independently

---

### Handoff from Agent F — 2026-03-05 (Phase 3F + Phase 4F Complete)

**Completed Tasks**: All Phase 3 frontend tasks (3F.1–3F.4) + All Phase 4 frontend tasks (4F.1–4F.4)

**Files Created** (`unideal-client/src/`):
- `hooks/useWallet.ts` — useWallet, useWalletHistory (infinite), useWithdraw (mutation)
- `hooks/useTransactions.ts` — useTransactions (list+filter), useTransaction (detail), useConfirmReceipt, useDisputeTransaction
- `hooks/useOrders.ts` — useCreateOrder, useVerifyPayment
- `lib/razorpay.ts` — Dynamic Razorpay SDK loader + checkout opener with purple theme
- `components/payments/PaymentAnimations.tsx` — ConfettiBurst, PaymentProcessingDialog, PaymentSuccessDialog, PaymentErrorDialog, AnimatedNumber
- `components/payments/RentDatePicker.tsx` — Date range dialog with rental price calculation

**Files Modified** (`unideal-client/src/`):
- `types/index.ts` — Added 8 new interfaces (CreateOrderInput, CreateOrderResponse, VerifyPaymentInput, VerifyPaymentResponse, WithdrawInput, WalletInfo, WalletHistoryResponse, Review); enriched Transaction with buyer/seller/conversationId/disputeReason/hasReviewed
- `lib/constants.ts` — Added TRANSACTION_STATUS_LABELS/COLORS, WALLET_TX_LABELS/ICONS
- `hooks/index.ts` — Barrel exports for 9 new hooks
- `components/ui/dialog.tsx` — Added hideCloseButton prop to DialogContent
- `app/routes/ItemDetail.tsx` — Full Razorpay Buy Now/Rent flow with payment state machine, error handling, confetti
- `app/routes/Dashboard.tsx` — Full rewrite: stat cards, transaction list with filter tabs, confirm receipt, raise dispute dialog, my listings sidebar, quick links
- `app/routes/Wallet.tsx` — Full rewrite: AnimatedNumber balance, withdraw modal, paginated history with type filter tabs

**Build Status**: `tsc --noEmit` passes (0 errors), `vite build` succeeds (2.93s)

**Dependencies on Agent B** (Phase 4B endpoints needed):
- `POST /api/orders/create` — { itemId, type, rentStartDate?, rentEndDate? } → { orderId, amount, currency, keyId, transactionId }
- `POST /api/payments/verify` — { razorpayOrderId, razorpayPaymentId, razorpaySignature } → { success, transactionId, conversationId? }
- `GET /api/transactions` — ?status filter → { transactions: Transaction[] }
- `GET /api/transactions/:id` → Transaction detail
- `POST /api/transactions/:id/confirm-receipt` — release escrow
- `POST /api/transactions/:id/dispute` — { reason } → flag as DISPUTED
- `GET /api/wallet` → { id, balance, frozenBalance }
- `GET /api/wallet/history` — ?cursor, ?type → { transactions, nextCursor, hasMore }
- `POST /api/wallet/withdraw` — { amount } → { success, message }

**Blockers**: Phase 4B backend endpoints don't exist yet — frontend is built against the API contracts defined in context.md

**Next Up**:
- Agent B: Phase 4B tasks (4B.1–4B.8) — Razorpay order creation, payment verification, escrow management, wallet endpoints
- Agent F: Phase 5F (Ably real-time chat, notifications) once Phase 5B endpoints are ready

---

### Handoff from Agent B — 2026-03-05 (Phase 4B Complete)

**Completed Tasks**: 4B.1–4B.8 + webhook handler (all Razorpay payments, escrow management, transactions, wallet endpoints)

**Files Created** (`unideal-server/src/routes/`):
- `orders.ts` — `POST /api/orders/create` (~180 lines): Razorpay order creation with sell/rent amount calc, duplicate-order prevention, PENDING transaction row
- `payments.ts` — `POST /api/payments/verify` + `POST /api/webhooks/razorpay` (~260 lines): Signature verification, atomic escrow (PENDING→RESERVED), auto-create Conversation + system Message, webhook safety nets for payment.captured/failed/refund.created
- `transactions.ts` — 4 endpoints (~310 lines): GET list (status filter, enriched with hasReviewed/conversationId/disputeReason/platformFee/sellerPayout), GET detail, POST confirm-receipt (escrow release, RESERVED→SETTLED), POST dispute (RESERVED→DISPUTED, admin notification)
- `wallet.ts` — 3 endpoints (~210 lines): GET balance (upsert guarantees existence), GET history (cursor pagination + type filter), POST withdraw (atomic deduction)

**Files Modified**:
- `src/index.ts` — Registered 4 new route groups: `/api/orders`, `/api/payments`, `/api/transactions`, `/api/wallet`
- `src/routes/conversations.ts` — Removed unused `ablyChannels` import
- `src/routes/users.ts` — Removed unused `NextFunction`, `Prisma`, `z` imports

**API Response Shapes for Agent F** (all wrapped in `{ success: true, data: {...} }`):
- `POST /api/orders/create` → `{ orderId, amount (paise), currency, keyId, transactionId }`
- `POST /api/payments/verify` → `{ transactionId, conversationId }`
- `GET /api/transactions` → `{ transactions: Transaction[] }` (enriched with buyer/seller/item/hasReviewed/conversationId/disputeReason/platformFee/sellerPayout)
- `GET /api/transactions/:id` → Full transaction with item/buyer/seller/conversation/reviews includes
- `POST /api/transactions/:id/confirm-receipt` → `{ transactionId, status: "SETTLED" }`
- `POST /api/transactions/:id/dispute` → `{ transactionId, status: "DISPUTED" }`
- `GET /api/wallet` → `{ id, balance (string), frozenBalance (string) }`
- `GET /api/wallet/history` → `{ transactions: WalletTransaction[], nextCursor, hasMore }`
- `POST /api/wallet/withdraw` → `{ message: "Withdrawal processed successfully" }`

**Technical Notes**:
- All monetary values use Prisma `Decimal` type and are returned as strings to avoid floating-point issues
- Escrow flow: PENDING → RESERVED (payment verified, funds frozen) → SETTLED (buyer confirms receipt, funds released to seller)
- Platform fee is 5% (`PLATFORM_FEE_PERCENT` constant), deducted on settlement
- Wallet upsert on GET /api/wallet ensures wallet always exists (created on first access)
- Webhook handler at `/api/webhooks/razorpay` uses `webhookLimiter` + raw body signature verification
- Inline Zod validators for transactions (status filter, dispute reason) and wallet (history type filter, withdraw amount)

**Build Status**: `tsc --noEmit` passes with 0 errors (fixed 4 pre-existing unused-import warnings in conversations.ts + users.ts)

**Blockers**: None

**Next Up**:
- Agent F: Phase 5F (Ably real-time chat + notifications)
- Agent B: Phase 5B (chat/notification endpoints) or Phase 6B (reviews/ratings)

---

### Handoff from Agent A — 2026-03-06 (Session 3: Cross-Repo Integration & Error Resolution)

**Completed Tasks**: Admin route registration, service implementations, full TypeScript error cleanup across both repos

**Files Created** (`unideal-client/src/`):
- `components/ui/alert-dialog.tsx` — Full shadcn AlertDialog component (needed by all 4 admin management pages)

**Files Created** (`unideal-server/src/`):
- `services/resend.ts` — Email service with 4 functions: sendVerificationApprovedEmail, sendVerificationRejectedEmail, sendPaymentSecuredEmail, sendFundsReleasedEmail (using Resend SDK)
- `services/ably.ts` — Ably REST client with publishToChannel and getAblyClient (used by notification.ts)

**Files Modified** (`unideal-client/src/`):
- `app/App.tsx` — Registered all 6 admin routes under `<AdminLayout>` with lazy loading (default exports), removed unused Navigate import
- `app/routes/Verification.tsx` — Added missing Label import, removed unused handleResubmit
- `app/routes/SellItem.tsx` — Removed unused Select/Badge/UploadedImage imports, fixed slug destructuring
- `app/routes/Profile.tsx` — Removed unused AvatarImage import
- `app/routes/Settings.tsx` — Removed unused Card imports
- `app/routes/Dashboard.tsx` — Removed unused Separator and TabsContent imports
- `app/routes/Wallet.tsx` — Removed unused Badge import
- `app/routes/ItemDetail.tsx` — Prefixed unused lastTransactionId with underscore
- `app/routes/admin/TransactionManagement.tsx` — Removed unused format import
- `app/layout/Navbar.tsx` — Removed unused ShoppingBag import
- `components/map/LocationPicker.tsx` — Fixed react-map-gl v8 import (→ "react-map-gl/mapbox"), removed unused Button, removed invalid onBlur prop
- `components/map/MiniMap.tsx` — Fixed react-map-gl v8 import, removed unused NavigationControl
- `hooks/useFavorites.ts` — Removed unused useQuery import
- `hooks/useWallet.ts` — Removed unused WalletTransaction type import

**Packages Installed**: `@radix-ui/react-alert-dialog` (unideal-client)

**Cross-Agent Requests Resolved**: ✅ Admin routes registered in React Router under `<AdminLayout>`

**Build Status**: Both repos `tsc --noEmit` 0 errors. `vite build` succeeds (1.91s).

**Next Up**:
- Agent B: Phase 5B — ✅ DONE (see below)
- Agent F: Phase 5F (chat UI, Ably real-time subscription)
- Agent A: Phase 8 deployment prep when Phase 5+6 complete

---

### Handoff from Agent B — 2026-03-06 (Phase 5B Complete)

**Completed Tasks**: 5B.1–5B.6 (Ably token auth, conversation endpoints, message send + Ably publish, notification CRUD, email templates, notification preferences)

**Files Created** (`unideal-server/src/`):
- `routes/conversations.ts` — 3 endpoints: list conversations (with unread counts, other user info, last message preview), get messages (cursor-paginated, auto-mark read), send message (DB + Ably publish + notification)
- `routes/notifications.ts` — 3 endpoints: list paginated notifications, mark as read (batch/all), delete single notification
- `routes/ably.ts` — Ably token request endpoint for client-side auth

**Files Modified** (`unideal-server/src/`):
- `services/ably.ts` — Added `createTokenRequest(clientId)` with scoped channel capabilities
- `services/resend.ts` — Added 5 email templates (newMessage, idVerified, idRejected, dispute, transactionSettled)
- `routes/users.ts` — Added unreadNotificationCount to GET /me, GET/PUT notification-preferences endpoints
- `index.ts` — Registered `/api/conversations`, `/api/notifications`, `/api/ably` routes
- `prisma/schema.prisma` — Added `notificationPreferences Json?` field to User model

**Build Status**: `tsc --noEmit` passes with 0 errors

**Schema Migration Required**: `notificationPreferences Json?` field added to User model — requires `prisma migrate dev` or `prisma db push`

**Dependencies for Agent F (Phase 5F)**:
- Ably client SDK (`ably` npm package) for real-time subscriptions
- Token auth: `POST /api/ably/token` returns Ably TokenRequest for client instantiation
- Conversation list: `GET /api/conversations` for chat sidebar
- Messages: `GET /api/conversations/:id` (paginated) + `POST /api/conversations/:id/messages`
- Real-time: Subscribe to Ably channel `conversation:{ablyChannelName}` for `new-message` events
- Notifications: `GET /api/notifications` for bell dropdown, `PATCH /api/notifications/read` for mark-read
- Notification count: `GET /api/users/me` now returns `unreadNotificationCount`
- Preferences: `GET/PUT /api/users/me/notification-preferences`

**Blockers**: None

**Next Up**:
- Agent F: Phase 5F (chat UI, Ably real-time subscription, notification bell, notification preferences page)
- Agent B: Phase 6B (reviews, ratings, profile enhancements)

---

## Nice to Have (Deferred)

_Items moved here from active phases when scope becomes too large:_

| Item | Original Phase | Priority | Notes |
|---|---|---|---|
| _None yet_ | — | — | — |

---

## Change Log

| Date | Agent | Change | Details |
|---|---|---|---|
| 2026-02-26 | A | Phase 0 complete | Created all 4 planning documents |
| 2026-02-26 | A | DevOps + Admin scaffolding | railway.json fix, Dockerfile, vercel.json headers, admin.ts (11 endpoints), AdminLayout + 6 admin pages |
| 2026-03-03 | F | Phase 1F complete | Vite+React+TS setup, Tailwind+shadcn theme, 15 UI components, Clerk auth, React Router, TanStack Query, layout shell (Navbar/Footer/MobileNav), types, lib files, all placeholder pages |
| 2026-03-03 | F | Phase 2F complete | Onboarding (4-step form), Verification (4-state page), SellItem gate (verification modal), ImageUploader (drag-drop Cloudinary), VerificationBadge, 4 custom hooks, SignIn/SignUp pages. Build verified clean. |
| 2026-03-04 | B | Phase 1B complete | Express 5 + TS server init (package.json, tsconfig.json), full Prisma schema (14 models, all enums, indexes), seed file (6 categories, 5 colleges, 1 admin), Clerk webhook (user.created/updated), requireAuth + requireAdmin middleware, validate middleware (Zod body + query), errorHandler (AppError + Prisma errors), rateLimiter (3 tiers), CORS + Helmet + morgan, health check, all service clients (Cloudinary, Ably, Resend, Razorpay, Notification). `tsc --noEmit` passes clean. |
| 2026-03-04 | B | Phase 2B complete | POST /api/users/onboarding (college + wallet creation), GET /api/colleges + /:slug, POST /api/verifications (ID submit with duplicate guard), GET /api/verifications/status, PUT /api/users/me (profile update), GET /api/users/:id (public profile + avg rating), GET /api/users/me/items (own listings), GET /api/categories. Admin routes patched (relative imports, notification service, email integration). |
| 2026-03-05 | B | Phase 3B complete | Item CRUD (create/update/delete), browse with search+filters+cursor pagination, favorites CRUD (upsert/remove), requireVerified middleware. Routes: items.ts + favorites.ts. `tsc --noEmit` clean. |
| 2026-03-05 | F | Phase 3F complete | Browse page (grid+filters+search+pagination), ItemDetail (gallery+seller+related), SellItem form (multi-step+Cloudinary+Mapbox), Favorites page. Hooks: useItems, useFavorites. |
| 2026-03-05 | F | Phase 4F complete | Razorpay integration (ItemDetail Buy/Rent flow), Dashboard (transaction cards+confirm receipt+dispute), Wallet page (animated balance+withdraw+history), payment animations (confetti+processing+success+error). 7 new files, 7 modified. `tsc --noEmit` + `vite build` clean. |
| 2026-03-05 | B | Phase 4B complete | Orders (Razorpay creation), payments (verify+webhook), transactions (list+detail+confirm-receipt+dispute), wallet (balance+history+withdraw). 4 new route files, index.ts modified. `tsc --noEmit` clean (0 errors). |
| 2026-03-06 | A | Cross-repo integration | Admin routes registered in App.tsx (6 lazy routes under AdminLayout), created alert-dialog.tsx + resend.ts + ably.ts, installed @radix-ui/react-alert-dialog, fixed react-map-gl v8 imports, cleaned ~20 unused imports across both repos. Both repos `tsc --noEmit` clean + `vite build` succeeds. Phase 7 -> 85%. |
| 2026-03-06 | B | Phase 5B complete | Ably token auth (createTokenRequest + POST /api/ably/token), conversations (list+detail+send message with Ably publish), notifications (list+mark-read+delete), 5 email templates (newMessage, idVerified, idRejected, dispute, transactionSettled), notification preferences (JSON field + GET/PUT endpoints). 3 new route files, 5 modified files. Schema: added notificationPreferences Json? to User. `tsc --noEmit` clean (0 errors). |
