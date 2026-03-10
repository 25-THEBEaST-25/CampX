# CampX — Project Context

> **Last Updated**: 2025-07-24
> **Version**: 2.0 (Complete Rewrite)
> **Status**: Planning Complete → Phase 1 Ready

---

## 1. What Is CampX?

**CampX** is a hyper-local, trust-first, peer-to-peer marketplace exclusively for university students. It enables buying, selling, and renting items (textbooks, electronics, furniture, sports gear, clothing, etc.) within and across campus communities.

### Core Thesis

> Shift student transactions from **"Interpersonal Trust"** (WhatsApp groups, Facebook Marketplace) to **"Institutional Trust"** — a platform with Administrative Oversight, Mandatory Real-Name Authentication (RNA), and Automated Escrow services.

### The Problem

- 89.74% of students are interested in second-hand textbooks — yet transactions happen on fragmented, insecure channels
- No accountability, no payment protection, no identity verification
- Students get scammed, ghosted, or receive damaged goods with no recourse

### The Solution

A centralized digital platform with:
1. **College ID Verification** — mandatory before selling (Admin-reviewed)
2. **Razorpay Escrow** — funds held until buyer confirms receipt
3. **In-App Wallet** — frozen/available balance with withdrawal
4. **Real-time Chat** — buyer-seller messaging with location sharing
5. **Multi-College** — each college has its own scoped marketplace
6. **Ratings & Reviews** — trust built through transaction history

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 18 + Vite 6 + TypeScript + shadcn/ui + Framer Motion│
│  TanStack Query v5 + React Router v6                        │
│  Hosted on: VERCEL                                          │
├─────────────────────────────────────────────────────────────┤
│                     SERVICES LAYER                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Clerk   │  │ Cloudinary│  │   Ably   │  │  Mapbox   │ │
│  │  Auth +  │  │  Images + │  │ Realtime │  │  Maps +   │ │
│  │  Google  │  │  CDN      │  │  Chat +  │  │  Geocode  │ │
│  │  OAuth   │  │           │  │  Notifs  │  │           │ │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬─────┘ │
├───────┼──────────────┼─────────────┼───────────────┼───────┤
│       │          BACKEND           │               │       │
│  Express 5 + TypeScript + Prisma ORM                        │
│  Hosted on: RAILWAY                                         │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐               │
│  │ Razorpay │  │  Resend   │  │ Webhooks  │               │
│  │ Payments │  │  Emails   │  │ Clerk/Rzp │               │
│  └──────────┘  └───────────┘  └───────────┘               │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                               │
│  PostgreSQL 16 on RAILWAY                                   │
│  Managed via Prisma Migrations                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Frontend (`campx-client` repo → Vercel)

| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 6.x | Build tool + dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.x | Utility-first styling |
| shadcn/ui | latest | Component library (Radix primitives + Tailwind) |
| Framer Motion | 11.x | Animations + transitions |
| TanStack React Query | 5.x | Server state management + caching |
| React Router | 6.x | Client-side routing |
| Clerk React SDK | latest | Authentication UI + session management |
| Ably React | latest | Real-time chat + notifications (client) |
| Mapbox GL JS | 3.x | Interactive maps + location picker |
| React Map GL | 7.x | React wrapper for Mapbox |
| Cloudinary Upload Widget | latest | Client-side image uploads |
| Sonner | latest | Toast notifications |
| Lucide React | latest | Icons |
| date-fns | latest | Date formatting |
| Zod | latest | Form validation schemas |
| React Hook Form | latest | Form state management |

### Backend (`campx-server` repo → Railway)

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 5.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM + migrations + type-safe queries |
| PostgreSQL | 16 | Database (Railway addon) |
| Clerk Node SDK | latest | JWT verification + webhook handling |
| Razorpay Node SDK | latest | Payment orders, verification, webhooks |
| Ably REST | latest | Server-side message publishing |
| Resend | latest | Transactional emails |
| Cloudinary Node SDK | latest | Signed upload URLs + image deletion |
| Helmet | latest | Security headers |
| CORS | latest | Cross-origin (Vercel domain only) |
| Express Rate Limit | latest | API rate limiting |
| Zod | latest | Request validation |
| tsx | latest | TypeScript execution (dev) |

### Third-Party Services

| Service | Plan | Purpose | Limits (Free Tier) |
|---|---|---|---|
| **Clerk** | Free | Auth + Google OAuth + user management | 10,000 MAU |
| **Cloudinary** | Free | Image upload, CDN, transformations | 25GB storage, 25GB bandwidth |
| **Ably** | Free | Real-time messaging (chat + notifications) | 6M messages/month |
| **Razorpay** | Test Mode | Payments, escrow, wallet | Unlimited in test mode |
| **Mapbox** | Free | Maps, geocoding, static images | 50,000 map loads/month |
| **Resend** | Free | Transactional emails | 3,000 emails/month |
| **Vercel** | Hobby | Frontend hosting | Unlimited deploys |
| **Railway** | Starter ($5 credit) | Backend + PostgreSQL | 512MB RAM, 1GB DB |

---

## 4. Repository Structure

### Two Separate Repos (Independent Deployment)

```
campx-client/                    # Frontend → Vercel
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── routes/                # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Browse.tsx
│   │   │   ├── ItemDetail.tsx
│   │   │   ├── SellItem.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Wallet.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Verification.tsx
│   │   │   ├── Favorites.tsx
│   │   │   ├── NotFound.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── VerificationQueue.tsx
│   │   │       ├── UserManagement.tsx
│   │   │       ├── ListingModeration.tsx
│   │   │       ├── TransactionManagement.tsx
│   │   │       └── ReportsQueue.tsx
│   │   ├── layout/
│   │   │   ├── RootLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── AdminLayout.tsx
│   │   └── App.tsx
│   ├── components/
│   │   ├── items/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ItemCardSkeleton.tsx
│   │   │   ├── ItemGrid.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── FilterSidebar.tsx
│   │   ├── chat/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── LocationShareButton.tsx
│   │   ├── maps/
│   │   │   ├── LocationPicker.tsx
│   │   │   ├── MiniMap.tsx
│   │   │   └── CampusBoundary.tsx
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── WithdrawModal.tsx
│   │   ├── reviews/
│   │   │   ├── StarRating.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   └── ReviewForm.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationPanel.tsx
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── badge.tsx
│   │       ├── skeleton.tsx
│   │       ├── tabs.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── avatar.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── tooltip.tsx
│   │       └── ... (more as needed)
│   ├── hooks/
│   │   ├── useItems.ts
│   │   ├── useChat.ts
│   │   ├── useNotifications.ts
│   │   ├── useWallet.ts
│   │   ├── useMapbox.ts
│   │   └── useDebounce.ts
│   ├── lib/
│   │   ├── api.ts                 # API client (fetch wrapper with Clerk token)
│   │   ├── cloudinary.ts          # Cloudinary upload helpers
│   │   ├── ably.ts                # Ably client setup
│   │   ├── utils.ts               # cn() helper, formatters
│   │   └── constants.ts           # API URL, categories, conditions
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   ├── styles/
│   │   └── globals.css            # Tailwind + CSS variables (shadcn theme)
│   └── main.tsx
├── .env.example
├── .gitignore
├── components.json                # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── package.json

campx-server/                    # Backend → Railway
├── src/
│   ├── index.ts                   # Express app entry
│   ├── routes/
│   │   ├── auth.ts                # Clerk webhook + profile sync
│   │   ├── users.ts               # Profile, settings
│   │   ├── items.ts               # CRUD + search + pagination
│   │   ├── orders.ts              # Razorpay order creation
│   │   ├── payments.ts            # Razorpay verification + webhooks
│   │   ├── transactions.ts        # Transaction lifecycle
│   │   ├── wallet.ts              # Balance, history, withdrawals
│   │   ├── conversations.ts       # Chat threads
│   │   ├── messages.ts            # Chat messages + Ably publish
│   │   ├── favorites.ts           # Wishlist CRUD
│   │   ├── reviews.ts             # Ratings + reviews
│   │   ├── notifications.ts       # Notification CRUD
│   │   ├── verifications.ts       # College ID verification
│   │   ├── colleges.ts            # College CRUD
│   │   ├── categories.ts          # Category list
│   │   ├── reports.ts             # User/item reports
│   │   └── admin.ts               # Admin-only endpoints
│   ├── middleware/
│   │   ├── auth.ts                # Clerk session verification
│   │   ├── admin.ts               # Admin role check
│   │   ├── rateLimiter.ts         # Rate limiting
│   │   ├── validate.ts            # Zod validation middleware
│   │   └── errorHandler.ts        # Global error handler
│   ├── services/
│   │   ├── razorpay.ts            # Razorpay client + helpers
│   │   ├── ably.ts                # Ably REST client + publish helpers
│   │   ├── resend.ts              # Email sending
│   │   ├── cloudinary.ts          # Signed URLs + deletion
│   │   └── notification.ts        # Create notification + push via Ably
│   ├── validators/
│   │   ├── item.ts                # Zod schemas for item endpoints
│   │   ├── order.ts               # Zod schemas for orders
│   │   ├── review.ts              # Zod schemas for reviews
│   │   └── common.ts              # Shared validators (pagination, etc.)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── constants.ts           # Enums, config values
│   └── types/
│       └── index.ts               # Express extensions, shared types
├── prisma/
│   ├── schema.prisma              # Complete database schema
│   ├── migrations/                # Auto-generated by Prisma
│   └── seed.ts                    # Categories + test colleges + admin user
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
├── railway.json                   # Railway deploy config
└── Dockerfile                     # Optional: Railway Docker deploy
```

---

## 5. Database Schema (Prisma)

```prisma
// ============================================
// ENUMS
// ============================================
enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum ListingType {
  SELL
  RENT
  BOTH
}

enum ItemCondition {
  NEW
  LIKE_NEW
  USED
  HEAVILY_USED
}

enum ItemStatus {
  AVAILABLE
  RESERVED
  SOLD
  RENTED
  ARCHIVED
}

enum TransactionStatus {
  PENDING          // Order created, awaiting payment
  CAPTURED         // Payment received by Razorpay
  RESERVED         // Funds frozen in seller wallet, item reserved
  SETTLED          // Buyer confirmed receipt, funds released
  DISPUTED         // Dispute raised
  REFUNDED         // Refund processed
  CANCELLED        // Cancelled before payment
  EXPIRED          // Payment window expired
}

enum TransactionType {
  BUY
  RENT
}

enum WalletTransactionType {
  CREDIT_ESCROW    // Funds frozen from buyer payment
  RELEASE_ESCROW   // Funds moved from frozen to available
  WITHDRAWAL       // Withdrawal to bank
  REFUND_DEBIT     // Refund deducted
}

enum MessageType {
  TEXT
  LOCATION
  IMAGE
  SYSTEM           // "Transaction started", "Item received", etc.
}

enum NotificationType {
  VERIFICATION_APPROVED
  VERIFICATION_REJECTED
  NEW_MESSAGE
  PAYMENT_RECEIVED
  FUNDS_RELEASED
  ITEM_SOLD
  TRANSACTION_UPDATE
  REVIEW_RECEIVED
  SYSTEM
}

enum ReportReason {
  SPAM
  FAKE_LISTING
  INAPPROPRIATE
  SCAM
  HARASSMENT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACTION_TAKEN
  DISMISSED
}

// ============================================
// MODELS
// ============================================

model College {
  id              String    @id @default(cuid())
  name            String    @unique
  slug            String    @unique
  emailDomain     String    @unique    // e.g., "spit.ac.in"
  city            String
  state           String
  campusLat       Float?               // Campus center latitude
  campusLng       Float?               // Campus center longitude
  campusBoundary  Json?                // GeoJSON polygon for geo-fence
  logoUrl         String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  users           User[]
  items           Item[]
}

model User {
  id                 String              @id @default(cuid())
  clerkId            String              @unique       // Clerk external user ID
  email              String              @unique
  fullName           String
  phone              String?
  avatarUrl          String?
  collegeId          String?
  verificationStatus VerificationStatus  @default(UNVERIFIED)
  isAdmin            Boolean             @default(false)
  isBanned           Boolean             @default(false)
  onboardingComplete Boolean             @default(false)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  college            College?            @relation(fields: [collegeId], references: [id])
  wallet             Wallet?
  items              Item[]
  buyerTransactions  Transaction[]       @relation("BuyerTransactions")
  sellerTransactions Transaction[]       @relation("SellerTransactions")
  favorites          Favorite[]
  reviewsGiven       Review[]            @relation("ReviewerReviews")
  reviewsReceived    Review[]            @relation("RevieweeReviews")
  verifications      Verification[]
  notifications      Notification[]
  conversationsAsUser1 Conversation[]    @relation("User1Conversations")
  conversationsAsUser2 Conversation[]    @relation("User2Conversations")
  messages           Message[]
  reportsMade        Report[]            @relation("ReporterReports")
  reportsReceived    Report[]            @relation("ReportedUserReports")

  @@index([clerkId])
  @@index([collegeId])
  @@index([email])
}

model Wallet {
  id              String              @id @default(cuid())
  userId          String              @unique
  balance         Decimal             @default(0) @db.Decimal(10, 2)
  frozenBalance   Decimal             @default(0) @db.Decimal(10, 2)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    WalletTransaction[]
}

model WalletTransaction {
  id              String                  @id @default(cuid())
  walletId        String
  type            WalletTransactionType
  amount          Decimal                 @db.Decimal(10, 2)
  description     String
  referenceId     String?                 // Transaction ID or withdrawal ID
  createdAt       DateTime                @default(now())

  wallet          Wallet                  @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@index([walletId])
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  slug      String    @unique
  iconName  String                        // Lucide icon name
  createdAt DateTime  @default(now())

  items     Item[]
}

model Item {
  id              String        @id @default(cuid())
  sellerId        String
  collegeId       String
  categoryId      Int
  title           String
  description     String?
  listingType     ListingType
  sellPrice       Decimal?      @db.Decimal(10, 2)
  rentPricePerDay Decimal?      @db.Decimal(10, 2)
  images          String[]                // Cloudinary URLs
  condition       ItemCondition
  status          ItemStatus    @default(AVAILABLE)
  pickupLocation  String?
  pickupLat       Float?
  pickupLng       Float?
  viewCount       Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  seller          User          @relation(fields: [sellerId], references: [id])
  college         College       @relation(fields: [collegeId], references: [id])
  category        Category      @relation(fields: [categoryId], references: [id])
  transactions    Transaction[]
  favorites       Favorite[]
  reports         Report[]      @relation("ReportedItemReports")

  @@index([sellerId])
  @@index([collegeId])
  @@index([status])
  @@index([categoryId])
  @@index([createdAt])
}

model Transaction {
  id                String            @id @default(cuid())
  itemId            String
  buyerId           String
  sellerId          String
  type              TransactionType
  status            TransactionStatus @default(PENDING)
  amount            Decimal           @db.Decimal(10, 2)
  razorpayOrderId   String?           @unique
  razorpayPaymentId String?           @unique
  razorpaySignature String?
  rentStartDate     DateTime?
  rentEndDate       DateTime?
  buyerMessage      String?
  sellerNotes       String?
  settledAt         DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  item              Item              @relation(fields: [itemId], references: [id])
  buyer             User              @relation("BuyerTransactions", fields: [buyerId], references: [id])
  seller            User              @relation("SellerTransactions", fields: [sellerId], references: [id])
  conversation      Conversation?
  reviews           Review[]

  @@index([buyerId])
  @@index([sellerId])
  @@index([razorpayOrderId])
  @@index([status])
}

model Conversation {
  id              String    @id @default(cuid())
  transactionId   String    @unique
  user1Id         String                  // typically buyer
  user2Id         String                  // typically seller
  ablyChannelName String    @unique       // "conversation:{id}"
  lastMessageAt   DateTime?
  createdAt       DateTime  @default(now())

  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  user1           User        @relation("User1Conversations", fields: [user1Id], references: [id])
  user2           User        @relation("User2Conversations", fields: [user2Id], references: [id])
  messages        Message[]

  @@index([user1Id])
  @@index([user2Id])
}

model Message {
  id              String      @id @default(cuid())
  conversationId  String
  senderId        String
  type            MessageType @default(TEXT)
  content         String                  // Text, image URL, or JSON location
  isRead          Boolean     @default(false)
  createdAt       DateTime    @default(now())

  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender          User         @relation(fields: [senderId], references: [id])

  @@index([conversationId])
  @@index([senderId])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([userId, itemId])
  @@index([userId])
}

model Review {
  id              String      @id @default(cuid())
  transactionId   String
  reviewerId      String
  revieweeId      String
  rating          Int                     // 1-5
  comment         String?
  createdAt       DateTime    @default(now())

  transaction     Transaction @relation(fields: [transactionId], references: [id])
  reviewer        User        @relation("ReviewerReviews", fields: [reviewerId], references: [id])
  reviewee        User        @relation("RevieweeReviews", fields: [revieweeId], references: [id])

  @@unique([transactionId, reviewerId])
  @@index([revieweeId])
}

model Verification {
  id              String              @id @default(cuid())
  userId          String
  idCardImageUrl  String                  // Cloudinary URL (private/signed)
  status          VerificationStatus  @default(PENDING)
  reviewerNotes   String?
  reviewedBy      String?                 // Admin user ID
  reviewedAt      DateTime?
  createdAt       DateTime            @default(now())

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  data      Json?                        // Arbitrary payload (itemId, transactionId, etc.)
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
}

model Report {
  id              String        @id @default(cuid())
  reporterId      String
  reportedUserId  String?
  reportedItemId  String?
  reason          ReportReason
  description     String?
  status          ReportStatus  @default(PENDING)
  adminNotes      String?
  reviewedBy      String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  reporter        User          @relation("ReporterReports", fields: [reporterId], references: [id])
  reportedUser    User?         @relation("ReportedUserReports", fields: [reportedUserId], references: [id])
  reportedItem    Item?         @relation("ReportedItemReports", fields: [reportedItemId], references: [id])

  @@index([status])
}
```

---

## 6. API Endpoints (Complete)

### Health & Infrastructure
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check (returns `{ status: "ok" }`) |
| POST | `/api/ably/token` | Yes | Create Ably token request for real-time auth |

### Authentication & Webhooks
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/clerk` | Webhook Secret | Clerk webhook → sync user creation/updates to DB |
| POST | `/api/payments/webhooks/razorpay` | Webhook Secret | Razorpay async payment status updates |

### Users & Profiles
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Yes | Current user profile + wallet summary |
| PUT | `/api/users/me` | Yes | Update profile (name, phone, avatar) |
| POST | `/api/users/onboarding` | Yes | Complete onboarding (select college, set name) |
| GET | `/api/users/:id` | No | Public user profile (name, college, rating, reviews) |
| GET | `/api/users/me/notification-preferences` | Yes | Get notification preferences |
| PUT | `/api/users/me/notification-preferences` | Yes | Update notification preferences |

### Colleges
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/colleges` | No | List all active colleges |
| GET | `/api/colleges/:slug` | No | Single college details |

### Items (Listings)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/items` | No | Browse items (paginated, filtered, scoped by college) |
| GET | `/api/items/:id` | No | Item detail with seller info + category |
| POST | `/api/items` | Verified | Create listing |
| PUT | `/api/items/:id` | Owner | Update listing |
| DELETE | `/api/items/:id` | Owner | Delete listing |
| GET | `/api/users/me/items` | Yes | Current user's listings |

### Categories
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | No | List all categories |

### Orders & Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/create` | Yes | Create Razorpay order for an item |
| POST | `/api/payments/verify` | Yes | Verify Razorpay payment signature |

### Transactions
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/transactions` | Yes | User's transactions (as buyer + seller) |
| GET | `/api/transactions/:id` | Buyer/Seller | Transaction detail |
| POST | `/api/transactions/:id/confirm-receipt` | Buyer | Confirm item received → settle + release funds |
| POST | `/api/transactions/:id/dispute` | Buyer/Seller | Raise dispute |

### Wallet
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wallet` | Yes | Current balance + frozen balance |
| GET | `/api/wallet/history` | Yes | Wallet transaction ledger |
| POST | `/api/wallet/withdraw` | Yes | Request withdrawal to bank |

### Chat
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/conversations` | Yes | User's conversation list |
| GET | `/api/conversations/:id` | Participant | Messages in conversation |
| POST | `/api/conversations/:id/messages` | Participant | Send message (also publishes to Ably) |

### Favorites
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/favorites` | Yes | User's favorited items |
| POST | `/api/favorites/:itemId` | Yes | Add to favorites |
| DELETE | `/api/favorites/:itemId` | Yes | Remove from favorites |

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reviews` | Yes | Submit review for a settled transaction |
| GET | `/api/reviews/user/:id` | No | Reviews for a user |

### Verifications
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/verifications` | Yes | Submit college ID for verification |
| GET | `/api/verifications/status` | Yes | Current verification status |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | User's notifications (paginated) |
| PATCH | `/api/notifications/read` | Yes | Mark notifications as read |
| DELETE | `/api/notifications/:id` | Yes | Delete a single notification |

### Reports
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reports` | Yes | Report a user or item |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/verifications` | Admin | Pending verification queue |
| PATCH | `/api/admin/verifications/:id` | Admin | Approve/reject verification |
| GET | `/api/admin/users` | Admin | User list with search/filter |
| PATCH | `/api/admin/users/:id` | Admin | Ban/unban/force-verify user |
| GET | `/api/admin/reports` | Admin | Reports queue |
| PATCH | `/api/admin/reports/:id` | Admin | Handle report |
| GET | `/api/admin/transactions` | Admin | All transactions |
| PATCH | `/api/admin/transactions/:id` | Admin | Intervene (refund/release) |
| POST | `/api/admin/colleges` | Admin | Create college |
| PUT | `/api/admin/colleges/:id` | Admin | Update college |

---

## 7. Key User Flows

### Flow 1: Onboarding & Verification
```
Sign Up (Clerk) → Email Verification → Select College → Complete Profile
→ Click "Sell Item" → "Verification Required" prompt
→ Upload College ID (Cloudinary) → Submitted to Admin Queue
→ Admin Reviews & Approves → Notification: "You can now sell!"
→ User is VERIFIED → Can create listings
```

### Flow 2: Purchase & Escrow (The "Hold" Phase)
```
Buyer clicks "Buy Now" → POST /api/orders/create (Razorpay order)
→ Razorpay payment modal → Buyer pays ₹500
→ POST /api/payments/verify (signature check)
→ Transaction: CAPTURED → RESERVED
→ Item status: RESERVED
→ Seller wallet: frozenBalance += ₹500
→ Chat opens between buyer & seller
→ Seller shares meetup location via Mapbox
→ Physical meetup & inspection
→ Buyer clicks "Item Received" → POST /api/transactions/:id/confirm-receipt
→ Transaction: SETTLED
→ Seller wallet: frozenBalance -= ₹500, balance += ₹500
→ Push notification: "₹500 added to wallet!"
→ Both prompted to rate & review
```

### Flow 3: Chat & Location Sharing
```
Transaction starts → Conversation auto-created
→ Ably channel: "conversation:{id}" subscribed on both clients
→ Buyer sends message → POST /api/conversations/:id/messages
→ Backend stores in DB + publishes to Ably channel
→ Seller receives real-time → typing indicators via Ably presence
→ Seller clicks "Share Location" → Mapbox picker → sends location message
→ Buyer sees mini-map with pin in chat
```

---

## 8. Environment Variables

### Client (`campx-client/.env`)
```
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS=campx-items
VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS=campx-avatars
VITE_CLOUDINARY_UPLOAD_PRESET_IDS=campx-ids
VITE_ABLY_API_KEY=your_ably_key
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### Server (`campx-server/.env`)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/campx
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
ABLY_API_KEY=your_ably_root_key
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:5173
```

---

## 9. Image Upload Strategy (Cloudinary)

| Use Case | Upload Preset | Max Size | Transformations | Access |
|---|---|---|---|---|
| Item images (up to 5) | `campx-items` | 5MB | Auto-format, auto-quality, max 1200px, eager: 400px thumb | **Public** |
| College ID card | `campx-ids` | 5MB | None (keep original for admin review) | **Authenticated** (signed URLs) |
| Profile avatars | `campx-avatars` | 2MB | 200x200 crop, face detection, circle mask | **Public** |

### Upload Flow (Client-Side Direct Upload)
```
User selects image → Cloudinary Upload Widget opens
→ Image uploaded directly to Cloudinary (no backend involved)
→ Widget returns { secure_url, public_id }
→ Frontend stores URL in form state
→ On form submit, URL array sent to backend API
→ Backend stores URLs in PostgreSQL via Prisma
```

### Image Cleanup
- Backend: when item is deleted, call Cloudinary API to delete associated images by `public_id`
- Admin: when rejecting a listing, images are cleaned up

---

## 10. What Changed from theoldrepo (CampusMarket)

| Aspect | Old (CampusMarket) | New (CampX) |
|---|---|---|
| Auth | Supabase Auth (email only) | Clerk (Google OAuth + email) |
| Database | Supabase PostgreSQL (raw queries) | Railway PostgreSQL + Prisma ORM |
| Images | Supabase Storage (5MB, no CDN) | Cloudinary (CDN, auto-optimize, transforms) |
| Payments | None (WhatsApp contact only) | Razorpay escrow + wallet |
| Chat | None | Ably real-time messaging |
| Notifications | None | In-app (Ably) + email (Resend) |
| Maps | None | Mapbox (location picker, campus geo-fence) |
| ID Verification | None | Full flow: upload → admin review → approve |
| Multi-college | Single `college_name` text field | Proper `colleges` table, scoped marketplace |
| Wallet | None | balance + frozenBalance + withdrawal |
| Favorites | DB table existed, zero code | Fully implemented |
| Reviews/Ratings | None | Post-transaction ratings |
| Admin Panel | None | Full: verifications, users, reports, transactions |
| Dark Mode | Configured but no toggle | Fully implemented |
| TypeScript | JavaScript only | Full TypeScript |
| Pagination | None (load all) | Cursor-based pagination |
| Error Handling | Minimal | Global error boundary + toast + interceptor |
| Security | CORS wide open, no rate limit | Locked CORS, rate limiting, Helmet |
| Deployment | Render (manual) | Vercel (frontend) + Railway (backend), auto-deploy |

---

## 11. Design Principles

1. **Trust First** — verification badges, escrow, ratings visible everywhere
2. **Mobile First** — all designs start at 375px, scale up
3. **Progressive Disclosure** — show simple first, details on demand
4. **Instant Feedback** — optimistic updates, skeleton loaders, toast notifications
5. **Micro-interactions** — Framer Motion on every state change
6. **Accessibility** — Radix primitives (shadcn) provide keyboard + screen reader support
7. **College Identity** — each campus feels like "their" marketplace

---

## 12. Constraints & Limitations

- **Razorpay Test Mode**: No real money moves. Test cards: `4111 1111 1111 1111` (Visa)
- **Railway Free Tier**: 512MB RAM, $5 credit — sufficient for college demo
- **Ably Free Tier**: 6M messages/month — ~200 active users chatting daily
- **No actual bank withdrawal**: Razorpay Payout API requires business KYC. The UI and flow are built, but withdrawal triggers a "Coming Soon" or mock response
- **No geo-fence enforcement**: Mapbox campus boundary is visual + advisory. No hard GPS check on confirm receipt (would require mobile app)
- **Single currency**: INR only (Razorpay limitation in test mode)
