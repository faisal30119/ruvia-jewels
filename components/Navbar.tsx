'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSearch } from '@/contexts/SearchContext';
import { cn } from '@/lib/utils';
import RuviaLogo from '@/components/RuviaLogo';


const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Track Order', href: '/track' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, openAuthModal, signOut } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { openSearch } = useSearch();

  const userMenuRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener to close account menu dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close mobile menu on route change & handle body scroll lock
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navBg =
    isHome && !scrolled && !mobileOpen
      ? 'bg-transparent'
      : 'bg-[#022c22] shadow-lg';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-30 transition-all duration-300',
        navBg
      )}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Back / Forward & Logo */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            <button
              onClick={() => router.back()}
              className="p-1 sm:p-1.5 text-white/80 hover:text-[#D4AF37] hover:bg-white/10 rounded-full transition-colors shrink-0"
              title="Go Back"
              aria-label="Go Back"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => router.forward()}
              className="p-1 sm:p-1.5 text-white/80 hover:text-[#D4AF37] hover:bg-white/10 rounded-full transition-colors shrink-0"
              title="Go Forward"
              aria-label="Go Forward"
            >
              <ChevronRight size={20} />
            </button>
            <RuviaLogo variant="light" size="lg" className="ml-0.5 sm:ml-2 scale-90 xs:scale-95 sm:scale-100 origin-left shrink-0" />
          </div>


          {/* Center nav — desktop */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-semibold tracking-wider uppercase transition-colors',
                  pathname === link.href
                    ? 'text-[#D4AF37]'
                    : 'text-white/90 hover:text-[#D4AF37]'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'text-sm font-semibold tracking-wider uppercase transition-colors',
                  pathname === '/admin'
                    ? 'text-[#D4AF37]'
                    : 'text-white/90 hover:text-[#D4AF37]'
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {/* Search */}
            <button
              onClick={openSearch}
              className="p-1.5 sm:p-2 text-white/90 hover:text-[#D4AF37] transition-colors shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </button>


            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-1.5 sm:p-2 text-white/90 hover:text-[#D4AF37] transition-colors relative shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-[#022c22] text-[11px] font-extrabold w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-1.5 sm:p-2 text-white/90 hover:text-[#D4AF37] transition-colors relative shrink-0"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-[#022c22] text-[11px] font-extrabold w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </Link>


            {/* User */}
            {user ? (
              <div className="relative shrink-0 flex items-center" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="px-1.5 py-1 sm:px-2 flex items-center gap-1 sm:gap-2 text-white/90 hover:text-[#D4AF37] transition-colors"
                  aria-label="Account"
                >
                  <User className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                  <span className="text-sm font-semibold max-w-[110px] truncate hidden sm:inline-block">
                    {user.user_metadata?.full_name?.split(' ')[0] ||
                      user.user_metadata?.display_name?.split(' ')[0] ||
                      user.user_metadata?.name?.split(' ')[0] ||
                      user.email?.split('@')[0] ||
                      'Account'}
                  </span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl border border-gray-100 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {user.user_metadata?.full_name ||
                            user.user_metadata?.display_name ||
                            user.user_metadata?.name ||
                            'Account'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/profile#orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My Orders
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="p-1.5 sm:p-2 text-white/90 hover:text-[#D4AF37] transition-colors shrink-0"
                aria-label="Sign In"
              >
                <User className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-1.5 sm:p-2 text-white/90 hover:text-[#D4AF37] transition-colors ml-0.5 shrink-0"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden bg-[#022c22] border-t border-white/10"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'py-3 text-xs tracking-widest uppercase border-b border-white/10 last:border-0',
                    pathname === link.href ? 'text-[#D4AF37]' : 'text-white/80'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="py-3 text-xs tracking-widest uppercase text-[#D4AF37]"
                >
                  Admin
                </Link>
              )}
              {user ? (
                <div className="pt-2 border-t border-white/10 mt-1 flex flex-col gap-1">
                  <div className="py-2 text-xs text-white/50 truncate">
                    Signed in as <span className="text-[#D4AF37]">{user.email}</span>
                  </div>
                  <Link
                    href="/profile"
                    className="py-2.5 text-xs tracking-widest uppercase text-white/80 hover:text-[#D4AF37]"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/profile"
                    className="py-2.5 text-xs tracking-widest uppercase text-white/80 hover:text-[#D4AF37]"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="py-2.5 text-left text-xs tracking-widest uppercase text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { openAuthModal('login'); setMobileOpen(false); }}
                  className="mt-3 py-2 text-left text-xs tracking-widest uppercase text-white/70 hover:text-[#D4AF37]"
                >
                  Sign In / Register
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
