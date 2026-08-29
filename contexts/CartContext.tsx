'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, ProductVariant } from '@/lib/data';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'almas_cart';

function getCartItemId(product: Product, variant?: ProductVariant): string {
  return variant?.label ? `${product.id}-${variant.label}` : String(product.id);
}

function getItemPrice(item: CartItem): number {
  if (item.variant?.price !== undefined) return item.variant.price;
  if (item.variant?.price_modifier !== undefined) {
    return item.product.price + item.variant.price_modifier;
  }
  return item.product.price;
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    setItems((prev) => {
      const matchId = getCartItemId(product, variant);
      const existingIdx = prev.findIndex(
        (i) => getCartItemId(i.product, i.variant) === matchId
      );

      if (existingIdx > -1) {
        return prev.map((i, idx) =>
          idx === existingIdx ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, variant }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.filter((i) => getCartItemId(i.product, i.variant) !== itemId && i.product.id !== itemId)
    );
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) =>
        prev.filter((i) => getCartItemId(i.product, i.variant) !== itemId && i.product.id !== itemId)
      );
    } else {
      setItems((prev) =>
        prev.map((i) => {
          const id = getCartItemId(i.product, i.variant);
          if (id === itemId || i.product.id === itemId) {
            return { ...i, quantity };
          }
          return i;
        })
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
