'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { SearchProvider } from '@/contexts/SearchContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <SearchProvider>{children}</SearchProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

