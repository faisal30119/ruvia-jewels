'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, SlidersHorizontal, X, Loader2, ShoppingBag, Check } from 'lucide-react';
import {
  FALLBACK_PRODUCTS,
  CATEGORIES,
  STYLES,
  STONE_COLORS,
  PLATINGS,
  PRICE_RANGES,
  type Product,
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

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchQuery = searchParams.get('search') ?? searchParams.get('q') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedStyle = searchParams.get('style') ?? '';
  const selectedColor = searchParams.get('color') ?? '';
  const selectedPlating = searchParams.get('plating') ?? '';
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
      list = list.filter((p) => p.stoneColor?.toLowerCase().includes(selectedColor.toLowerCase()));
    }
    if (selectedPlating && selectedPlating !== 'All') {
      list = list.filter((p) => p.plating === selectedPlating);
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
  }, [products, searchQuery, selectedCategory, selectedStyle, selectedColor, selectedPlating, selectedPrice, sortBy]);

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
  const hasFilters = !!(selectedCategory || selectedStyle || selectedColor || selectedPlating || selectedPrice || sortBy);

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

      {/* ─── Quick Category Navigation Pills ─── */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat || (!selectedCategory && cat === 'All');
            return (
              <button
                key={cat}
                onClick={() => setFilter('category', cat === 'All' ? '' : cat)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0',
                  isSelected
                    ? 'bg-[#022c22] text-[#D4AF37] shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
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
              selectedPlating={selectedPlating}
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
                  selectedPlating={selectedPlating}
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
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterPanelProps {
  selectedCategory: string;
  selectedStyle: string;
  selectedColor: string;
  selectedPlating: string;
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
  selectedPlating,
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

      {/* Material / Plating */}
      <div>
        <p className="text-xs uppercase tracking-wider text-emerald-950 font-bold mb-2">
          Finish & Plating
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATINGS.map((pl) => (
            <button
              key={pl}
              onClick={() => setFilter('plating', selectedPlating === pl ? '' : pl)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-sm border transition-colors',
                selectedPlating === pl || (!selectedPlating && pl === 'All')
                  ? 'bg-[#022c22] text-[#D4AF37] border-[#022c22]'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              )}
            >
              {pl}
            </button>
          ))}
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
}

function ProductCard({ product, wished, onWishlist, onAddToCart }: ProductCardProps) {
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

        {/* Add to Cart Button */}
        <button
          onClick={handleAdd}
          className={cn(
            'mt-3 w-full py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5',
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
