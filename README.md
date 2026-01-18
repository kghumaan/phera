# Phera - Modern Indian Wedding Platform

> [!IMPORTANT]
> **AI CONTEXT & MAINTAINABILITY**: This file serves as the primary technical reference for AI assistants (Antigravity, Gemini, etc.) and developers. 
> **CRITICAL**: Always update this `README.md` after adding new features, changing schemas, or updating authentication flows to maintain its status as the single source of truth.

---

## 🌟 Project Overview

**Phera** is a comprehensive, multi-tenant platform designed to eliminate the "Coordination Nightmare" of Indian weddings. It provides a dual-experience architecture: a powerful admin suite for couples and a mobile-first, culturally-aware portal for guests.

### Core Philosophy
- **"Minus the Chaos"**: Automating RSVP tracking, flight coordination, and guest communication.
- **Cultural First**: Native support for multi-day events like Haldi, Mehendi, Sangeet, and Vows.
- **Mobile Perfect, Desktop Enhanced**: A design system optimized for guests on the move.
- **Scalable Help**: A "Start Free" model with optional AI-powered "Smart Agents" for specific tasks.

---

## 🛠 Features & Offerings

### 1. Landing Page (`/`)
Designed to showcase the value proposition for couples:
- **Pain Point Resolution**: Directly addresses coordination chaos, RSVP tracking, travel logistics, and the "WhatsApp Spiral."
- **Feature Showcase**: Highlights Smart RSVP, Privacy Controls, Team Collaboration, and WhatsApp integration.
- **Smart Agents (Coming Soon)**: 12 specialized AI assistants (Maya the Travel Expert, Rohan the Emcee, Anjali the Chef, etc.) designed for destination weddings.

### 2. Admin Dashboard & Onboarding (`/admin`)
A 15-step wizard to build a fully customized wedding experience:
1.  **Overview**: Basic info (names, date, venue) and live analytics.
2.  **Design**: Custom colors (Primary, Font, Button) and 9+ pre-optimized cultural backgrounds (Haldi, Mehendi, etc.).
3.  **Events**: Multi-event builder with ritual descriptions and dress codes.
4.  **Schedule**: Day-by-day timeline creation.
5.  **Travel**: Custom travel cards for guests.
6.  **Travel Coordination**: Centralized flight tracking and airport pickup management.
7.  **FAQ**: Question management to reduce repetitive guest queries.
8.  **Registry**: Setup for honeymoon funds and cash gift collection via Stripe.
9.  **Shopping**: Curated outfit ideas and vendor recommendations.
10. **Details**: Menu and venue detail configuration.
11. **PIN Entry**: Custom messaging and styling for the guest access screen.
12. **Pins**: Management of Family (plus-one), Individual, and Bypass codes.
13. **Team**: Management of collaborators (Parents, Planners) with role-based access.
14. **Guests**: Central guest list with batch management and Export/Import.
15. **Settings**: Advanced wedding configuration and multi-tenant isolation.

### 3. Guest Portal (`/[weddingSlug]`)
A feature-rich experience for guests:
- **Advanced RSVP**: Multi-step form capturing party size, dietary restrictions (multi-select), and plus-one details.
- **Travel & Logistics**: 
    - **Flight Capture**: Guests can enter flight numbers and times.
    - **Shuttle Sign-Up**: Mutual exclusivity for return trips (Airport vs. Sukhumvit) and party size validation.
    - **Checklists**: Thailand-specific or custom checklists for international guest prep.
- **Real-Time Interaction**: A live guest wall (Comments) with Giphy integration and real-time Supabase subscriptions.
- **Modern Registry**: Secure Stripe-powered gifts with personalized donor messages.

---

## 🔐 Security & Access Control

### Flexible PIN System
- **Family PIN**: Entitles the guest to bring plus-ones and children.
- **Individual PIN**: Restricted to a single attendee.
- **Bypass PIN**: Grants immediate access without requiring an RSVP update (for VIPs).
- **Customization**: Every wedding can style their own PIN entry screen with unique backgrounds and copy.

### Authentication Methods
Supports 6 integrated methods:
- PIN-based (Primary)
- Email & Phone OTP
- Google OAuth
- Plus-One Auth (special record linking)
- Auto-Auth (post-submission state)

---

## ⚙️ Technical Architecture

### Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL with RLS partitioned by `wedding_id`)
- **UI**: Material Design 3 (MUI) + TailwindCSS 4
- **Payments**: Stripe Elements & Payment Intents
- **Real-Time**: Supabase Realtime (WebSockets) for Comments & Activity Feed

### Code Patterns
- **Service Layer**: Business logic isolated in `lib/supabase/*-service.ts`.
- **Ref Patterns**: Use `wedding_id` (UUID) for data operations and `wedding_slug` for URL routing.
- **Redirection Engine**: A `/go/[pageKey]/[weddingSlug]` pattern in `middleware.ts` handles WhatsApp's requirement for dynamic parameters at the end of URLs, mapping short keys (e.g., `events`, `shopping`) to their actual app paths.
- **Theme**: Centralized M3 theme in `lib/theme/m3-theme.ts` with responsive scale.

---

## 🤖 AI Development Guidelines

This project is optimized for AI-assisted development (Cursor, Antigravity, Gemini).

### How to use this documentation
1. **Context Loading**: AI assistants should read this `README.md` first to understand the multi-tenant architecture and security layers.
2. **MCP Integration**: Use the Supabase MCP to:
    - Query guest lists for debugging.
    - Inspect the `weddings` table for configuration.
    - Generate TypeScript types from the live schema.

### Developer/AI Instructions
- **Never Hardcode IDs**: Always fetch context from the URL slug or active session.
- **Respect RLS**: Do not attempt to bypass Row Level Security.
- **Mobile-First CSS**: Always use MUI's responsive objects (e.g., `sx={{ pb: { xs: 2, md: 4 } }}`) to ensure the guest experience remains flawless on mobile.

---

## � Deployment & Setup

### Environment Variables
Required keys for a functional local/vibe environment:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
```

### Database Initialization
Run migrations in `migrations/` folder sequentially using the Supabase SQL Editor or CLI. Ensure real-time is enabled on the `comments` table.

---

**Last Verified**: Jan 2026  
**Documentation Status**: Live & Consolidated  
*Always maintain this document as a reflection of the current product state.*
