# CampX — Phase-Wise Plan & To-Do

> **Last Updated**: 2026-02-26
> **Total Phases**: 8
> **Each phase is scoped to fit within a single Claude Opus 4.6 context window (~200K tokens)**

---

## Phase Overview

| Phase | Name | Agent(s) | Priority | Status |
|---|---|---|---|---|
| 1 | Foundation & Auth | F + B | **P0** | NOT STARTED |
| 2 | Onboarding & ID Verification | F + B + A | **P0** | NOT STARTED |
| 3 | Listings, Search & Discovery | F + B | **P0** | NOT STARTED |
| 4 | Razorpay Payments & Escrow | F + B | **P0** | NOT STARTED |
| 5 | Real-time Chat & Notifications | F + B | **P1** | NOT STARTED |
| 6 | Ratings, Reviews & Profiles | F + B | **P1** | NOT STARTED |
| 7 | Admin Panel & Moderation | F + B + A | **P1** | NOT STARTED |
| 8 | Polish, Performance & Deployment | F + B + A | **P2** | NOT STARTED |

**Agent Key**: F = Frontend Agent, B = Backend Agent, A = Admin/Integration Agent

---

## Phase 1: Foundation & Auth

> **Goal**: Both repos scaffolded, connected, Clerk auth working end-to-end, layout shell ready, dark mode functional.
> **Estimated Scope**: ~150 files created, ~3000 LOC

### Backend Tasks (Agent B)

- [ ] **1B.1** Initialize `campx-server` repo with Express 5 + TypeScript
  - `package.json` with all dependencies
  - `tsconfig.json` with strict mode
  - `src/index.ts` — Express app with CORS, Helmet, JSON parsing, rate limiting, error handler
  - Basic folder structure: `routes/`, `middleware/`, `services/`, `validators/`, `lib/`, `types/`

- [ ] **1B.2** Set up Prisma + PostgreSQL connection
  - `prisma/schema.prisma` — FULL schema (all models, enums, relations, indexes)
  - `prisma/seed.ts` — seed categories (6) + test colleges (3-5) + test admin user
  - `src/lib/prisma.ts` — Prisma client singleton
  - Run `prisma generate` + `prisma db push` (initial migration)

- [ ] **1B.3** Clerk webhook endpoint
  - `src/routes/auth.ts` — `POST /api/webhooks/clerk`
  - Handle `user.created` event → create User + Wallet in DB
  - Handle `user.updated` event → sync email/name changes
  - Verify webhook signature using `svix`
  - `.env.example` with all required variables

- [ ] **1B.4** Auth middleware
  - `src/middleware/auth.ts` — verify Clerk session JWT from `Authorization: Bearer` header
  - Attach `req.user` (userId, clerkId, email, isAdmin) to request
  - `src/middleware/admin.ts` — check `req.user.isAdmin === true`

- [ ] **1B.5** Basic user endpoints
  - `GET /api/users/me` — return current user profile + wallet summary
  - `GET /api/categories` — return all categories
  - `GET /api/colleges` — return all active colleges
  - `GET /health` — health check endpoint

- [ ] **1B.6** Global error handler + validation middleware
  - `src/middleware/errorHandler.ts` — catch-all error handler with proper HTTP codes
  - `src/middleware/validate.ts` — Zod validation middleware factory
  - `src/middleware/rateLimiter.ts` — rate limiting config

### Frontend Tasks (Agent F)

- [ ] **1F.1** Initialize `campx-client` repo with Vite + React + TypeScript
  - `package.json` with all dependencies (shadcn deps, framer-motion, tanstack query, clerk, etc.)
  - `tsconfig.json` + `vite.config.ts` (path aliases: `@/*` → `src/*`)
  - `tailwind.config.ts` + `postcss.config.js`
  - `components.json` (shadcn/ui config)

- [ ] **1F.2** Set up shadcn/ui + theme system
  - `src/styles/globals.css` — CSS variables for light + dark themes (shadcn standard)
  - Install base shadcn components: `button`, `card`, `input`, `badge`, `skeleton`, `dropdown-menu`, `avatar`, `separator`, `tooltip`, `sheet`
  - Theme toggle utility using `class` strategy on `<html>`

- [ ] **1F.3** Clerk integration
  - Wrap app in `<ClerkProvider>`
  - `src/app/routes/SignIn.tsx` — Clerk `<SignIn />` component styled to match
  - `src/app/routes/SignUp.tsx` — Clerk `<SignUp />` component with Google OAuth
  - Protected route wrapper component using `useAuth()`
  - `src/lib/api.ts` — fetch wrapper that attaches Clerk session token

- [ ] **1F.4** Layout shell
  - `src/app/layout/RootLayout.tsx` — Outlet wrapper with Navbar + Footer
  - `src/app/layout/Navbar.tsx` — logo, nav links, auth buttons (signed out) OR user menu + notification bell (signed in), dark mode toggle, mobile hamburger
  - `src/app/layout/Footer.tsx` — minimal footer
  - `src/app/layout/MobileNav.tsx` — slide-out sheet for mobile
  - Framer Motion page transition wrapper

- [ ] **1F.5** Route setup + placeholder pages
  - `src/app/App.tsx` — React Router with all routes defined
  - Placeholder pages for: Home, Browse, ItemDetail, SellItem, Dashboard, Chat, Wallet, Profile, Settings, Onboarding, Verification, Favorites, NotFound
  - TanStack Query provider + client setup

- [ ] **1F.6** Dark mode implementation
  - `ThemeProvider` context with `light`/`dark`/`system` modes
  - Toggle in Navbar
  - Persist preference in `localStorage`
  - `globals.css` has both `:root` (light) and `.dark` (dark) variable sets

- [ ] **1F.7** Type definitions + constants
  - `src/types/index.ts` — TypeScript interfaces matching Prisma models
  - `src/lib/constants.ts` — API base URL, categories, conditions, listing types
  - `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge), formatPrice, formatDate

### Verification Checklist (Phase 1)
- [ ] Backend starts without errors, serves `/health` → `{"status":"ok"}`
- [ ] Prisma schema validates, DB has all tables
- [ ] Seed data: 6 categories, 3+ colleges in DB
- [ ] Clerk sign-up → webhook fires → user created in DB with wallet
- [ ] Clerk sign-in → `GET /api/users/me` returns 200 with user data
- [ ] Unauthenticated request to `/api/users/me` returns 401
- [ ] Frontend renders: Navbar, Footer, all routes resolve (placeholder pages)
- [ ] Dark mode toggles correctly, persists across refresh
- [ ] API client correctly attaches Clerk token to requests

---

## Phase 2: Onboarding & ID Verification

> **Goal**: Post-signup onboarding flow, college ID upload to Cloudinary, admin verification queue, "Sell Item" gated behind verification.
> **Estimated Scope**: ~40 files, ~2500 LOC

### Backend Tasks (Agent B)

- [ ] **2B.1** Onboarding endpoint
  - `POST /api/users/onboarding` — receives { collegeId, fullName, phone }
  - Validates college exists + is active
  - Updates user profile, sets `onboardingComplete = true`
  - Creates wallet if not exists

- [ ] **2B.2** Verification endpoints
  - `POST /api/verifications` — receives { idCardImageUrl }, creates Verification record with status PENDING
  - `GET /api/verifications/status` — returns current user's latest verification status
  - Validate user hasn't already submitted a pending verification

- [ ] **2B.3** Admin verification endpoints
  - `GET /api/admin/verifications` — list pending verifications (with user info + image URL)
  - `PATCH /api/admin/verifications/:id` — approve or reject { status, reviewerNotes }
  - On approve: update user's `verificationStatus` to VERIFIED + create notification
  - On reject: update to REJECTED + create notification with reason
  - Protected by admin middleware

- [ ] **2B.4** Cloudinary service setup
  - `src/services/cloudinary.ts` — Cloudinary client config
  - Signed URL generation for private ID card images (admin viewing)
  - Image deletion helper

- [ ] **2B.5** Notification service foundation
  - `src/services/notification.ts` — `createNotification(userId, type, title, body, data)`
  - Stores in DB + publishes to Ably channel `user:{userId}:notifications`
  - Types: VERIFICATION_APPROVED, VERIFICATION_REJECTED

### Frontend Tasks (Agent F)

- [ ] **2F.1** Onboarding page (`/onboarding`)
  - Multi-step form with Framer Motion transitions
  - Step 1: "Welcome to CampX!" — enter full name + phone
  - Step 2: Select college from dropdown (fetched from API)
  - Step 3: Upload avatar (optional, Cloudinary widget)
  - Step 4: Success → redirect to Home
  - Auto-redirect here if `onboardingComplete === false`

- [ ] **2F.2** Verification page (`/verification`)
  - Shows current verification status (unverified / pending / verified / rejected)
  - If unverified: drag-and-drop upload zone for college ID card → Cloudinary
  - Image preview before submit
  - Submit button → calls `POST /api/verifications`
  - If pending: "Under Review" animated status
  - If rejected: shows reason + "Re-submit" option
  - If verified: green checkmark + "You're verified!"

- [ ] **2F.3** Sell Item gate
  - When unverified user tries to access `/sell`, show modal:
    "Verification Required — Upload your college ID to start selling"
  - CTA button → navigates to `/verification`

- [ ] **2F.4** Verification badge component
  - Small badge (green check / orange clock / red X) shown on:
    - Navbar (next to user avatar)
    - User profile card
    - Seller info on item detail

- [ ] **2F.5** Cloudinary upload component
  - `src/components/items/ImageUploader.tsx`
  - Reusable: accepts `preset`, `maxFiles`, `folder` props
  - Drag-and-drop zone + click to browse
  - Progress bar per image
  - Remove image (X button)
  - Drag to reorder (for item images later)
  - Returns array of `{ url, publicId }`

### Admin Tasks (Agent A)

- [ ] **2A.1** Admin layout + route protection
  - `/admin` routes protected by `isAdmin` check
  - `src/app/layout/AdminLayout.tsx` — sidebar nav + content area
  - Admin sidebar: Dashboard, Verifications, Users, Listings, Transactions, Reports

- [ ] **2A.2** Verification queue page (`/admin/verifications`)
  - Table/card list of pending verifications
  - Each shows: user name, college, submitted date, ID card image (zoom on click)
  - Approve button (green) + Reject button (red, opens notes input)
  - Bulk actions (approve/reject selected)
  - Pagination + filter by status

### Verification Checklist (Phase 2)
- [ ] New user signs up → redirected to onboarding → completes → profile shows college
- [ ] User clicks "Sell Item" → blocked with verification prompt
- [ ] User uploads college ID → status shows "Pending"
- [ ] Admin sees verification in queue → approves → user gets notification
- [ ] User is now verified → can access sell item page
- [ ] Rejected user sees reason → can re-submit
- [ ] Cloudinary upload works for both ID card and avatar

---

## Phase 3: Listings, Search & Discovery

> **Goal**: Full CRUD for listings, browse page with filters + pagination, item detail page, favorites, Mapbox location picker.
> **Estimated Scope**: ~35 files, ~3500 LOC

### Backend Tasks (Agent B)

- [ ] **3B.1** Item CRUD endpoints
  - `POST /api/items` — create listing (validated via Zod: title, description, categoryId, listingType, prices, condition, images[], pickupLocation, pickupLat, pickupLng)
  - Only VERIFIED users can create
  - Auto-set `collegeId` from user's college
  - `PUT /api/items/:id` — update (ownership check)
  - `DELETE /api/items/:id` — soft delete (set ARCHIVED) + Cloudinary image cleanup
  - `GET /api/items/:id` — single item with seller (name, avatarUrl, verificationStatus, avgRating), category, favoriteCount
  - Increment `viewCount` on GET

- [ ] **3B.2** Browse + search + pagination
  - `GET /api/items` with query params:
    - `cursor` (cursor-based pagination, default 20 per page)
    - `category` (slug)
    - `college` (slug, default: user's college)
    - `type` (sell/rent/both)
    - `condition` (new/like_new/used/heavily_used)
    - `priceMin`, `priceMax` (works on both sell_price and rent_price)
    - `search` (full-text on title + description via Prisma `contains`)
    - `sort` (newest/oldest/price_low/price_high)
  - Returns `{ items, nextCursor, hasMore }`

- [ ] **3B.3** Favorites endpoints
  - `POST /api/favorites/:itemId` — add to favorites (upsert)
  - `DELETE /api/favorites/:itemId` — remove from favorites
  - `GET /api/favorites` — user's favorited items with item details (paginated)
  - Include `isFavorited` boolean in item responses when user is authenticated

- [ ] **3B.4** User listings endpoint
  - `GET /api/users/me/items` — current user's own listings
  - Filter by status (available/reserved/sold/archived)

### Frontend Tasks (Agent F)

- [ ] **3F.1** Home / Landing page (`/`)
  - Hero section: animated headline ("Your Campus. Your Marketplace."), stats (users, listings, transactions), CTA buttons
  - Featured categories grid (6 cards with icons)
  - Recent listings carousel (horizontal scroll)
  - "How It Works" — 4-step visual flow (Sign Up → Verify → List/Buy → Escrow)
  - College selector prominent if user not logged in
  - Framer Motion entrance animations (stagger, fade-up)

- [ ] **3F.2** Browse page (`/browse`)
  - Left sidebar: filter panel (category checkboxes, price range slider, condition, listing type)
  - Mobile: filter button opens sheet overlay
  - Search bar at top (debounced, 300ms)
  - Sort dropdown (Newest, Price Low→High, Price High→Low)
  - Responsive grid: 1→2→3→4 columns (mobile→desktop)
  - `ItemCard` component with Framer Motion hover scale + shadow
  - Skeleton loading grid while fetching
  - "Load More" button (cursor pagination) with automatic trigger on scroll
  - Empty state with illustration when no results
  - College scope indicator ("Showing items from SPIT")

- [ ] **3F.3** ItemCard component
  - Cloudinary-optimized image (responsive srcset: 400px, 800px)
  - Title (truncated), price display (₹ for sell, ₹/day for rent, both)
  - Condition badge (color-coded), listing type badge
  - College tag, seller verification badge
  - Heart icon (favorite toggle) — optimistic update with TanStack
  - Click → navigate to `/items/:id`
  - Skeleton variant (`ItemCardSkeleton`)

- [ ] **3F.4** Item Detail page (`/items/:id`)
  - Image gallery: main image + thumbnail strip, click to zoom (lightbox), swipe on mobile
  - Pricing card: sell price / rent price / both with date picker for rental period
  - "Buy Now" button (disabled if own item, or if not logged in)
  - "Add to Favorites" heart button
  - Item details: description, condition, category, posted date, views count
  - Pickup location: Mapbox mini-map with pin + location text
  - Seller card: avatar, name, college, verification badge, member since, avg rating (stars)
  - "Report Item" link
  - Skeleton loading state
  - Related items section (same category, same college)

- [ ] **3F.5** Sell Item page (`/sell`)
  - Protected route (verified users only)
  - Multi-step form with progress bar:
    - Step 1: Title + Description (with character count)
    - Step 2: Category (icon grid selector) + Condition (radio cards)
    - Step 3: Listing Type (sell/rent/both) → conditional price fields
    - Step 4: Upload images (ImageUploader, max 5, drag-to-reorder)
    - Step 5: Pickup location — Mapbox map with draggable pin + text input
    - Step 6: Review & Submit
  - Framer Motion step transitions
  - Form state via React Hook Form + Zod validation
  - On success: success animation → redirect to item detail page

- [ ] **3F.6** Favorites page (`/favorites`)
  - Grid of favorited items (reuses ItemCard)
  - Empty state: "No favorites yet — browse items to save some!"
  - Remove from favorites on heart toggle

- [ ] **3F.7** Mapbox components
  - `src/components/maps/LocationPicker.tsx` — interactive map with draggable marker, search/geocode input, returns { lat, lng, locationText }
  - `src/components/maps/MiniMap.tsx` — static display map with pin (for item detail + chat)
  - `src/components/maps/CampusBoundary.tsx` — optional: draws campus polygon overlay

### Verification Checklist (Phase 3)
- [ ] Home page loads with hero, categories, recent items
- [ ] Browse page: search works, all filters work, pagination loads more
- [ ] Creating a listing with images + map location succeeds
- [ ] Item detail page shows all info, images, map, seller card
- [ ] Favorites: toggle on card, toggle on detail, appear on favorites page
- [ ] Edit own listing works, delete removes from browse
- [ ] Non-verified user blocked from posting
- [ ] Skeleton loaders visible during fetches

---

## Phase 4: Razorpay Payments & Escrow

> **Goal**: Full payment flow with Razorpay test mode, escrow holding, fund release on confirmation, wallet system.
> **Estimated Scope**: ~25 files, ~2500 LOC

### Backend Tasks (Agent B)

- [ ] **4B.1** Razorpay service setup
  - `src/services/razorpay.ts` — Razorpay client initialization
  - `createOrder(amount, currency, receipt)` helper
  - `verifyPaymentSignature(orderId, paymentId, signature)` helper

- [ ] **4B.2** Order creation endpoint
  - `POST /api/orders/create` — body: { itemId, type: BUY/RENT, rentStartDate?, rentEndDate? }
  - Validate: item exists, is AVAILABLE, buyer !== seller, no duplicate pending order
  - Calculate amount (sell_price for BUY, rent_price_per_day * days for RENT)
  - Create Razorpay order
  - Create Transaction record (status: PENDING, razorpayOrderId)
  - Return { orderId, amount, currency, keyId } to frontend

- [ ] **4B.3** Payment verification endpoint
  - `POST /api/payments/verify` — body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  - Verify signature (HMAC SHA256)
  - Update Transaction: status → CAPTURED → RESERVED
  - Update Item: status → RESERVED
  - Wallet: seller's `frozenBalance += amount`
  - WalletTransaction: CREDIT_ESCROW entry
  - Create Conversation (auto-open chat between buyer & seller)
  - Send notifications to both parties
  - Send email to seller: "Payment Secured — Proceed to meetup"

- [ ] **4B.4** Confirm receipt endpoint
  - `POST /api/transactions/:id/confirm-receipt` — buyer only
  - Transaction: status → SETTLED, set `settledAt`
  - Wallet: seller's `frozenBalance -= amount`, `balance += amount`
  - WalletTransaction: RELEASE_ESCROW entry
  - Item: status → SOLD (for BUY) or revert to AVAILABLE (for RENT after end date)
  - Notifications to both parties
  - Email to seller: "₹{amount} released to your wallet!"

- [ ] **4B.5** Dispute endpoint
  - `POST /api/transactions/:id/dispute` — body: { reason }
  - Transaction: status → DISPUTED
  - Create notification for admin
  - Admin can manually resolve via admin panel endpoints

- [ ] **4B.6** Wallet endpoints
  - `GET /api/wallet` — returns { balance, frozenBalance }
  - `GET /api/wallet/history` — paginated wallet transactions
  - `POST /api/wallet/withdraw` — body: { amount }
  - Validate: amount <= balance
  - Create WalletTransaction: WITHDRAWAL entry
  - Deduct from balance
  - (In production: trigger Razorpay Payout. For now: mark as "Processing" — mock response)

- [ ] **4B.7** Razorpay webhook endpoint
  - `POST /api/webhooks/razorpay` — verify webhook signature
  - Handle `payment.captured` — redundant safety net for verify endpoint
  - Handle `payment.failed` — update transaction status to CANCELLED
  - Handle `refund.created` — update transaction + wallet

### Frontend Tasks (Agent F)

- [ ] **4F.1** Razorpay integration on Item Detail
  - "Buy Now" button → calls `POST /api/orders/create`
  - Opens Razorpay Checkout modal with returned orderId
  - Handle success callback → call `POST /api/payments/verify`
  - Success: show confetti + "Payment Successful!" modal
  - Failure: show error toast
  - "Rent" flow: date picker to select rental period → calculate total → same flow

- [ ] **4F.2** Transaction status UI
  - On Dashboard: transaction cards show current status with timeline
  - Status badges: Pending (yellow), Reserved (blue), Settled (green), Disputed (red)
  - "Confirm Receipt" button (buyer only, on RESERVED transactions)
  - "Raise Dispute" button (both parties)

- [ ] **4F.3** Wallet page (`/wallet`)
  - Balance display: available balance (green, large), frozen balance (grey, smaller)
  - "Withdraw" button → modal with amount input + bank details placeholder
  - Transaction history list: type icon, description, amount (+/-), date
  - Filter by type
  - Animated balance counter (Framer Motion number animation)

- [ ] **4F.4** Payment status animations
  - Confetti explosion on successful payment
  - Pulsing "Processing..." animation during verification
  - Animated checkmark on confirmation
  - Error shake animation on failure

### Verification Checklist (Phase 4)
- [ ] "Buy Now" → Razorpay modal opens with correct amount
- [ ] Test card payment → signature verified → transaction = RESERVED
- [ ] Seller wallet shows frozen balance increased
- [ ] Chat auto-opens between buyer and seller
- [ ] Buyer clicks "Confirm Receipt" → transaction = SETTLED
- [ ] Seller wallet: frozen decreases, available increases
- [ ] Wallet page shows correct balances + history
- [ ] Failed payment handled gracefully
- [ ] Duplicate order prevention works

---

## Phase 5: Real-time Chat & Notifications

> **Goal**: Ably-powered real-time messaging, location sharing in chat, notification system (in-app + email).
> **Estimated Scope**: ~30 files, ~2500 LOC

### Backend Tasks (Agent B)

- [ ] **5B.1** Ably service setup
  - `src/services/ably.ts` — Ably REST client
  - `publishToChannel(channelName, eventName, data)` helper
  - Token authentication endpoint for frontend: `POST /api/ably/token` → returns Ably token

- [ ] **5B.2** Conversation endpoints
  - `GET /api/conversations` — user's conversations list (with last message preview, other user info, unread count)
  - `GET /api/conversations/:id` — messages (paginated, newest first) + mark messages as read
  - Validate user is participant in conversation

- [ ] **5B.3** Message endpoint + Ably publish
  - `POST /api/conversations/:id/messages` — body: { type, content }
  - Store in DB
  - Publish to Ably channel `conversation:{id}` with event `new-message`
  - For LOCATION type: content is JSON `{ lat, lng, locationText }`
  - Create notification for recipient if not currently in chat

- [ ] **5B.4** Notification endpoints
  - `GET /api/notifications` — user's notifications (paginated)
  - `PATCH /api/notifications/read` — body: { ids: [] } mark as read, or `{ all: true }`
  - Unread count: returned in `GET /api/users/me` response

- [ ] **5B.5** Email notification service
  - `src/services/resend.ts` — Resend client setup
  - Email templates (HTML): payment confirmed, funds released, ID verified, ID rejected
  - Send on critical events (called from existing services)
  - Notification preference check before sending

- [ ] **5B.6** Notification preference endpoints
  - `GET /api/users/me/notification-preferences`
  - `PUT /api/users/me/notification-preferences` — toggle email/in-app per type

### Frontend Tasks (Agent F)

- [ ] **5F.1** Ably client setup
  - `src/lib/ably.ts` — Ably Realtime client with token auth
  - Auto-subscribe to `user:{userId}:notifications` channel on login
  - Connection status handling

- [ ] **5F.2** Chat page (`/chat`)
  - Left panel: conversation list (sorted by last message)
  - Each conversation card: other user's avatar + name, last message preview, timestamp, unread badge
  - Right panel: message thread
  - Click conversation → load messages + subscribe to Ably channel
  - Mobile: full-screen conversation list → tap → full-screen thread

- [ ] **5F.3** Message thread UI
  - Message bubbles: sent (right, primary color) / received (left, muted)
  - Timestamps grouped by day
  - Auto-scroll to bottom on new message
  - Loading skeleton for message history
  - "Typing..." indicator (Ably presence)
  - System messages styled differently (centered, grey)

- [ ] **5F.4** Chat input + location sharing
  - Text input with send button
  - "Send Location" button → opens Mapbox modal picker → sends location message
  - Location messages render as clickable mini-map in chat bubble
  - Image sharing (future: upload via Cloudinary + send as IMAGE message)

- [ ] **5F.5** Notification bell + panel
  - `NotificationBell` in Navbar: shows unread count badge
  - Click → dropdown panel with notification list
  - Each notification: icon (by type), title, body, timestamp, read/unread indicator
  - Mark as read on click/open
  - "Mark all as read" action
  - Real-time: new notifications appear via Ably subscription

- [ ] **5F.6** Notification preferences (in Settings)
  - Toggle switches per notification type: email / in-app
  - Save to backend on change

### Verification Checklist (Phase 5)
- [ ] After payment → chat auto-opens with transaction context
- [ ] Send text message → appears in real-time for other user
- [ ] Send location → map preview in chat bubble
- [ ] Notification bell shows unread count
- [ ] New notification appears in real-time
- [ ] Email sends for payment events (check Resend logs)
- [ ] Conversation list sorted by latest message
- [ ] Works on mobile (full-screen chat)

---

## Phase 6: Ratings, Reviews & User Profiles

> **Goal**: Post-transaction reviews, public user profiles, enhanced dashboard, report system.
> **Estimated Scope**: ~25 files, ~2000 LOC

### Backend Tasks (Agent B)

- [ ] **6B.1** Review endpoints
  - `POST /api/reviews` — body: { transactionId, rating (1-5), comment }
  - Validate: transaction is SETTLED, reviewer is buyer OR seller, not already reviewed
  - `GET /api/users/:id/reviews` — paginated reviews for a user
  - Calculate aggregate: `avgRating`, `reviewCount` → compute from DB

- [ ] **6B.2** Public user profile endpoint
  - `GET /api/users/:id` — returns: name, avatarUrl, college, verificationStatus, createdAt, avgRating, reviewCount, itemCount
  - Do NOT expose: email, phone, clerkId

- [ ] **6B.3** User profile update endpoint
  - `PUT /api/users/me` — body: { fullName, phone, avatarUrl }
  - Validate inputs with Zod

- [ ] **6B.4** Report endpoints
  - `POST /api/reports` — body: { reportedUserId?, reportedItemId?, reason, description }
  - Must report at least one (user or item)
  - `GET /api/admin/reports` — admin: list reports with reporter + reported info
  - `PATCH /api/admin/reports/:id` — admin: { status, adminNotes }

- [ ] **6B.5** Enhanced user listings + transactions
  - `GET /api/users/me/items` — with status filter + stats (views, favorites count)
  - `GET /api/transactions` — enhanced with review status (hasReviewed boolean)

### Frontend Tasks (Agent F)

- [ ] **6F.1** Review flow
  - After transaction settles → prompt card on Dashboard: "Rate your experience with {user}"
  - Star rating component (interactive, animated, 1-5 stars)
  - Optional comment textarea
  - Submit → success animation
  - Prevent duplicate reviews (check `hasReviewed` flag)

- [ ] **6F.2** Review display components
  - `ReviewCard` — star display, comment, reviewer name + avatar, date
  - Review list on user profile page
  - Average rating display (stars + number) on seller cards and item detail

- [ ] **6F.3** Public user profile page (`/users/:id`)
  - Avatar (large), name, college, verification badge
  - Member since, avg rating (animated stars), review count
  - Active listings grid
  - Reviews tab
  - "Report User" button

- [ ] **6F.4** Settings page (`/settings`)
  - Edit profile: name, phone, avatar (Cloudinary upload)
  - Notification preferences (toggles from Phase 5)
  - Account section: email (read-only, from Clerk), sign out

- [ ] **6F.5** Enhanced Dashboard (`/dashboard`)
  - Tabs with animated underline indicator:
    1. **My Listings**: card grid, status badges, view count, edit/delete/mark sold actions
    2. **Buying**: active purchases (reserved → awaiting receipt), past purchases
    3. **Selling**: incoming orders, pending confirmations
    4. **Activity**: timeline of all recent actions
  - Quick stats at top: total earnings, active listings, pending transactions
  - Review prompts for unreviewed settled transactions

- [ ] **6F.6** Report modal
  - Trigger from item detail or user profile
  - Reason dropdown (from ReportReason enum) + description textarea
  - Submit → confirmation toast

### Verification Checklist (Phase 6)
- [ ] Settled transaction → review prompt appears on dashboard
- [ ] Submit 5-star review → appears on seller's profile
- [ ] Public profile shows correct avg rating + review count
- [ ] Settings: update name + avatar → reflected everywhere
- [ ] Dashboard tabs all functional with correct data
- [ ] Report user/item → stored in DB → visible in admin (Phase 7)

---

## Phase 7: Admin Panel & Moderation

> **Goal**: Full admin dashboard with stats, verification queue, user management, transaction oversight, report handling.
> **Estimated Scope**: ~20 files, ~2000 LOC

### Backend Tasks (Agent B)

- [ ] **7B.1** Admin stats endpoint
  - `GET /api/admin/stats` — returns:
    - Total users, verified users, new users (last 7 days)
    - Total items, active items, items by category
    - Total transactions, by status, total volume (₹)
    - Pending verifications count, pending reports count

- [ ] **7B.2** Admin user management
  - `GET /api/admin/users` — paginated, searchable (name, email), filterable (college, status)
  - `PATCH /api/admin/users/:id` — { isBanned, verificationStatus, isAdmin }
  - Ban user: set `isBanned = true`, archive all their active listings

- [ ] **7B.3** Admin transaction management
  - `GET /api/admin/transactions` — all transactions, filterable by status
  - `PATCH /api/admin/transactions/:id` — admin can:
    - Force settle (release funds to seller)
    - Force refund (refund buyer, deduct from seller's frozen)
    - Add admin notes

- [ ] **7B.4** Admin college management
  - `POST /api/admin/colleges` — create new college
  - `PUT /api/admin/colleges/:id` — update college details + campus boundary
  - `PATCH /api/admin/colleges/:id` — toggle `isActive`

### Frontend Tasks (Agent F + Agent A)

- [ ] **7F.1** Admin Dashboard page (`/admin`)
  - Stats cards: total users, listings, transactions, revenue (animated counters)
  - Quick action cards: pending verifications (count), open reports (count)
  - Simple line/bar charts (using Recharts or Victory): signups over time, transaction volume

- [ ] **7F.2** Verification Queue page (`/admin/verifications`)
  - Already built in Phase 2 — enhance with:
    - Better image viewer (zoom, rotate)
    - Side-by-side comparison (ID name vs profile name)
    - Quick stats: approved today, rejected today, pending total

- [ ] **7F.3** User Management page (`/admin/users`)
  - Searchable table: avatar, name, email, college, verification status, join date, listings count
  - Actions: view profile, verify, ban/unban, make admin
  - Click row → user detail slide-over panel

- [ ] **7F.4** Transaction Management page (`/admin/transactions`)
  - Table: ID, buyer, seller, item, amount, status, date
  - Status filter tabs
  - Click → transaction detail with timeline + admin actions (settle, refund)

- [ ] **7F.5** Reports Queue page (`/admin/reports`)
  - Table: reporter, reported user/item, reason, status, date
  - Actions: view details, dismiss, take action (warn, ban, remove listing)
  - Link to reported user profile + reported item

- [ ] **7F.6** College Management page (`/admin/colleges`)
  - Table: name, domain, city, active status, user count
  - Create new college form (with Mapbox campus boundary drawing if time)
  - Toggle active/inactive

### Verification Checklist (Phase 7)
- [ ] Admin dashboard shows correct aggregate stats
- [ ] Verification queue: approve/reject flows work (from Phase 2, now enhanced)
- [ ] User management: search, ban/unban, force-verify
- [ ] Transaction management: admin can force-settle or refund a disputed transaction
- [ ] Reports queue: admin can review and take action
- [ ] Non-admin users get 403 on all `/admin/*` routes

---

## Phase 8: Polish, Performance & Deployment

> **Goal**: Animations, SEO, performance optimization, error handling, PWA, deploy to Vercel + Railway.
> **Estimated Scope**: ~20 files modified, ~1500 LOC

### Polish Tasks (Agent F)

- [ ] **8F.1** Framer Motion micro-interactions
  - Page transitions (fade + slide)
  - Card hover: scale(1.02) + shadow increase
  - List stagger: items animate in sequence
  - Button press: scale(0.95) feedback
  - Modal enter/exit: scale + opacity
  - Number animations: balance counters, stats
  - Hero section: text reveal animation

- [ ] **8F.2** Error handling
  - Global React Error Boundary with fallback UI
  - Toast notifications (Sonner) for all API errors
  - 404 page with illustration + "Go Home" button
  - API interceptor: handle 401 (redirect to login), 403 (show forbidden), 500 (toast)
  - Form validation errors with inline feedback + field highlighting

- [ ] **8F.3** SEO & Meta
  - React Helmet for dynamic page titles + descriptions
  - Open Graph tags (og:title, og:description, og:image) for item pages
  - Favicon (multiple sizes)
  - `manifest.json` for PWA
  - `robots.txt`
  - Structured data (JSON-LD) for item listings

- [ ] **8F.4** Performance
  - Cloudinary responsive images: `srcSet` with multiple widths
  - React.lazy + Suspense for route code splitting
  - Image lazy loading with intersection observer
  - TanStack Query cache tuning: staleTime, gcTime per query type
  - Bundle analysis + tree shaking verification

- [ ] **8F.5** PWA basics
  - Service worker for offline app shell
  - Add to homescreen prompt
  - Splash screen

### Backend Tasks (Agent B)

- [ ] **8B.1** Security hardening
  - CORS locked to Vercel production domain + localhost
  - Rate limiting: 100 req/min general, 10 req/min auth, 5 req/min payments
  - Helmet headers
  - Input sanitization review
  - Remove all `console.log` with sensitive data

- [ ] **8B.2** Error handling refinement
  - Consistent error response format: `{ error: string, code: string, details?: any }`
  - Proper HTTP status codes everywhere
  - Async error catching on all routes
  - Database connection retry logic

- [ ] **8B.3** Health check + monitoring
  - Enhanced `/health` with DB ping + Ably status
  - Request logging middleware (method, path, status, duration)

### Deployment Tasks (Agent A)

- [ ] **8A.1** Deploy frontend to Vercel
  - Push `campx-client` to GitHub
  - Connect to Vercel
  - Set environment variables
  - Configure `vercel.json` for SPA rewrites
  - Verify build + deploy
  - Set up preview deployments for PRs

- [ ] **8A.2** Deploy backend to Railway
  - Push `campx-server` to GitHub
  - Create Railway project with PostgreSQL addon
  - Set environment variables (DATABASE_URL from Railway, all API keys)
  - Configure `railway.json` (build + start commands)
  - Run `prisma migrate deploy` + `prisma db seed`
  - Verify health endpoint
  - Set up auto-deploy from main branch

- [ ] **8A.3** Configure production services
  - Clerk: add production Vercel domain to allowed origins
  - Cloudinary: create upload presets (campx-items, campx-avatars, campx-ids)
  - Ably: production app key
  - Razorpay: test mode keys (switch to live when ready)
  - Mapbox: add production domain to allowed URLs
  - Resend: verify sender domain

- [ ] **8A.4** End-to-end testing
  - Full user journey: signup → onboard → verify ID → list item → buy item → pay → chat → confirm → rate
  - Admin journey: approve ID → view stats → handle report
  - Mobile testing: iOS Safari + Android Chrome
  - Dark mode testing across all pages

- [ ] **8A.5** Documentation update
  - Update README with production URLs
  - API documentation
  - Environment variables guide
  - Deployment guide

### Verification Checklist (Phase 8)
- [ ] Frontend deployed on Vercel, accessible via URL
- [ ] Backend deployed on Railway, `/health` returns OK
- [ ] Full signup → purchase → settle flow works on production
- [ ] Lighthouse score: Performance 90+, Accessibility 90+, SEO 90+
- [ ] Dark mode works across all pages
- [ ] Mobile responsive on all pages
- [ ] Error boundary catches crashes gracefully
- [ ] No console errors in production

---

## Dependency Map

```
Phase 1 ──────┬──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
              │                                          ↓
              │                                     Phase 6
              │                                          ↓
              └──────────────────────────────────→ Phase 7
                                                        ↓
                                                   Phase 8
```

- **Phase 1** is prerequisite for ALL phases (foundation)
- **Phase 2** (verification) required before Phase 3 (listings need verification gate)
- **Phase 3** (listings) required before Phase 4 (payments need items to buy)
- **Phase 4** (payments) required before Phase 5 (chat auto-opens after payment)
- **Phase 5** (notifications) and **Phase 6** (reviews) can run in parallel after Phase 4
- **Phase 7** (admin) can start after Phase 2 (verification queue) and is enhanced with Phase 6 data
- **Phase 8** is always last (deployment + polish)
