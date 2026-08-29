# Ruvia Jewels — Technical Stack, Architecture & Luxury Design System

This document provides a comprehensive breakdown of the technology stack, application architecture, luxury design language, directory structure, and key modules powering **Ruvia Jewels (روفيا)**.

---

## 1. Executive Summary

**Ruvia Jewels** is a contemporary **Korean-inspired + Indo-Western jewelry brand designed specifically for Gen Z women** (*"Seoul attitude. Indian soul. Everyday shine."*). Repositioned away from heavy traditional bridal wear into accessible luxury, the platform specializes in waterproof, tarnish-free minimal chains, bow/heart pendants, huggies, stackable rings, contemporary fusion jhumkas, and modern chandbalis. The application emphasizes tactile motion, seamless checkout, real-time product search, persistent wishlist & cart synchronization, order tracking, and an administrative portal.

---

## 2. Technology Stack Overview

### 2.1 Frontend Framework & Core Libraries
* **Next.js 14 (`next` v14.2.29)**: Modern React Framework utilizing the App Router (`app/`), Server & Client Components, Route Handlers (`app/api/`), optimized image handling, and dynamic metadata generation.
* **React 18 (`react` & `react-dom` v18.3.1)**: Declarative UI component library utilizing modern hooks, context providers, and strict state management.
* **TypeScript (~5.8.2)**: Strict type-safety across product data models, cart/wishlist context types, API responses, and administrative forms.
* **Framer Motion (`framer-motion` v11.15.0)**: Hardware-accelerated fluid layout transitions, micro-interactions, modal staging, and scroll reveals (`FadeInSection`).
* **Lucide React (`lucide-react` v0.546.0)**: Clean vector iconography styled in crisp pure white & royal gold accents.
* **Recharts (`recharts` v3.10.1)**: Interactive revenue, sales, and analytics visualization charts in the Admin Portal.

### 2.2 Styling & Design Architecture
* **Tailwind CSS v3 (`tailwindcss` v3.4.17, `postcss`, `autoprefixer`)**: Utility-first CSS engine configured with custom brand colors, custom font variables, and responsive grid layouts.
* **Class Merging Utilities (`clsx`, `tailwind-merge`)**: Dynamic class evaluation and conflict resolution helper (`cn()`).

### 2.3 Backend, API & Cloud Persistence
* **Next.js App Router API Route Handlers (`app/api/`)**:
  * `/api/products` & `/api/products/[id]`: Product catalog listing, category filtering, search, and detail retrieval.
  * `/api/orders`: Order placement, status tracking, and order management.
  * `/api/admin/*`: Protected administrative management endpoints.
* **Supabase (`@supabase/supabase-js` v2.112.3 & `@supabase/ssr` v0.5.2)**:
  * **Authentication**: User sign-up, sign-in, password reset, and metadata persistence.
  * **PostgreSQL Database**: Persistent storage for products, orders, categories, customers, coupons, and site settings.
* **Cloudinary & Media Assets**: High-resolution image asset CDN hosted under Cloudinary preset `almas_bridal`.
* **Payment Gateway**: **Razorpay (`razorpay` v2.9.6)** integration for 256-bit encrypted SSL checkout payments.
* **Transactional Email**: **Nodemailer (`nodemailer` v9.0.3)** for customer order receipts and admin sale notifications.

---

## 3. Luxury Design System & Aesthetic Language

The visual design system of Ruvia Jewels is constructed around the principles of **Haute Couture Elegance, Spatial Generosity, and Editorial Minimalism**.

### 3.1 Color Palette & Visual Tones

| Role | Token / Value | Hex | Description |
| :--- | :--- | :--- | :--- |
| **Primary Brand (Deep Luxury)** | `--color-emerald-950` / Primary | `#022c22` | Deep Arabian Emerald. Grounding, opulent, regal background tone for header & footer. |
| **Secondary Brand** | `--color-emerald-900` | `#064e3b` | Rich forest green for accent sections and interactive hover states. |
| **Luxury Accent (Royal Gold)** | Royal Gold Accent | `#D4AF37` | Warm brushed gold for primary action buttons, active navigation, badges, and logo swoosh lines. |
| **Light Canvas Background** | Light Neutral Base | `#FAFAF8` / `#FFFFFF` | Soft off-white preventing harsh starkness while maintaining high contrast. |
| **Text Primary** | High-contrast Neutral | `#171717` / `#022c22` | Deep charcoal/emerald black ensuring crisp legibility (WCAG AAA compliant). |
| **Text Muted / Sub-labels** | Neutral Mid-tone | `#525252` / `#737373` | Balanced secondary text for metadata, tracking numbers, and policy details. |

### 3.2 Typographic Hierarchy
* **Display & Brand Headings**: `Playfair Display` (Serif)
  * Imparts timeless romanticism, couture craftsmanship, and high-fashion prestige.
  * Used on hero titles, product names, collection banners, section headers, and the official **Ruvia Jewels** logo mark.
* **Body & UI Interface**: `Inter` (Sans-Serif)
  * Exceptional legibility at small sizes, optical balance, and clear numeric formatting for pricing and inventory counts.
  * Used for body copy, action buttons, inputs, navigation links, and order summaries.

### 3.3 Key Storefront Business Rules
1. **Free Shipping Threshold**:
   * **Orders ₹1,999 and above**: **FREE Shipping** across India (automatically applied in Cart & Checkout).
   * **Orders below ₹1,999**: Standard flat rate shipping of **₹49**.
2. **Badge & Counter Rules**:
   * Cart & Wishlist counters always display counts (showing `0` when empty).
3. **Mobile Responsiveness Directives**:
   * Fixed 5-tab mobile bottom navigation bar (`Home`, `Shop`, `Search`, `Cart`, `Account`).
   * Footer Quick Links & Collections render side-by-side in a 2-column mobile layout.
   * Product detail page gallery supports touch-enabled multi-image thumbnail scrolling and prev/next chevrons when multiple photos exist.

---

## 4. Key Functional Modules

### 4.1 Client Storefront
* **Hero Banner & Curated Showcase**: Landing page with bridal lookbook, value props, video lookbook, and trust badges.
* **Interactive Search Overlay (`SearchModal.tsx`)**: Real-time product search triggerable from Navbar or Mobile Bottom Nav with popular search tags and live product cards.
* **Filterable Shop Catalog (`/shop`)**: Multi-attribute filtering by category, stone color, plating, price range, text query search, and sorting.
* **Product Detail Showcase (`/product/[id]`)**: Multi-image touch gallery, zoom capability, inclusion lists, wishlist toggles, WhatsApp sharing, and quantity selectors.
* **Persistent Cart & Wishlist**: Real-time context state with empty state `0` badge indicators and order summary calculating shipping thresholds.
* **Checkout & Address Capture (`/checkout`)**: Multi-step checkout with coupon validation, Razorpay SSL payment, COD support, and order placement.
* **Live Order Tracking (`/track`)**: Order lookup by tracking ID with visual delivery status timeline.
* **Informational Pages**: About Us (`/about`), FAQ Accordion (`/faq`), Jewelry Blog (`/blog`), Shipping & Delivery (`/shipping`), Return & Exchange (`/returns`), Terms & Conditions (`/terms`), and Privacy Policy (`/privacy`).

### 4.2 Authentication & User Hub
* **Unified Auth Modal (`AuthModal.tsx`)**: Sign-in, account registration, and password recovery modal with click-outside auto-dismiss.
* **Customer Profile (`/profile`)**: Manage personal details, review past order history, track shipments, and toggle wishlist items.

### 4.3 Atelier Administrative Suite (`/admin`)
* **Responsive Layout & Navigation**: Mobile drawer drawer and desktop sidebar with active route highlighting.
* **Live Analytics & KPI Dashboard (`/admin`, `/admin/analytics`)**: Recharts revenue breakdown, order counts, customer metrics, and average order value.
* **Product Management (`/admin/products`)**: Paginated product list, search filtering, Cloudinary image upload, and full CRUD modal form.
* **Order Operations (`/admin/orders`)**: Real-time order status updates (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) and customer detail views.
* **Category & Coupon Management (`/admin/categories`, `/admin/coupons`)**: Category setup and promotional discount codes.
* **Site Settings & SEO (`/admin/settings`, `/admin/seo`)**: Announcement bar configuration, free shipping threshold defaults, tax rates, and meta descriptions.

---

## 5. Directory Structure

```
├── app/
│   ├── layout.tsx              # Root Next.js layout (Fonts, Meta, Favicons, Providers)
│   ├── page.tsx                # Homepage (Hero, Lookbook, Value Props, Testimonials)
│   ├── providers.tsx           # Context providers wrapper (Auth, Cart, Wishlist, Search)
│   ├── about/                  # About Us page route
│   ├── faq/                    # Interactive FAQ Accordion page route
│   ├── blog/                   # Jewelry Blog & Bridal Guide page route
│   ├── shipping/               # Shipping & Delivery details page route
│   ├── returns/                # Return & Exchange policy page route
│   ├── terms/                  # Terms & Conditions legal page route
│   ├── privacy/                # Privacy Policy page route
│   ├── shop/                   # Filterable shop catalog page route
│   ├── product/[id]/           # Product detail page route with gallery
│   ├── cart/                   # Shopping cart page route
│   ├── checkout/               # Checkout & payment page route
│   ├── track/                  # Live order tracking page route
│   ├── profile/                # Customer profile & order history page route
│   ├── reset-password/         # Security password reset route
│   ├── admin/                  # Administrative management portal routes
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── products/           # Product CRUD & image uploader
│   │   ├── orders/             # Order fulfillment management
│   │   ├── categories/         # Category management
│   │   ├── customers/          # Customer directory
│   │   ├── coupons/            # Coupon code manager
│   │   ├── analytics/          # Recharts revenue & sales analytics
│   │   ├── media/              # Media asset uploader
│   │   ├── seo/                # SEO metadata settings
│   │   └── settings/           # Store & shipping configuration
│   └── api/                    # Next.js Server Route Handlers
│       ├── products/           # GET/POST/PUT/DELETE products API
│       ├── orders/             # Order placement & status API
│       └── admin/              # Protected admin API handlers
├── components/
│   ├── Navbar.tsx              # Sticky header with logo, navigation & action icons
│   ├── Footer.tsx              # 2-column mobile side-by-side brand footer
│   ├── RuviaLogo.tsx           # Official Ruvia Jewels brand logo component
│   ├── MobileBottomNav.tsx     # Fixed 5-tab mobile navigation bar
│   ├── StorefrontShell.tsx     # Main layout wrapper with header, footer & search modal
│   ├── SearchModal.tsx         # Interactive real-time search modal overlay
│   ├── AuthModal.tsx           # Multi-mode login/register modal
│   ├── WhatsAppButton.tsx      # Floating WhatsApp chat widget
│   └── admin/                  # Sidebar, Toast, ConfirmModal admin components
├── contexts/
│   ├── AuthContext.tsx         # Supabase authentication context
│   ├── CartContext.tsx         # Shopping cart context with local storage persistence
│   ├── WishlistContext.tsx     # Wishlist context with local storage persistence
│   └── SearchContext.tsx       # Search modal toggle context
├── lib/
│   ├── data.ts                 # Product interface, fallback product data & constants
│   ├── admin-utils.ts          # Admin API fetch wrappers & price formatting
│   ├── auth-helper.ts          # Admin email authorization checks
│   ├── email.ts                # Transactional Nodemailer email templates
│   ├── utils.ts                # Tailwind class merge helper (cn)
│   └── supabase/               # Supabase browser & server client initializers
├── public/
│   ├── images/
│   │   ├── ruvia-logo.jpg      # Official Ruvia Jewels master logo image
│   │   └── ruvia-logo-circle.png # High-res circular PNG logo asset
│   ├── favicon.ico             # Circular browser favicon icon
│   └── icon.png                # App router favicon icon
├── package.json                # Project dependencies & npm scripts
├── tailwind.config.js          # Tailwind CSS theme configuration
└── tsconfig.json               # TypeScript compiler configuration
```
