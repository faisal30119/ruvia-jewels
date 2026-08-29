'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Droplets,
  Feather,
  Flame,
  ArrowRight,
  Heart,
  ShoppingBag,
  Instagram,
  Check,
  Star,
} from 'lucide-react';
import { FALLBACK_PRODUCTS, IMAGES, type Product } from '@/lib/data';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function FadeInSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Quick trend navigation chips
const TREND_CHIPS = [
  { label: '✨ The Seoul Edit', href: '/shop?category=Korean+Edit' },
  { label: '🌸 Indo-Western Fusion', href: '/shop?category=Indo-Western' },
  { label: '🎀 Bows & Coquette', href: '/shop?search=Bow' },
  { label: '🤍 Clean Girl Pearls', href: '/shop?category=Pearls' },
  { label: '⚡ Under ₹999', href: '/shop?price=Under+₹999' },
  { label: '💫 Everyday Stacks', href: '/shop?category=Necklaces' },
  { label: '🔥 Best Sellers', href: '/shop?sort=bestseller' },
];

// Curated 4 Editorial Collection Banners
const EDITORIAL_COLLECTIONS = [
  {
    title: 'The Seoul Edit',
    tagline: 'K-Fashion & Minimalism',
    desc: 'Dainty bow pendants, micro-huggies & clean line chains inspired by Hongdae streetwear.',
    image: IMAGES.seoulEditBanner,
    href: '/shop?category=Korean+Edit',
  },
  {
    title: 'Desi, But Make It Fashion',
    tagline: 'Modern Indo-Western',
    desc: 'Featherlight fusion jhumkas & contemporary chandbalis made for your modern kurtis & sarees.',
    image: IMAGES.indoWesternBanner,
    href: '/shop?category=Indo-Western',
  },
  {
    title: 'Your Everyday Stack',
    tagline: 'Tarnish-Free Layers',
    desc: 'Anti-tarnish, waterproof chains and organic molten rings designed to live on you 24/7.',
    image: IMAGES.everydayStackBanner,
    href: '/shop?category=Necklaces',
  },
  {
    title: 'The Under ₹999 Drop',
    tagline: 'Affordable Luxury',
    desc: 'Viral Instagram & TikTok-trending styles without the crazy designer markups.',
    image: IMAGES.under999Banner,
    href: '/shop?price=Under+₹999',
  },
];

// Style Inspiration Lookbook Cards
const STYLE_LOOKS = [
  {
    id: '01',
    look: 'Seoul Streetwear',
    piece: 'Yuna Snake Chain + Nami Ear Cuffs',
    outfit: 'Oversized blazer + basic white baby tee + baggy denim',
    image: IMAGES.styleSeoul,
  },
  {
    id: '02',
    look: 'Modern Indo-Western Chic',
    piece: 'Mira Minimalist Jhumkas + Kiara Chain',
    outfit: 'Linen slit kurti + wide-leg trousers or modern saree',
    image: IMAGES.styleIndoWestern,
  },
  {
    id: '03',
    look: 'Clean Girl Aesthetic',
    piece: 'Hana Seed Pearl Drop + Tennis Bracelet',
    outfit: 'Crisp poplin shirt + sleek slicked-back bun',
    image: IMAGES.styleCleanGirl,
  },
  {
    id: '04',
    look: 'Date Night Vibe',
    piece: 'Seoul Bow Choker + Aeri Molten Stack',
    outfit: 'Square-neck slip dress + tailored coat',
    image: IMAGES.styleDateNight,
  },
];

// Gen-Z Value Props
const VALUE_PROPS = [
  {
    icon: <Droplets size={26} className="text-[#D4AF37]" />,
    title: 'Waterproof & Sweatproof',
    desc: 'Premium PVD coated finish. Wear it in the shower, gym, or pool without worrying about tarnishing.',
  },
  {
    icon: <Feather size={26} className="text-[#D4AF37]" />,
    title: 'Featherlight Comfort',
    desc: 'Modern hollowed craftsmanship. All day wear with zero heaviness, ear-lobe pulling, or green skin.',
  },
  {
    icon: <Sparkles size={26} className="text-[#D4AF37]" />,
    title: 'Designed for Stacking',
    desc: 'Versatile lengths and stackable silhouettes created to effortlessly layer together.',
  },
  {
    icon: <Flame size={26} className="text-[#D4AF37]" />,
    title: 'Accessible Luxury',
    desc: 'Curated high-street fashion jewelry at fair prices with fast, insured delivery across India.',
  },
];

// Customer Reviews
const REVIEWS = [
  {
    name: 'Ananya Roy',
    city: 'Mumbai',
    quote:
      'The Seoul Bow Necklace is literally my everyday staple now! I wear it to college and to parties — it hasn’t tarnished at all even after weeks of daily wear.',
    item: 'Seoul Bow Pendant Necklace',
  },
  {
    name: 'Meher Kaur',
    city: 'Delhi',
    quote:
      'Finally, Indo-Western jhumkas that are actually lightweight! The Mira Jhumkas look so chic with my linen shirts and kurtis.',
    item: 'Mira Minimalist Indo-Western Jhumkas',
  },
  {
    name: 'Rhea Sen',
    city: 'Bengaluru',
    quote:
      'The packaging, the gold tone, the dainty pearls — everything screams expensive quiet luxury. Totally obsessed!',
    item: 'Hana Dainty Pearl Chain',
  },
];

export default function HomePage() {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<'trending' | 'korean' | 'indowestern' | 'under999'>('trending');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS));
  }, []);

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(p, 1);
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 1800);
  };

  const displayedProducts = products
    .filter((p) => {
      if (activeTab === 'korean') {
        return p.category === 'Pendants' || p.category === 'Necklaces' || p.category === 'Korean Edit' || p.trendTag === 'SEOUL EDIT' || p.style?.toLowerCase().includes('korean');
      }
      if (activeTab === 'indowestern') {
        return p.category === 'Indo-Western' || p.category === 'Oxidise jewelry' || p.category === 'Kundan Jewelry' || p.category === 'Meenakari Jewelry' || p.category === 'Polki Jewelry' || p.trendTag === 'INDO-WESTERN';
      }
      if (activeTab === 'under999') {
        return p.price < 1000 || p.trendTag === 'UNDER ₹999';
      }
      return true; // trending / all
    })
    .sort((a, b) => {
      // Put featured/spotlight items first
      if (Boolean(a.is_featured) && !Boolean(b.is_featured)) return -1;
      if (!Boolean(a.is_featured) && Boolean(b.is_featured)) return 1;
      return 0;
    })
    .slice(0, 8);

  return (
    <div className="bg-[#FAF9F6] text-neutral-900 overflow-hidden font-sans">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-[92vh] md:min-h-[96vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Cinematic Luxury Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.hero}
            alt="Ruvia Jewels Luxury Editorial"
            className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#011a14] via-[#022c22]/65 to-[#022c22]/40" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto py-20 sm:py-28 flex flex-col items-center">
          {/* Refined Glassmorphic Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-black/35 backdrop-blur-md border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full mb-5 shadow-md"
          >
            <Sparkles size={11} className="text-[#D4AF37] animate-spin duration-[4000ms]" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold">
              Korean-Inspired · Indo-Western · Everyday Luxury
            </span>
          </motion.div>

          {/* Luxury Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-medium tracking-tight leading-[1.15] mb-5 drop-shadow-md max-w-3xl"
          >
            Effortless Luxury for <br className="hidden sm:inline" />
            Your <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-[#FFF] via-[#D4AF37] to-[#F3E5AB]">Main Character</span> Era
          </motion.h1>

          {/* Editorial Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[#FAF9F6]/85 text-xs sm:text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed mb-8 drop-shadow"
          >
            Seoul-inspired minimalism meets contemporary Indian soul. 100% waterproof & anti-tarnish jewelry designed for your everyday shine.
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex items-center justify-center w-full sm:w-auto mb-10"
          >
            <Link
              href="/shop"
              className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F5E7B2] to-[#D4AF37] hover:from-[#c49f2c] hover:via-[#ebd99a] hover:to-[#c49f2c] text-[#022c22] font-bold text-xs sm:text-sm uppercase tracking-[0.2em] px-10 py-4 rounded-full shadow-[0_10px_35px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Shop New In</span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Luxury Micro Guarantee Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-white/80 font-medium tracking-wider uppercase border-t border-white/15 pt-6 max-w-3xl"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>💧 Waterproof & Anti-Tarnish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>🌿 Hypoallergenic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>✨ Everyday Stacking</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll Pill Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50 text-xs">
          <span className="uppercase tracking-widest text-[9px] font-medium">Scroll</span>
          <div className="w-3.5 h-6 border border-white/30 rounded-full flex justify-center p-0.5">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-1.5 bg-[#D4AF37] rounded-full"
            />
          </div>
        </div>
      </section>

      {/* ─── 2. QUICK TREND CHIPS BAR ─── */}
      <section className="bg-white border-b border-gray-100 py-3.5 px-4 sticky top-16 lg:top-20 z-20 shadow-sm overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 sm:gap-3 min-w-max">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1 shrink-0">
            Trending:
          </span>
          {TREND_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center text-xs font-medium bg-gray-50 hover:bg-[#022c22] hover:text-[#D4AF37] border border-gray-200 hover:border-[#022c22] text-gray-700 px-3.5 py-1.5 rounded-full transition-all shrink-0"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 3. EDITORIAL COLLECTIONS GRID ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#022c22] font-bold mb-2">
                Curated Aesthetics
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl text-emerald-950 font-bold">
                Shop By Editorial Drop
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#022c22] hover:text-[#D4AF37] transition-colors mt-4 md:mt-0"
            >
              <span>View All Collections</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {EDITORIAL_COLLECTIONS.map((col, i) => (
            <FadeInSection key={col.title} delay={i * 0.1}>
              <Link
                href={col.href}
                className="group relative block aspect-[4/5] rounded-sm overflow-hidden bg-gray-100 shadow-sm border border-gray-100"
              >
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#F3E5AB] mb-1.5">
                    {col.tagline}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2 leading-tight">
                    {col.title}
                  </h3>
                  <p className="text-white/80 text-xs line-clamp-2 mb-3 leading-relaxed">
                    {col.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                    Explore Drop <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── 4. TRENDING NOW & BESTSELLERS INTERACTIVE TABS ─── */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <p className="text-xs uppercase tracking-widest text-[#022c22] font-bold mb-2">
                What Everyone Is Wearing
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl text-emerald-950 font-bold mb-6">
                Trending Jewelry Drops
              </h2>

              {/* Tabs */}
              <div className="inline-flex p-1 bg-gray-100 rounded-full flex-wrap justify-center gap-1 max-w-full">
                {[
                  { id: 'trending', label: '🔥 Trending Now' },
                  { id: 'korean', label: '✨ The Seoul Edit' },
                  { id: 'indowestern', label: '🌸 Indo-Western' },
                  { id: 'under999', label: '⚡ Under ₹999' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-4 sm:px-5 py-2 text-xs font-semibold rounded-full transition-all',
                      activeTab === tab.id
                        ? 'bg-[#022c22] text-[#D4AF37] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeInSection>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map((product, i) => {
              const wished = isWishlisted(product.id);
              const isAdded = addedIds[product.id];

              return (
                <FadeInSection key={product.id} delay={i * 0.06}>
                  <div className="group bg-white rounded-sm overflow-hidden border border-gray-100 hover:border-[#D4AF37]/50 hover:shadow-md transition-all flex flex-col h-full relative">
                    {/* Trend Badge */}
                    {product.trendTag && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-[#022c22] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm">
                          {product.trendTag}
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-sm transition-all"
                      aria-label="Wishlist"
                    >
                      <Heart
                        size={15}
                        className={cn(wished && 'fill-red-500 text-red-500')}
                      />
                    </button>

                    {/* Image Link */}
                    <Link
                      href={`/product/${product.id}`}
                      className="relative block aspect-square bg-gray-50 overflow-hidden"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Info */}
                    <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
                        {product.category}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className="font-serif text-sm sm:text-base font-semibold text-emerald-950 hover:text-[#022c22] line-clamp-1 mb-1.5"
                      >
                        {product.name}
                      </Link>

                      {/* Variant Notice */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="text-[10px] text-emerald-800 font-medium my-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block shrink-0" />
                          <span>{product.variants.length} Options Available</span>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mt-auto pt-2">
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      {product.variants && product.variants.length > 0 ? (
                        <Link
                          href={`/product/${product.id}`}
                          className="mt-3 w-full py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5 bg-[#022c22] text-[#D4AF37] hover:bg-[#064e3b] shadow-xs"
                        >
                          <span>Select Option</span>
                          <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => handleQuickAdd(product, e)}
                          className={cn(
                            'mt-3 w-full py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5',
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 hover:bg-[#022c22] text-gray-800 hover:text-[#D4AF37]'
                          )}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={13} />
                              <span>Add to Bag</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#022c22] text-[#D4AF37] hover:bg-[#064e3b] px-8 py-3.5 text-xs uppercase tracking-widest font-bold rounded-sm shadow-sm transition-all"
            >
              <span>Explore All {FALLBACK_PRODUCTS.length}+ Trending Pieces</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. STYLE INSPIRATION LOOKBOOK ("HOW WE STYLE IT") ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block text-xs uppercase tracking-widest text-[#022c22] font-bold mb-2">
              Style Inspiration
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-emerald-950 font-bold mb-3">
              How We Style It
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              Effortless jewelry combinations inspired by Seoul streets, café dates & modern festive looks.
            </p>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STYLE_LOOKS.map((style, idx) => (
            <FadeInSection key={style.id} delay={idx * 0.1}>
              <div className="bg-white rounded-sm overflow-hidden border border-gray-100 shadow-sm flex flex-col h-full">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={style.image}
                    alt={style.look}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 text-[10px] font-mono rounded">
                    LOOK {style.id}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-serif text-lg font-bold text-emerald-950 mb-1">
                    {style.look}
                  </h3>
                  <p className="text-xs font-semibold text-[#D4AF37] mb-2">
                    ✨ Featured: {style.piece}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-auto">
                    <strong>Vibe:</strong> {style.outfit}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── 6. VALUE PROPS (GEN-Z FEATURES) ─── */}
      <section className="bg-[#022c22] text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {VALUE_PROPS.map((vp, i) => (
              <FadeInSection key={vp.title} delay={i * 0.1}>
                <div className="text-left">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                    {vp.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mb-2">
                    {vp.title}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed font-light">
                    {vp.desc}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. COMMUNITY & CUSTOMER REVIEWS ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs uppercase tracking-widest text-[#022c22] font-bold mb-2">
                Real Girls · Real Stacks
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-emerald-950 font-bold">
                Loved By Our Community
              </h2>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {REVIEWS.map((rev, i) => (
              <FadeInSection key={rev.name} delay={i * 0.12}>
                <div className="bg-[#FAF9F6] border border-gray-100 p-6 sm:p-8 rounded-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-1 text-[#D4AF37] mb-4">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} size={14} className="fill-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-6 italic font-serif">
                      &ldquo;{rev.quote}&rdquo;
                    </p>
                  </div>
                  <div className="border-t border-gray-200/70 pt-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-emerald-950">{rev.name}</h4>
                      <p className="text-xs text-gray-400">{rev.city}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-1 rounded">
                      Verified Buyer
                    </span>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. INSTAGRAM COMMUNITY CALLOUT ─── */}
      <section className="py-16 sm:py-24 px-4 bg-[#FAF9F6] border-t border-gray-100 text-center">
        <FadeInSection>
          <div className="max-w-xl mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#022c22] text-[#D4AF37] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Instagram size={26} />
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl text-emerald-950 font-bold mb-3">
              Join the #RuviaVibe on Instagram
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              Tag <strong className="text-emerald-950">@ruvia.jewels</strong> in your everyday stacks & café fits to be featured in our style spotlight.
            </p>

            <a
              href="https://www.instagram.com/ruvia.jewels?utm_source=qr&igsi=MWg1NGt2b2RqNnUycA=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#022c22] hover:bg-[#064e3b] text-[#D4AF37] font-semibold text-xs sm:text-sm uppercase tracking-widest px-8 py-4 rounded-sm shadow-md transition-all hover:scale-105"
            >
              <span>Follow @ruvia.jewels</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}
