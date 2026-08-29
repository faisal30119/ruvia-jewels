'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, SlidersHorizontal, X, Loader2, ShoppingBag, Check, Sparkles, Search, ChevronRight } from 'lucide-react';
import {
  FALLBACK_PRODUCTS,
  CATEGORIES,
  STYLES,
  COLORS,
  PRICE_RANGES,
  type Product,
  type ProductVariant,
} from '@/lib/data';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function discountPct(price: number, oldPrice: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
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

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [quickVariant, setQuickVariant] = useState<ProductVariant | null>(null);
  const [quickQty, setQuickQty] = useState(1);
  const [quickAdded, setQuickAdded] = useState(false);

  const searchQuery = searchParams.get('search') ?? searchParams.get('q') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedStyle = searchParams.get('style') ?? '';
  const selectedColor = searchParams.get('color') ?? '';
  const selectedPrice = searchParams.get('price') ?? '';
  const sortBy = searchParams.get('sort') ?? '';

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS))
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All' && value !== 'All Styles') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/shop?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/shop');
  }

  const filteredProducts = useCallback((): Product[] => {
    let list = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.style?.toLowerCase().includes(q) ||
          p.plating?.toLowerCase().includes(q) ||
          p.stoneColor?.toLowerCase().includes(q) ||
          p.trendTag?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      list = list.filter((p) => {
        const pCat = p.category.toLowerCase();
        if (pCat === catLower) return true;
        if (catLower.includes('american diamond') || catLower.includes('cz') || catLower.includes('ad')) {
          return pCat.includes('ad') || pCat.includes('cz') || p.stoneColor?.toLowerCase().includes('cz') || p.material?.toLowerCase().includes('cubic zirconia');
        }
        if (catLower.includes('oxidi')) {
          return pCat.includes('oxidi') || p.name.toLowerCase().includes('oxidise') || p.material?.toLowerCase().includes('oxidised');
        }
        if (catLower.includes('polki')) {
          return pCat.includes('polki') || p.name.toLowerCase().includes('polki') || p.material?.toLowerCase().includes('polki');
        }
        if (catLower.includes('kundan')) {
          return pCat.includes('kundan') || p.name.toLowerCase().includes('kundan') || p.material?.toLowerCase().includes('kundan');
        }
        if (catLower.includes('meenakari')) {
          return pCat.includes('meenakari') || p.name.toLowerCase().includes('meenakari') || p.material?.toLowerCase().includes('meenakari');
        }
        if (catLower.includes('bridal')) {
          return pCat.includes('bridal') || p.name.toLowerCase().includes('bridal');
        }
        return false;
      });
    }
    if (selectedStyle && selectedStyle !== 'All Styles') {
      list = list.filter((p) => p.style?.toLowerCase().includes(selectedStyle.toLowerCase()));
    }
    if (selectedColor && selectedColor !== 'All') {
      const colLower = selectedColor.toLowerCase();
      list = list.filter((p) => {
        const stoneLower = p.stoneColor?.toLowerCase() || '';
        const nameLower = p.name.toLowerCase();
        const descLower = p.description?.toLowerCase() || '';
        const matLower = p.material?.toLowerCase() || '';

        if (colLower === 'red') {
          return stoneLower.includes('red') || stoneLower.includes('ruby') || nameLower.includes('red') || nameLower.includes('ruby') || descLower.includes('red');
        }
        if (colLower === 'blue') {
          return stoneLower.includes('blue') || stoneLower.includes('sapphire') || nameLower.includes('blue') || descLower.includes('blue') || matLower.includes('blue');
        }
        if (colLower === 'green') {
          return stoneLower.includes('green') || stoneLower.includes('emerald') || nameLower.includes('green') || descLower.includes('green') || matLower.includes('emerald');
        }
        if (colLower === 'pink') {
          return stoneLower.includes('pink') || nameLower.includes('pink') || descLower.includes('pink');
        }
        if (colLower === 'gold') {
          return stoneLower.includes('gold') || p.plating?.toLowerCase().includes('gold') || nameLower.includes('gold');
        }
        if (colLower.includes('silver') || colLower.includes('clear')) {
          return stoneLower.includes('clear') || stoneLower.includes('white') || stoneLower.includes('silver') || p.plating?.toLowerCase().includes('silver') || matLower.includes('silver');
        }
        if (colLower === 'black') {
          return stoneLower.includes('black') || stoneLower.includes('spinel') || nameLower.includes('black');
        }

        return stoneLower.includes(colLower) || nameLower.includes(colLower);
      });
    }
    if (selectedPrice) {
      const range = PRICE_RANGES.find((r) => r.label === selectedPrice);
      if (range) list = list.filter((p) => p.price >= range.min && p.price <= range.max);
    }

    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'bestseller') list.sort((a, b) => (b.trendTag === 'BESTSELLER' ? 1 : 0) - (a.trendTag === 'BESTSELLER' ? 1 : 0));

    return list;
  }, [products, searchQuery, selectedCategory, selectedStyle, selectedColor, selectedPrice, sortBy]);

  // Lock scroll when mobile filter sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const displayed = filteredProducts();
  const hasFilters = !!(selectedCategory || selectedStyle || selectedColor || selectedPrice || sortBy);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* ─── Page header ─── */}
      <div className="bg-[#022c22] pt-16 pb-6 sm:pt-20 sm:pb-8 px-4 sm:px-6 text-center border-b border-[#D4AF37]/20">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-[#D4AF37] uppercase tracking-[0.2em] text-[9px] sm:text-[10px] font-semibold mb-1.5">
            Korean-Inspired · Indo-Western · Gen-Z
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-medium tracking-tight mb-2.5">
            The Contemporary Collection
          </h1>
          <p className="text-white/75 font-sans text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Waterproof, tarnish-free jewelry designed for daily stacking, café runs, and your main character moments.
          </p>
        </div>
      </div>

      {/* ─── Quick Category Navigation Pills (Highlighted Core Categories) ─── */}
      <div className="bg-white border-b border-gray-100 py-3.5 px-4 shadow-sm overflow-x-auto scrollbar-none sticky top-16 lg:top-20 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 min-w-max">
          <div className="flex items-center gap-1.5 mr-1 text-[11px] uppercase tracking-wider font-bold text-[#022c22]">
            <Sparkles size={14} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Categories:</span>
          </div>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat || (!selectedCategory && cat === 'All');

            return (
              <button
                key={cat}
                onClick={() => setFilter('category', cat === 'All' ? '' : cat)}
                className={cn(
                  'px-4 sm:px-4.5 py-2 text-xs rounded-full transition-all shrink-0 flex items-center gap-1.5 font-bold',
                  isSelected
                    ? 'bg-[#022c22] text-[#D4AF37] border-2 border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/25 scale-[1.02]'
                    : 'bg-[#022c22]/5 text-[#022c22] border border-[#022c22]/20 hover:border-[#D4AF37] hover:bg-[#022c22]/10 hover:text-[#022c22] shadow-sm'
                )}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {/* Mobile filter & sort bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 border border-[#022c22] px-3.5 py-2 text-xs font-sans uppercase tracking-wider text-[#022c22] bg-white rounded-sm"
            >
              <SlidersHorizontal size={14} />
              Filters {hasFilters && '•'}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="border border-gray-300 px-2.5 py-2 text-xs font-sans bg-white text-gray-900 focus:outline-none focus:border-[#022c22] rounded-sm"
            >
              <option value="">Sort: Featured</option>
              <option value="bestseller">Best Sellers</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          <p className="text-gray-500 text-xs font-sans">{displayed.length} items</p>
        </div>

        <div className="flex gap-8">
          {/* ─── Desktop Sidebar ─── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <FilterPanel
              selectedCategory={selectedCategory}
              selectedStyle={selectedStyle}
              selectedColor={selectedColor}
              selectedPrice={selectedPrice}
              sortBy={sortBy}
              setFilter={setFilter}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
              count={displayed.length}
            />
          </aside>

          {/* ─── Mobile Sidebar Drawer ─── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative bg-white w-full max-w-xs h-full overflow-y-auto p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <h3 className="font-serif text-lg text-emerald-950 font-bold">Filters</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-900"
                    aria-label="Close filters"
                  >
                    <X size={20} />
                  </button>
                </div>
                <FilterPanel
                  selectedCategory={selectedCategory}
                  selectedStyle={selectedStyle}
                  selectedColor={selectedColor}
                  selectedPrice={selectedPrice}
                  sortBy={sortBy}
                  setFilter={(k, v) => {
                    setFilter(k, v);
                  }}
                  clearFilters={() => {
                    clearFilters();
                  }}
                  hasFilters={hasFilters}
                  count={displayed.length}
                />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full mt-8 bg-[#022c22] text-[#D4AF37] font-sans text-xs uppercase tracking-widest py-3.5 font-bold rounded-sm shadow-sm"
                >
                  View Results ({displayed.length})
                </button>
              </div>
            </div>
          )}

          {/* ─── Product Grid ─── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={36} className="animate-spin text-[#D4AF37]" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-sm border border-gray-100 p-8">
                <p className="text-gray-500 font-serif text-xl mb-2">No pieces match your filters</p>
                <p className="text-xs text-gray-400 mb-4">Try clearing some filter tags to explore more styles.</p>
                <button
                  onClick={clearFilters}
                  className="inline-block bg-[#022c22] text-[#D4AF37] text-xs uppercase tracking-widest font-semibold px-6 py-2.5 rounded-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {displayed.map((product) => {
                  const wished = isWishlisted(product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      wished={wished}
                      onWishlist={() => toggleWishlist(product.id)}
                      onAddToCart={() => addToCart(product, 1)}
                      onSelectOption={() => {
                        setQuickProduct(product);
                        setQuickVariant(null);
                        setQuickQty(1);
                        setQuickAdded(false);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Quick View / Variant Selector Modal ─── */}
      {quickProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 sm:p-6 relative space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Product Summary Header */}
            <div className="flex gap-4 items-start pr-6">
              <img
                src={quickVariant?.image || quickProduct.image}
                alt={quickProduct.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-sm border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] bg-[#022c22] px-2 py-0.5 rounded-sm">
                  {quickProduct.category}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-emerald-950 mt-1 line-clamp-2">
                  {quickProduct.name}
                </h3>
                {/* Price */}
                {(() => {
                  const activePrice = quickVariant?.price !== undefined
                    ? quickVariant.price
                    : quickProduct.price + (quickVariant?.price_modifier || 0);
                  const oldP = quickProduct.oldPrice || Math.round(activePrice * 1.6);
                  return (
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif text-xl font-bold text-gray-900">
                        {formatPrice(activePrice)}
                      </span>
                      {oldP > activePrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(oldP)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ─── Variant Pills ─── */}
            {quickProduct.variants && quickProduct.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-emerald-950">
                    Select Option / Variant:
                  </span>
                  {quickVariant ? (
                    <button
                      type="button"
                      onClick={() => setQuickVariant(null)}
                      className="text-emerald-900 font-bold bg-emerald-50 border border-emerald-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      title="Click to deselect variant"
                    >
                      <span>Selected: {quickVariant.label}</span>
                      <span className="text-gray-400 font-normal ml-1">✕</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 font-normal text-[11px]">Standard / Base Piece</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {quickProduct.variants.map((v) => {
                    const isSelected = quickVariant?.label === v.label;
                    const vPrice = v.price !== undefined ? v.price : quickProduct.price + (v.price_modifier || 0);
                    const swatch = getVariantColorSwatch(v.label);

                    return (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => setQuickVariant(isSelected ? null : v)}
                        className={cn(
                          'px-3.5 py-2 text-xs font-semibold rounded-sm border-2 transition-all flex items-center gap-2 cursor-pointer',
                          isSelected
                            ? 'bg-[#022c22] text-[#D4AF37] border-[#022c22] ring-2 ring-[#D4AF37]/50 shadow-sm'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-800 hover:bg-gray-50'
                        )}
                      >
                        {v.image ? (
                          <img
                            src={v.image}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover border border-black/10 shrink-0"
                          />
                        ) : swatch ? (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ background: swatch }}
                          />
                        ) : null}

                        <span>{v.label}</span>

                        {vPrice !== quickProduct.price && (
                          <span className={cn('text-[10px]', isSelected ? 'text-[#D4AF37]' : 'text-gray-400')}>
                            {formatPrice(vPrice)}
                          </span>
                        )}

                        {isSelected && (
                          <Check size={12} className="text-[#D4AF37] ml-0.5 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-sm">
                  <button
                    onClick={() => setQuickQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">{quickQty}</span>
                  <button
                    onClick={() => setQuickQty((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addToCart(quickProduct, quickQty, quickVariant || undefined);
                    setQuickAdded(true);
                    setTimeout(() => {
                      setQuickAdded(false);
                      setQuickProduct(null);
                    }, 1200);
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest font-bold rounded-sm transition-all shadow-sm',
                    quickAdded
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#022c22] hover:bg-[#064e3b] text-[#D4AF37]'
                  )}
                >
                  {quickAdded ? (
                    <>
                      <Check size={15} />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={15} />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/product/${quickProduct.id}`}
                  onClick={() => setQuickProduct(null)}
                  className="px-4 py-3 border border-gray-300 hover:border-gray-900 text-gray-700 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center transition-colors"
                >
                  Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  selectedCategory: string;
  selectedStyle: string;
  selectedColor: string;
  selectedPrice: string;
  sortBy: string;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  count: number;
}

function FilterPanel({
  selectedCategory,
  selectedStyle,
  selectedColor,
  selectedPrice,
  sortBy,
  setFilter,
  clearFilters,
  hasFilters,
  count,
}: FilterPanelProps) {
  return (
    <div className="space-y-6 bg-white p-5 rounded-sm border border-gray-100 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <p className="font-sans text-xs uppercase tracking-wider text-gray-500 font-bold">{count} items</p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#022c22] hover:text-[#D4AF37] underline font-semibold"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-950 font-bold mb-2">
          Sort By
        </p>
        <div className="space-y-1 text-xs">
          {[
            { v: '', l: 'Featured' },
            { v: 'bestseller', l: 'Best Sellers' },
            { v: 'price_asc', l: 'Price: Low to High' },
            { v: 'price_desc', l: 'Price: High to Low' },
            { v: 'name', l: 'Name A-Z' },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilter('sort', v)}
              className={cn(
                'block w-full text-left py-1 px-2 rounded-sm transition-colors',
                sortBy === v ? 'bg-[#022c22] text-[#D4AF37] font-semibold' : 'text-gray-600 hover:text-emerald-950'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Style Filter */}
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-950 font-bold mb-2">
          Aesthetic & Style
        </p>
        <div className="space-y-1 text-xs">
          {STYLES.map((st) => (
            <button
              key={st}
              onClick={() => setFilter('style', selectedStyle === st ? '' : st)}
              className={cn(
                'block w-full text-left py-1 px-2 rounded-sm transition-colors',
                selectedStyle === st || (!selectedStyle && st === 'All Styles')
                  ? 'bg-emerald-50 text-[#022c22] font-semibold'
                  : 'text-gray-600 hover:text-emerald-950'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-950 font-bold mb-2">
          Price Range
        </p>
        <div className="space-y-1 text-xs">
          {PRICE_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setFilter('price', selectedPrice === r.label ? '' : r.label)}
              className={cn(
                'block w-full text-left py-1 px-2 rounded-sm transition-colors',
                selectedPrice === r.label
                  ? 'bg-[#022c22] text-[#D4AF37] font-semibold'
                  : 'text-gray-600 hover:text-emerald-950'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-950 font-bold mb-2">
          Color
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c.name || (!selectedColor && c.name === 'All');
            return (
              <button
                key={c.name}
                onClick={() => setFilter('color', c.name === 'All' ? '' : c.name)}
                className={cn(
                  'px-2.5 py-1.5 text-xs rounded-sm border transition-colors flex items-center gap-1.5 font-medium',
                  isSelected
                    ? 'bg-[#022c22] text-[#D4AF37] border-[#022c22]'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                )}
              >
                {!c.isAll && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                )}
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Custom Color Input when color is not in presets */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type color (e.g. Lavender, Maroon, Peach)..."
            value={COLORS.some((c) => c.name === selectedColor) ? '' : selectedColor}
            onChange={(e) => setFilter('color', e.target.value)}
            className="w-full text-xs font-sans border border-gray-200 focus:border-[#022c22] rounded-sm py-2 pl-7 pr-7 focus:outline-none bg-gray-50/50"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          {selectedColor && !COLORS.some((c) => c.name === selectedColor) && (
            <button
              onClick={() => setFilter('color', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
              title="Clear color"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  wished: boolean;
  onWishlist: () => void;
  onAddToCart: () => void;
  onSelectOption: () => void;
}

function ProductCard({ product, wished, onWishlist, onAddToCart, onSelectOption }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const discount = product.oldPrice ? discountPct(product.price, product.oldPrice) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
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
          onWishlist();
        }}
        aria-label="Toggle wishlist"
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-sm transition-all"
      >
        <Heart
          size={14}
          className={cn(wished && 'fill-red-500 text-red-500')}
        />
      </button>

      {/* Product Image Link */}
      <Link href={`/product/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <div className="absolute bottom-2 left-2 bg-[#D4AF37] text-emerald-950 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
            {discount}% OFF
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
          {product.category}
        </span>
        <Link
          href={`/product/${product.id}`}
          className="font-serif text-xs sm:text-sm font-semibold text-emerald-950 hover:text-[#022c22] line-clamp-2 mb-1.5 leading-snug"
        >
          {product.name}
        </Link>

        {/* Variant Notice */}
        {product.variants && product.variants.length > 0 && (
          <div className="text-[10px] text-emerald-800 font-medium my-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block shrink-0" />
            <span>{product.variants.length} Options (Colors/Sizes)</span>
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleAdd}
          className={cn(
            'mt-3 w-full py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs',
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 hover:bg-[#022c22] text-gray-800 hover:text-[#D4AF37]'
          )}
        >
          {added ? (
            <>
              <Check size={13} />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag size={13} />
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-[#022c22] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </React.Suspense>
  );
}
