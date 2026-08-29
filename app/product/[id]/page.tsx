'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Share2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Droplets,
  ShieldCheck,
  Truck,
  Check,
} from 'lucide-react';
import { FALLBACK_PRODUCTS, type Product, type ProductVariant } from '@/lib/data';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function getVariantColorSwatch(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('rose gold')) return 'linear-gradient(135deg, #FFD1DC, #B76E79, #E0A899)';
  if (l.includes('yellow gold') || l.includes('gold') || l.includes('18k')) return 'linear-gradient(135deg, #FFE082, #D4AF37, #B8860B)';
  if (l.includes('silver') || l.includes('rhodium')) return 'linear-gradient(135deg, #F5F5F5, #D3D3D3, #A9A9A9)';
  if (l.includes('white gold') || l.includes('clear')) return 'linear-gradient(135deg, #FFFFFF, #E9ECEF, #CED4DA)';
  if (l.includes('emerald') || l.includes('green')) return '#046307';
  if (l.includes('ruby') || l.includes('red') || l.includes('maroon')) return '#9B111E';
  if (l.includes('sapphire') || l.includes('blue')) return '#0F52BA';
  if (l.includes('pearl') || l.includes('white')) return '#FDFBF7';
  if (l.includes('black') || l.includes('noir')) return '#1A1A1A';
  if (l.includes('pink') || l.includes('rose')) return '#FFB6C1';
  if (l.includes('champagne')) return 'linear-gradient(135deg, #F7E7CE, #E5C392)';
  return null;
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200">
      <button
        className="w-full flex items-center justify-between py-4 text-left font-sans text-xs uppercase tracking-widest text-emerald-950 font-bold"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown
          size={16}
          className={cn('transition-transform text-gray-500', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailPage({ params: propParams }: { params?: { id: string } }) {
  const routerParams = useParams<{ id: string }>();
  const id = routerParams?.id || propParams?.id || '';

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error('not found');
        return r.json();
      })
      .then((data: Product) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        // fallback to local data
        const found = FALLBACK_PRODUCTS.find((p) => p.id === id);
        if (found) {
          setProduct(found);
          if (found.variants && found.variants.length > 0) {
            setSelectedVariant(found.variants[0]);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product, quantity, selectedVariant || undefined);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, quantity, selectedVariant, addToCart]);

  function shareWhatsApp() {
    const url = `https://wa.me/?text=Check+out+${encodeURIComponent(product?.name ?? '')}+at+${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  const images = React.useMemo(() => {
    if (!product) return [];
    let list: string[] = [];
    if (product.images && product.images.length > 0) {
      list = [...product.images];
    } else if ((product as any).image_urls && (product as any).image_urls.length > 0) {
      list = [...(product as any).image_urls];
    } else if (product.image) {
      if (product.image.startsWith('[') && product.image.endsWith(']')) {
        try {
          const parsed = JSON.parse(product.image);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        } catch {}
      } else if (product.image.includes(',')) {
        list = product.image.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        list = [product.image];
      }
    }

    // Include any variant images in gallery
    (product.variants || []).forEach((v) => {
      if (v.image && !list.includes(v.image)) {
        list.push(v.image);
      }
    });

    return list;
  }, [product]);

  const relatedProducts = React.useMemo(() => {
    if (!product) return [];
    return FALLBACK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[#FAF9F6]">
        <h1 className="font-serif text-3xl text-emerald-950 font-bold">Piece Not Found</h1>
        <p className="text-gray-500 font-sans text-sm text-center">
          The jewelry piece you&apos;re looking for might have sold out or was moved.
        </p>
        <Link
          href="/shop"
          className="bg-[#022c22] text-[#D4AF37] font-sans text-xs uppercase tracking-widest font-bold px-8 py-3.5 rounded-sm"
        >
          Explore All Jewelry
        </Link>
      </div>
    );
  }

  const wished = isWishlisted(product.id);
  const activePrice = selectedVariant?.price !== undefined 
    ? selectedVariant.price 
    : (product.price + (selectedVariant?.price_modifier || 0));
  const activeOldPrice = product.oldPrice || Math.round(activePrice * 1.6);
  const discount = Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100);

  const prevImage = () => {
    setActiveImg((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  };

  const nextImage = () => {
    setActiveImg((curr) => (curr === images.length - 1 ? 0 : curr + 1));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-6 sm:mb-8 overflow-x-auto py-1">
          <Link href="/" className="hover:text-emerald-950 transition-colors shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-emerald-950 transition-colors shrink-0">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-emerald-950 transition-colors shrink-0 font-medium"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold truncate shrink-0">{product.name}</span>
        </nav>

        {/* ─── MAIN PRODUCT SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white p-4 sm:p-8 rounded-sm border border-gray-100 shadow-sm">
          {/* ─── LEFT: Gallery (7 Cols) ─── */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row gap-4">
            {/* Desktop vertical thumbnails */}
            {images.length > 1 && (
              <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      'aspect-square rounded-sm overflow-hidden border-2 transition-all',
                      activeImg === i ? 'border-[#022c22] ring-1 ring-[#022c22]' : 'border-gray-200 opacity-70 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 flex flex-col">
              <div
                className="relative overflow-hidden bg-gray-50 aspect-square w-full rounded-sm group cursor-zoom-in"
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
              >
                <img
                  src={images[activeImg] || product.image}
                  alt={product.name}
                  className={cn(
                    'w-full h-full object-cover transition-transform duration-300',
                    zoomed ? 'scale-110' : 'scale-100'
                  )}
                />

                {/* Trend Badge */}
                {product.trendTag && (
                  <span className="absolute top-3 left-3 bg-[#022c22] text-[#D4AF37] text-[10px] font-sans font-bold tracking-widest uppercase px-3 py-1 rounded-sm shadow-md">
                    {product.trendTag}
                  </span>
                )}

                {/* Image Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all sm:opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all sm:opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {activeImg + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Horizontal Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex sm:hidden overflow-x-auto gap-2 mt-3 pb-1 scrollbar-none">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        'w-16 h-16 shrink-0 rounded-sm overflow-hidden border-2 transition-all',
                        activeImg === i ? 'border-[#022c22]' : 'border-gray-200 opacity-60'
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Product Details (5 Cols) ─── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#D4AF37] bg-[#022c22] px-2 py-0.5 rounded-sm">
                  {product.category}
                </span>
                {product.style && (
                  <span className="text-xs text-gray-500 font-medium">• {product.style}</span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-emerald-950 font-bold leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pb-2 border-b border-gray-100">
              <span className="font-serif text-3xl font-bold text-gray-900">
                {formatPrice(activePrice)}
              </span>
              <span className="text-gray-400 text-sm line-through">
                {formatPrice(activeOldPrice)}
              </span>
              <span className="bg-[#D4AF37] text-emerald-950 text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                {discount}% OFF
              </span>
            </div>

            {/* ─── Product Variants (Options / Sizes / Colors) ─── */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <span>Select Option / Variant:</span>
                  </span>
                  {selectedVariant ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVariant(null);
                        setActiveImg(0);
                      }}
                      className="text-emerald-900 font-bold bg-emerald-50 border border-emerald-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Click to deselect variant"
                    >
                      <span>Selected: {selectedVariant.label}</span>
                      <span className="text-gray-400 font-normal ml-1">✕</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 font-normal text-[11px]">Standard / Base Piece</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.label === v.label;
                    const vPrice = v.price !== undefined ? v.price : product.price + (v.price_modifier || 0);
                    const swatch = getVariantColorSwatch(v.label);

                    return (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedVariant(null);
                            setActiveImg(0);
                          } else {
                            setSelectedVariant(v);
                            if (v.image) {
                              const imgIdx = images.indexOf(v.image);
                              if (imgIdx !== -1) setActiveImg(imgIdx);
                            }
                          }
                        }}
                        className={cn(
                          'px-3.5 py-2 text-xs font-semibold rounded-sm border-2 transition-all flex items-center gap-2 cursor-pointer shadow-2xs',
                          isSelected
                            ? 'bg-[#022c22] text-[#D4AF37] border-[#022c22] ring-2 ring-[#D4AF37]/50 shadow-sm scale-[1.02]'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-800 hover:bg-gray-50/80'
                        )}
                      >
                        {/* Custom photo thumbnail or color swatch dot */}
                        {v.image ? (
                          <img
                            src={v.image}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover border border-black/15 shrink-0"
                          />
                        ) : swatch ? (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ background: swatch }}
                          />
                        ) : null}

                        <span>{v.label}</span>

                        {/* Price differential if different */}
                        {vPrice !== product.price && (
                          <span className={cn('text-[10px]', isSelected ? 'text-[#D4AF37]' : 'text-gray-400')}>
                            {formatPrice(vPrice)}
                          </span>
                        )}

                        {/* Active Checkmark */}
                        {isSelected && (
                          <Check size={12} className="text-[#D4AF37] ml-0.5 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {product.description}
            </p>

            {/* ✨ How to Style It Box (Gen-Z Signature Feature) */}
            {product.stylingTip && (
              <div className="bg-[#FAF9F6] border border-[#D4AF37]/40 p-4 rounded-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5">
                  <Sparkles size={14} className="text-[#D4AF37]" />
                  <span>How To Style It</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  &ldquo;{product.stylingTip}&rdquo;
                </p>
              </div>
            )}

            {/* Specs / Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-sm text-xs">
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Finish / Plating</p>
                <p className="font-semibold text-gray-900">{product.plating}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Stone Color</p>
                <p className="font-semibold text-gray-900">{product.stoneColor}</p>
              </div>
              {product.material && (
                <div className="col-span-2 pt-1 border-t border-gray-200/50">
                  <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Material & Durability</p>
                  <p className="font-semibold text-gray-800 text-[11px] leading-snug">{product.material}</p>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-sm bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 font-sans text-xs sm:text-sm uppercase tracking-widest font-bold rounded-sm transition-all shadow-md',
                  addedToCart
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#022c22] hover:bg-[#064e3b] text-[#D4AF37]'
                )}
              >
                {addedToCart ? (
                  <>
                    <Check size={16} />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Wishlist"
                className={cn(
                  'w-14 h-14 flex items-center justify-center border rounded-sm transition-colors',
                  wished ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-300 text-gray-400 hover:border-gray-900'
                )}
              >
                <Heart size={20} className={wished ? 'fill-red-500' : ''} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center text-[10px] text-gray-500">
              <div className="flex flex-col items-center gap-1">
                <Droplets size={16} className="text-[#D4AF37]" />
                <span>Anti-Tarnish</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                <span>Hypoallergenic</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={16} className="text-[#D4AF37]" />
                <span>Express Shipping</span>
              </div>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
              <Share2 size={14} />
              <span>Share:</span>
              <button onClick={shareWhatsApp} className="text-emerald-800 hover:underline font-semibold">
                WhatsApp
              </button>
              <span>•</span>
              <button onClick={copyLink} className="text-gray-600 hover:underline">
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Accordions */}
            <div className="pt-2">
              <Accordion title="Package Inclusions" defaultOpen>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                  {product.inclusions.map((inc) => (
                    <li key={inc}>{inc}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Care & Anti-Tarnish Tips">
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li>• High quality 18K PVD coating resists tarnishing and everyday sweat.</li>
                  <li>• To maintain maximum brilliance, wipe with a dry soft cloth after wear.</li>
                  <li>• Store inside the complimentary velvet pouch when travelling.</li>
                </ul>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Flat rate ₹49 shipping across India. <strong>FREE shipping on orders over ₹1,999</strong>. Orders are dispatched within 24-48 hours. Easy 7-day replacement for damaged items.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        {/* ─── COMPLETE YOUR STACK CROSS-SELL ─── */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-[#022c22] font-bold mb-1 block">
                Mix & Match
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-emerald-950 font-bold">
                Complete Your Everyday Stack
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="group bg-white rounded-sm overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.trendTag && (
                      <span className="absolute top-2 left-2 bg-[#022c22] text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {item.trendTag}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-serif text-xs sm:text-sm font-semibold text-emerald-950 group-hover:text-[#022c22] line-clamp-1 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-900 mt-auto">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
