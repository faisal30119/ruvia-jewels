'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  wishlist: string[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load wishlist from local storage on mount
  useEffect(() => {
    const local = localStorage.getItem('ruvia_wishlist');
    if (local) {
      try {
        setWishlist(JSON.parse(local));
      } catch (e) {
        console.error('Error parsing wishlist from localStorage:', e);
      }
    }
  }, []);

  // Sync / Load wishlist when user login state changes
  useEffect(() => {
    if (!user) {
      // For guest users, wishlist is kept in localStorage, no reset
      return;
    }

    setLoading(true);
    // Sync local wishlist with database on login
    const local = localStorage.getItem('ruvia_wishlist');
    const localItems = local ? JSON.parse(local) : [];

    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist: localItems }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.wishlist) {
          setWishlist(data.profile.wishlist);
          localStorage.setItem('ruvia_wishlist', JSON.stringify(data.profile.wishlist));
        }
      })
      .catch((err) => console.error('Error syncing user profile wishlist:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleWishlist = useCallback(
    async (id: string) => {
      const next = wishlist.includes(id)
        ? wishlist.filter((w) => w !== id)
        : [...wishlist, id];

      // Optimistically update state and local storage
      setWishlist(next);
      localStorage.setItem('ruvia_wishlist', JSON.stringify(next));

      if (user) {
        // Sync to server via protected API route (bypasses direct client RLS constraints)
        try {
          const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wishlist: next }),
          });
          if (!res.ok) {
            console.error('Failed to sync wishlist with database');
          }
        } catch (err) {
          console.error('Error syncing wishlist with database:', err);
        }
      }
    },
    [user, wishlist]
  );

  const isWishlisted = useCallback(
    (id: string) => wishlist.includes(id),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
