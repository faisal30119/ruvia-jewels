'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, ShoppingBag, User, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSearch } from '@/contexts/SearchContext';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { openSearch } = useSearch();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const accountLabel = user
    ? user.user_metadata?.full_name?.split(' ')[0] ||
      user.user_metadata?.display_name?.split(' ')[0] ||
      user.user_metadata?.name?.split(' ')[0] ||
      user.email?.split('@')[0] ||
      'Account'
    : 'Account';

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Shop',
      href: '/shop',
      icon: LayoutGrid,
      isActive: pathname === '/shop',
    },
    {
      label: 'Search',
      href: '#',
      onClick: openSearch,
      icon: Search,
      isActive: false,
    },
    {
      label: 'Cart',
      href: '/cart',
      icon: ShoppingBag,
      badge: cartCount,
      isActive: pathname === '/cart',
    },
    {
      label: accountLabel,
      href: user ? '/profile' : '#',
      onClick: !user ? () => openAuthModal('login') : undefined,
      icon: User,
      isActive: pathname === '/profile',
    },
  ];



  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#022c22] border-t border-[#D4AF37]/25 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center py-1 relative">
              <div className="relative">
                <Icon
                  size={20}
                  className={cn(
                    'transition-colors duration-200',
                    item.isActive
                      ? 'text-[#D4AF37] stroke-[2.3]'
                      : 'text-white stroke-[2]'
                  )}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#D4AF37] text-[#022c22] text-[9px] font-bold min-w-4 h-4 rounded-full px-1 flex items-center justify-center border border-[#022c22] shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-sans mt-1 tracking-wider uppercase transition-colors duration-200 truncate max-w-full px-0.5',
                  item.isActive ? 'text-[#D4AF37] font-semibold' : 'text-white font-medium'
                )}
              >
                {item.label}
              </span>


            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-center focus:outline-none"
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="w-full flex items-center justify-center focus:outline-none"
              aria-label={item.label}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

