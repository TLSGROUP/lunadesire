# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.local` for all required variables. Key ones:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**DreamLove API:**
- `DREAMLOVE_API_URL`, `DREAMLOVE_USERNAME`, `DREAMLOVE_PASSWORD`

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Admin/Cron:**
- `CRON_SECRET` - Protection for sync endpoints
- `ADMIN_EMAIL`

**App:**
- `NEXT_PUBLIC_SITE_URL`, `DEFAULT_MARKUP_PCT` (default: 10), `DEFAULT_CURRENCY` (EUR)

## Architecture Overview

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- Supabase (PostgreSQL + auth)
- DreamLove REST API (gesio.be) for product sync
- Stripe for payments
- Tailwind CSS 4

**Key Design Patterns:**

1. **Server Components** - All pages are async Server Components; data fetching happens server-side via `createClient()` or `createServiceClient()`

2. **Supabase Clients:**
   - `createClient()` - User-scoped with SSR cookie handling
   - `createServiceClient()` - Admin service role, bypasses RLS

3. **DreamLove Sync:**
   - Full sync: `/api/dreamlove/sync` (CRON-triggered)
   - Streaming sync: `/api/admin/sync-stream` (admin UI)
   - Syncs products, categories, translations, brands
   - Incremental sync via `updated_at_supplier` timestamps

4. **i18n:**
   - 8 locales: en, es, fr, de, it, pt, pl, nl
   - Product translations stored in `product_translations` table
   - Spanish translations generated from base product data

5. **E-commerce Flow:**
   - Shop: `/[locale]/(shop)/` routes
   - Cart → Checkout → Order → Stripe Payment → DreamLove order creation
   - Real-time stock checks via DreamLove API before checkout

6. **Admin Panel:** `/admin/*`
   - Role-based access (`role = 'admin'` in profiles table)
   - Product management, order viewing, sync triggers

7. **Pricing:**
   - `calculateRetailPrice(supplierPrice, markupPct)` - Base markup
   - `charmPrice(price)` - Round to .99
   - VAT stored per-product, computed into prices

**Database Schema (key tables):**
- `products` - Product catalog with supplier/retail prices, stock, brand
- `product_translations` - Locale-specific name/description
- `categories` - Category hierarchy with `dreamlove_id`
- `cart_items` - User cart
- `orders` - Customer orders
- `order_items` - Order line items
- `sync_logs` - Sync operation history

## API Documentation

- `swagger.json` - OpenAPI 3.0 spec for DreamLove REST API (auto-generated)
