# Ruvia Jewels — Technical Stack, Architecture & Design System

This document provides a complete breakdown of the technology stack, infrastructure, environment configuration, application architecture, and design language powering **Ruvia Jewels**.

---

## 1. Executive Summary

**Ruvia Jewels** is a contemporary jewelry e-commerce platform offering Korean-inspired minimalism and modern Indo-Western pieces designed for everyday wear. The platform covers the complete customer journey — browsing, filtering, checkout, payment, order tracking — alongside a full administrative suite for product, order, media, and coupon management.

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | 14.2.29 | React framework — App Router, Server & Client Components, Route Handlers, dynamic metadata |
| **React** | 18.3.1 | UI component library — hooks, context providers, state management |
| **TypeScript** | ~5.8.2 | Strict type safety across data models, API responses, forms, and contexts |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS with custom brand colors, responsive layouts, and component variants |
| **Framer Motion** | 11.15.0 | Scroll reveals (`FadeInSection`), modal transitions, and micro-interactions |
| **Lucide React** | 0.546.0 | Vector icon library |
| **Recharts** | 3.10.1 | Revenue, sales, and analytics charts in the Admin dashboard |
| **clsx + tailwind-merge** | latest | Dynamic class merging via `cn()` utility |

### 2.2 Backend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js Route Handlers** | 14.2.29 | All API endpoints under `app/api/` — products, orders, admin, payments, coupons |
| **Supabase JS SDK** | 2.112.3 | Database queries, auth token validation, row-level security enforcement |
| **Supabase SSR** | 0.5.2 | Server-side session handling and cookie-based auth in Route Handlers |
| **Razorpay** | 2.9.6 | Payment order creation, signature verification, and webhook handling |
| **Nodemailer** | 9.0.3 | Transactional emails — order confirmations to customers and admin notifications |

### 2.3 Database

| Technology | Details |
| :--- | :--- |
| **Supabase (PostgreSQL)** | Managed Postgres database hosted on Supabase |
| **Tables** | `products`, `product_variants`, `product_images`, `categories`, `user_orders`, `order_timeline`, `coupons`, `site_settings`, `hero_slides`, `shipping_methods` |
| **Auth** | Supabase Auth (email/password) — JWT-based session management |
| **Row-Level Security** | Enabled on all tables; public read on products/categories, admin-only writes |
| **Migrations** | `supabase/migrations/` — versioned SQL migration files |

### 2.4 Media Storage

| Technology | Details |
| :--- | :--- |
| **Cloudinary** | All product images, editorial banners, and media library assets |
| **Cloud Name** | `niagn9pn` |
| **Upload Preset** | `almas_bridal` |
| **Folder** | `almas_bridal/products/` |
| **Features used** | Upload (server + direct client fallback), list resources, bulk delete via Admin API |

### 2.5 Hosting & Deployment

| Technology | Details |
| :--- | :--- |
| **Vercel** | Production hosting — automatic deploys from `main` branch |
| **Configuration** | `vercel.json` in project root |
| **Build Command** | `next build` |
| **Dev Command** | `next dev` |
| **Environment Variables** | Set in Vercel Dashboard → Project → Settings → Environment Variables |

---

## 3. Environment Variables

All variables are defined in `.env.local` for local development and in **Vercel Dashboard** for production.
Reference template: `.env.example`

### 3.1 Public (exposed to browser)

| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Used in email links and canonical URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key for client-side queries |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `niagn9pn` | Cloudinary cloud name for direct uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `almas_bridal` | Cloudinary unsigned upload preset |
| `NEXT_PUBLIC_ADMIN_EMAILS` | `admin@yourdomain.com` | Additional admin emails (comma-separated), beyond hardcoded list |

### 3.2 Server-only (never exposed to browser)

| Variable | Purpose |
| :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — used in all admin API routes for privileged DB access |
| `CLOUDINARY_API_KEY` | Cloudinary API key — for media listing and deletion via Admin API |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret — for signed Cloudinary Admin API requests |
| `RAZORPAY_KEY_ID` | Razorpay key ID — for payment order creation |
| `RAZORPAY_KEY_SECRET` | Razorpay secret — for payment signature verification |
| `SMTP_HOST` | SMTP server host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587`) |
| `SMTP_USER` | SMTP sender email address |
| `SMTP_PASS` | SMTP app password (Gmail: 16-char app password) |
| `ADMIN_EMAIL` | `almasladiescornersakchi@gmail.com` — receives order notification emails |

### 3.3 Hardcoded Admin Emails (`lib/auth-helper.ts`)

These emails have admin access regardless of `NEXT_PUBLIC_ADMIN_EMAILS`:

```
faisal301196@gmail.com
almasladiescornersakchi@gmail.com
```

Admin access is granted when the signed-in Supabase user's email matches any entry in the combined list.

---

## 4. Design System

### 4.1 Color Palette

| Role | Hex | Usage |
| :--- | :--- | :--- |
| **Deep Luxury Green** | `#022c22` | Header, footer, primary buttons, active category pills |
| **Forest Hover** | `#064e3b` | Button hover states, accent sections |
| **Royal Gold** | `#D4AF37` | Logo accents, badges, CTA text on dark backgrounds, active states |
| **Canvas Background** | `#FAF9F6` | Page background |
| **Surface White** | `#FFFFFF` | Cards, modals, sidebar panels |
| **Text Primary** | `#022c22` / `#171717` | Headings, product names |
| **Text Muted** | `#525252` / `#9CA3AF` | Descriptions, metadata, sub-labels |

### 4.2 Typography

| Role | Font | Usage |
| :--- | :--- | :--- |
| **Display / Brand** | `Playfair Display` (Serif) | Hero titles, product names, section headings, logo |
| **Body / UI** | `Inter` (Sans-Serif) | Body copy, buttons, inputs, navigation, prices |

### 4.3 Business Rules

| Rule | Value |
| :--- | :--- |
| **Free Shipping Threshold** | Orders ≥ ₹1,999 → FREE shipping |
| **Standard Shipping** | Orders < ₹1,999 → ₹49 flat rate |
| **Pagination (Shop)** | 20 products per page, infinite scroll |
| **Pagination (Admin Products)** | 20 products per page |
| **Admin Media Page Size** | 10 images per page (Cloudinary cursor-based) |

---

## 5. Key API Routes

### Storefront

| Method | Route | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/products` | List products — supports `page`, `limit`, `search`, `category`, `style`, `material_type`, `color`, `price_min`, `price_max`, `sort`, `archived` |
| `POST` | `/api/products` | Create product (admin auth required) |
| `GET` | `/api/products/[id]` | Single product detail |
| `PUT` | `/api/products/[id]` | Update product (admin auth required) |
| `DELETE` | `/api/products/[id]` | Delete product (admin auth required) |
| `GET` | `/api/orders/track` | Order tracking by tracking number |
| `POST` | `/api/orders/cancel` | Cancel an order |
| `POST` | `/api/payment/create-order` | Create Razorpay payment order |
| `POST` | `/api/payment/success` | Verify Razorpay signature & place order |
| `POST` | `/api/coupons/validate` | Validate a coupon code |
| `GET` | `/api/ping` | Health check |

### Admin (all require admin auth)

| Method | Route | Purpose |
| :--- | :--- | :--- |
| `GET/POST/PUT/DELETE` | `/api/admin/categories` | Category CRUD |
| `GET/POST/PUT/DELETE` | `/api/admin/coupons` | Coupon CRUD |
| `GET/PUT` | `/api/admin/orders` | Order list and status updates |
| `DELETE` | `/api/admin/orders/[id]` | Delete order |
| `GET` | `/api/admin/customers` | Customer list |
| `GET` | `/api/admin/analytics` | Revenue and sales analytics |
| `GET/DELETE` | `/api/admin/media` | Cloudinary media list and bulk delete |
| `POST` | `/api/admin/upload` | Cloudinary image upload |
| `GET/POST` | `/api/admin/settings` | Site settings key-value store |
| `POST` | `/api/admin/seed` | Seed fallback products to DB |
| `GET` | `/api/admin/low-stock` | Low stock product alerts |

---

## 6. Database Migrations

Migrations are located in `supabase/migrations/` and applied in order:

| File | Description |
| :--- | :--- |
| `001_init.sql` | Initial schema — products, orders, users |
| `002_seed_products.sql` | Seed initial product data |
| `003_admin_tables.sql` | Categories, variants, images, order timeline, coupons, site settings, hero slides, shipping |
| `004_indexes.sql` | Performance indexes |
| `005_add_style_column.sql` | Add `style` column to products |
| `006_material_type_and_new_categories.sql` | Add `material_type`, rename categories |
| `007_coupon_enhancements.sql` | Coupon usage limits, expiry, discount types |
| `008_rename_bangles_category.sql` | Rename `Bangles & Kadas` → `Bangles & Bracelets` |
| `009_add_product_archived.sql` | Add `is_archived` boolean for soft-hiding products from shop |

---

## 7. Directory Structure

```
├── app/
│   ├── layout.tsx                  # Root layout (fonts, meta, providers)
│   ├── page.tsx                    # Homepage (hero, editorial drops, lookbook, reviews)
│   ├── providers.tsx               # Auth, Cart, Wishlist, Search context wrappers
│   ├── shop/page.tsx               # Shop — infinite scroll, server-side filtering, sidebar
│   ├── product/[id]/page.tsx       # Product detail — gallery, variants, add to cart
│   ├── cart/page.tsx               # Cart with shipping threshold calculation
│   ├── checkout/page.tsx           # Checkout — address, coupon, Razorpay payment
│   ├── track/page.tsx              # Order tracking by tracking number
│   ├── profile/page.tsx            # Customer profile and order history
│   ├── wishlist/page.tsx           # Saved wishlist items
│   ├── success/page.tsx            # Post-payment success page
│   ├── reset-password/page.tsx     # Password reset flow
│   ├── about/ faq/ blog/           # Informational pages
│   ├── shipping/ returns/          # Policy pages
│   ├── terms/ privacy/             # Legal pages
│   ├── admin/
│   │   ├── page.tsx                # Dashboard — KPI cards, recent orders
│   │   ├── products/page.tsx       # Product CRUD, archive/unarchive, image upload
│   │   ├── orders/page.tsx         # Order fulfillment and status management
│   │   ├── categories/page.tsx     # Category CRUD (stored in Supabase DB)
│   │   ├── customers/page.tsx      # Customer directory
│   │   ├── coupons/page.tsx        # Coupon code management
│   │   ├── analytics/page.tsx      # Recharts revenue and sales analytics
│   │   ├── media/page.tsx          # Cloudinary media library — upload, bulk delete
│   │   ├── seo/page.tsx            # SEO metadata configuration
│   │   └── settings/page.tsx       # Store configuration — shipping, announcements
│   └── api/                        # Next.js Route Handlers (see Section 5)
├── components/
│   ├── Navbar.tsx                  # Sticky header — logo, nav links, cart/wishlist icons
│   ├── Footer.tsx                  # Footer — brand, quick links (2-col), contact
│   ├── RuviaLogo.tsx               # Brand logo component
│   ├── MobileBottomNav.tsx         # Fixed 5-tab mobile bottom navigation
│   ├── StorefrontShell.tsx         # Layout wrapper — header, footer, search modal
│   ├── SearchModal.tsx             # Real-time search overlay
│   ├── AuthModal.tsx               # Sign-in / register / reset modal
│   ├── WhatsAppButton.tsx          # Floating WhatsApp chat button
│   └── admin/
│       ├── Sidebar.tsx             # Admin navigation sidebar
│       ├── Toast.tsx               # Toast notification system
│       └── ConfirmModal.tsx        # Reusable delete confirmation modal
├── contexts/
│   ├── AuthContext.tsx             # Supabase auth state
│   ├── CartContext.tsx             # Cart state with localStorage persistence
│   ├── WishlistContext.tsx         # Wishlist state with localStorage persistence
│   └── SearchContext.tsx           # Search modal open/close state
├── lib/
│   ├── data.ts                     # Product type, CATEGORIES, IMAGES constants, fallback data
│   ├── admin-utils.ts              # adminFetch wrapper, formatPrice
│   ├── auth-helper.ts              # requireAdmin / requireAuth — email-based access control
│   ├── email.ts                    # Nodemailer order confirmation email templates
│   ├── utils.ts                    # cn() class merge helper
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server-side Supabase client (SSR cookies)
│       └── admin.ts                # Service-role Supabase client for admin API routes
├── supabase/
│   └── migrations/                 # Versioned SQL migration files (see Section 6)
├── public/
│   ├── images/
│   │   ├── ruvia-logo.jpg          # Brand logo
│   │   └── ruvia-logo-circle.png   # Circular logo asset
│   ├── favicon.ico
│   └── icon.png
├── .env.example                    # Environment variable template
├── .env.local                      # Local development secrets (gitignored)
├── next.config.mjs                 # Next.js config — Cloudinary + Google remote image patterns
├── tailwind.config.ts              # Tailwind theme configuration
├── vercel.json                     # Vercel deployment configuration
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## 8. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Apply database migrations
# Open Supabase Dashboard → SQL Editor → run each file in supabase/migrations/ in order

# 4. Start development server
npm run dev
# App runs at http://localhost:3000
# Admin portal at http://localhost:3000/admin

# 5. Type check
npm run typecheck

# 6. Lint
npm run lint
```

---

## 9. Deployment (Vercel)

1. Push code to `main` branch on GitHub
2. Vercel auto-deploys on every push
3. Set all variables from **Section 3** in **Vercel Dashboard → Project → Settings → Environment Variables**
4. Run any new migration SQL files via **Supabase Dashboard → SQL Editor**
