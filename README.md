# CampX

Welcome to the **CampX** project!

**CampX** is a hyper-local, trust-first, peer-to-peer marketplace exclusively for university students. It enables buying, selling, and renting items (textbooks, electronics, furniture, sports gear, clothing, etc.) within and across campus communities.

For comprehensive documentation, please refer to the [CampX Wiki](https://github.com/theiter8r/miniproject-campx/wiki), which covers the following:

*   **Architecture & Tech Stack:** Details on the frontend (React/Vite/TypeScript on Vercel), backend (Node.js/Express/Prisma on Railway), and third-party services.
*   **Database Schema:** A visual representation of the PostgreSQL schema.
*   **API Reference:** A detailed list of all backend API endpoints.

## Core Thesis

Shift student transactions from **"Interpersonal Trust"** (WhatsApp groups, Facebook Marketplace) to **"Institutional Trust"** — a platform with Administrative Oversight, Mandatory Real-Name Authentication (RNA), and Automated Escrow services.

## The Solution

A centralized digital platform with:

1.  **College ID Verification** — mandatory before selling (Admin-reviewed).
2.  **Razorpay Escrow** — funds held until buyer confirms receipt.
3.  **In-App Wallet** — frozen/available balance with withdrawal.
4.  **Real-time Chat** — buyer-seller messaging with location sharing.
5.  **Multi-College** — each college has its own scoped marketplace.
6.  **Ratings & Reviews** — trust built through transaction history.

## Tech Stack Highlights

*   **Frontend**: React 18, Vite 6, TypeScript 5, Tailwind CSS, shadcn/ui, TanStack Query, Clerk, Mapbox, Ably. (Hosted on Vercel)
*   **Backend**: Node.js 20, Express 5, Prisma ORM, PostgreSQL 16, Razorpay, Clerk SDK. (Hosted on Railway)

---
*For more details, see the [Wiki Documentation](https://github.com/theiter8r/miniproject-campx/wiki).*
