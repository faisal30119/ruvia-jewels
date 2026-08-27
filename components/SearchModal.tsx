'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { FALLBACK_PRODUCTS, type Product } from '@/lib/data';

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const POPULAR_TAGS = [
  'Bridal Sets',
  'Kundan',
  'Polki',
  'Necklaces',
  'Earrings',
  'Rose Gold',
  'Pendants',
];

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Load products on mount
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts(FALLBACK_PRODUCTS);
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS));
  }, []);

  // Auto-focus input when modal opens & lock body scroll
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const results = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.plating?.toLowerCase().includes(q) ||
          p.stoneColor?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      })
    : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  }

  function handleTagClick(tag: string) {
    setQuery(tag);
    inputRef.current?.focus();
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-[#022c22]/80 backdrop-blur-md"
          />

          {/* Search Box & Content Container */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-8 pb-8"
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Search Bar Input */}
              <form onSubmit={handleSubmit} className="relative flex items-center border-b border-gray-100 px-4 py-3 sm:py-4">
                <Search size={22} className="text-[#022c22] shrink-0 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bridal sets, Kundan, Polki, necklaces, earrings..."
                  className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base font-sans focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors mr-2"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </form>

              {/* Popular Tags */}
              {!query && (
                <div className="p-6 bg-gray-50/50">
                  <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} /> Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:border-[#022c22] hover:text-[#022c22] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Results */}
              {query.trim() !== '' && (
                <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-gray-100">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      Found {results.length} product{results.length === 1 ? '' : 's'}
                    </p>
                    {results.length > 0 && (
                      <button
                        onClick={handleSubmit}
                        className="text-xs text-[#022c22] font-semibold hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                      >
                        View all in Shop <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                  {results.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      No jewelry matching &quot;{query}&quot; found. Try searching for Kundan, Polki, or Bridal sets.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {results.slice(0, 6).map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={closeSearch}
                          className="flex items-center gap-3.5 p-2.5 rounded-lg border border-gray-100 hover:border-[#D4AF37]/50 hover:bg-gray-50 transition-all group"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded shrink-0 border border-gray-100 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#022c22]">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                              {product.category} {product.plating ? `· ${product.plating}` : ''}
                            </p>
                            <p className="text-xs font-bold text-[#022c22] mt-1">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
