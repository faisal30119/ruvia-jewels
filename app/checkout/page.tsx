'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Tag, AlertCircle, X, CheckCircle, Truck, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response?: any) => void) => void;
    };
  }
}

function formatPrice(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CouponType = 'flat' | 'percent' | 'free_shipping' | 'bogo';

interface AppliedCoupon {
  code: string;
  coupon_type: CouponType;
  label: string;
  discount_amount: number;
  free_shipping: boolean;
  bogo_product_id?: number | null;
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

const COUPON_TYPE_ICONS: Record<CouponType, React.ReactNode> = {
  flat: <Tag size={12} />,
  percent: <Tag size={12} />,
  free_shipping: <Truck size={12} />,
  bogo: <Gift size={12} />,
};

const COUPON_TYPE_COLORS: Record<CouponType, string> = {
  flat: 'bg-blue-50 text-blue-700 border-blue-200',
  percent: 'bg-purple-50 text-purple-700 border-purple-200',
  free_shipping: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bogo: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, session, loading: authLoading, openAuthModal } = useAuth();
  const { items, cartTotal, clearCart } = useCart();

  const [subtotal, setSubtotal] = useState(cartTotal);

  // ── Multi-coupon state ────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // ── Submission state ──────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showScrollHint, setShowScrollHint] = useState(true);

  const [form, setForm] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    email: user?.email ?? '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // ── Derived cart values ───────────────────────────────────────────────────────
  const totalCouponDiscount = appliedCoupons.reduce((sum, c) => sum + c.discount_amount, 0);
  const hasFreeShipping = appliedCoupons.some((c) => c.free_shipping);
  const BASE_SHIPPING = subtotal >= 1999 || subtotal === 0 ? 0 : 49;
  const SHIPPING = hasFreeShipping ? 0 : BASE_SHIPPING;
  const shippingWaived = hasFreeShipping && BASE_SHIPPING > 0;
  const total = Math.max(0, subtotal + SHIPPING - totalCouponDiscount);

  // ── Cart product IDs (for coupon product restrictions) ────────────────────────
  const cartProductIds = items
    .map((i) => (typeof i.product.id === 'number' ? i.product.id : parseInt(String(i.product.id), 10)))
    .filter((id) => !isNaN(id));

  useEffect(() => {
    setSubtotal(cartTotal);
  }, [cartTotal]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) setShowScrollHint(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? '';
      const parts = name.split(' ');
      setForm((f) => ({
        ...f,
        email: user.email ?? f.email,
        firstName: parts[0] ?? f.firstName,
        lastName: parts.slice(1).join(' ') ?? f.lastName,
      }));
    }
  }, [user]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // ── Re-validate all applied coupons when subtotal changes ─────────────────────
  const revalidateAll = useCallback(
    async (codes: string[]) => {
      if (!codes.length) return;
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes, subtotal, cart_product_ids: cartProductIds }),
        });
        const data = await res.json();
        if (data.applied_coupons) {
          setAppliedCoupons(data.applied_coupons);
        }
      } catch {
        // Silently ignore revalidation errors
      }
    },
    [subtotal, cartProductIds]
  );

  // Revalidate when subtotal changes (e.g., cart updates)
  useEffect(() => {
    const codes = appliedCoupons.map((c) => c.code);
    if (codes.length > 0) {
      revalidateAll(codes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // ── Apply a new coupon ────────────────────────────────────────────────────────
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    // Prevent duplicate
    if (appliedCoupons.some((c) => c.code === code)) {
      setCouponError(`"${code}" is already applied`);
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const allCodes = [...appliedCoupons.map((c) => c.code), code];
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: allCodes,
          subtotal,
          cart_product_ids: cartProductIds,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setCouponError(data.error ?? 'Invalid coupon code');
      } else if (data.applied_coupons?.length) {
        setAppliedCoupons(data.applied_coupons);
        setCouponInput('');
        setCouponError('');
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  }

  // ── Remove a coupon ────────────────────────────────────────────────────────────
  async function removeCoupon(code: string) {
    const remaining = appliedCoupons.filter((c) => c.code !== code).map((c) => c.code);
    if (!remaining.length) {
      setAppliedCoupons([]);
      return;
    }
    // Re-validate remaining codes together
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: remaining, subtotal, cart_product_ids: cartProductIds }),
      });
      const data = await res.json();
      if (data.applied_coupons) {
        setAppliedCoupons(data.applied_coupons);
      } else {
        setAppliedCoupons([]);
      }
    } catch {
      setAppliedCoupons((prev) => prev.filter((c) => c.code !== code));
    }
  }

  function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !session) {
      openAuthModal('login');
      return;
    }
    if (items.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      // 1. Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: total,
          userId: user.id,
          email: form.email,
          name: `${form.firstName} ${form.lastName}`,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.id) throw new Error(orderData.error ?? 'Failed to create order');

      // 2. Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load Razorpay');

      // 3. Open Razorpay widget
      const rzp = new window.Razorpay({
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency ?? 'INR',
        name: 'Ruvia Jewels',
        description: 'Korean & Indo-Western Jewelry Order',
        order_id: orderData.id,
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: '#022c22' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment signature & record order
            const verifyRes = await fetch('/api/payment/success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                email: form.email,
                name: `${form.firstName} ${form.lastName}`,
                shippingAddress: form,
                items: items.map((i) => {
                  const unitPrice = i.variant?.price !== undefined
                    ? i.variant.price
                    : (i.product.price + (i.variant?.price_modifier || 0));
                  return {
                    id: i.product.id,
                    name: i.variant?.label ? `${i.product.name} (${i.variant.label})` : i.product.name,
                    price: unitPrice,
                    variant: i.variant?.label,
                    quantity: i.quantity,
                  };
                }),
                amount: total,
                // Pass all applied coupon codes
                couponCode: appliedCoupons.length === 1 ? appliedCoupons[0].code : undefined,
                couponCodes: appliedCoupons.map((c) => c.code),
                couponDiscount: totalCouponDiscount,
                appliedCoupons,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error ?? 'Payment verification failed');
            }

            clearCart();
            router.push(`/success?orderId=${response.razorpay_order_id}`);
          } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : 'Failed to confirm payment');
            setSubmitting(false);
          }
        },
      });

      rzp.on('payment.failed', async (response: any) => {
        const errorDesc = response?.error?.description || 'Payment was unsuccessful or declined by bank.';
        await fetch('/api/payment/failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: form.email,
            amount: total,
            razorpayOrderId: orderData.id,
            error: errorDesc,
          }),
        });
        setFormError(`Payment failed: ${errorDesc}`);
        setSubmitting(false);
      });

      rzp.open();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="font-serif text-4xl text-emerald-950">Sign In to Checkout</h1>
        <p className="text-gray-500 font-sans text-sm text-center max-w-sm">
          Please sign in or create an account to complete your purchase securely.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => openAuthModal('login')}
            className="bg-emerald-950 text-white font-sans text-sm uppercase tracking-widest px-8 py-3 hover:bg-emerald-900 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="border border-emerald-950 text-emerald-950 font-sans text-sm uppercase tracking-widest px-8 py-3 hover:bg-emerald-50 transition-colors"
          >
            Create Account
          </button>
        </div>
        <Link href="/cart" className="text-gold-600 text-xs font-sans hover:underline">
          ← Back to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-emerald-950 py-10 sm:py-14 px-4 sm:px-6 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-white">Checkout</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ─── Shipping Form ─── */}
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-emerald-950 mb-4 sm:mb-6">Shipping Information</h2>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                  First Name *
                </label>
                <input
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                  Last Name *
                </label>
                <input
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleFormChange}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                Phone *
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleFormChange}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                Address *
              </label>
              <input
                name="address"
                required
                value={form.address}
                onChange={handleFormChange}
                className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                  City *
                </label>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                  State *
                </label>
                <input
                  name="state"
                  required
                  value={form.state}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-1">
                  Postal Code / PIN *
                </label>
                <input
                  name="postalCode"
                  required
                  value={form.postalCode}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-emerald-950"
                  placeholder="e.g. 400001"
                />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3 text-red-600 text-xs sm:text-sm font-sans">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </form>
        </div>

        {/* ─── Mobile scroll hint ─── */}
        {showScrollHint && (
          <div className="lg:hidden flex flex-col items-center gap-1 py-2 text-gray-400 text-xs font-sans select-none pointer-events-none">
            <span className="tracking-wide uppercase text-[10px]">Scroll down for Pay Now</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'bounce 1.2s infinite' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(5px); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* ─── Order Summary ─── */}
        <div>
          <h2 className="font-serif text-xl sm:text-2xl text-emerald-950 mb-4 sm:mb-6">Order Summary</h2>
          <div className="bg-gray-50 border border-gray-100 p-4 sm:p-6 space-y-4">
            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map(({ product, quantity, variant }) => {
                const itemId = variant?.label ? `${product.id}-${variant.label}` : String(product.id);
                const unitPrice = variant?.price !== undefined
                  ? variant.price
                  : (product.price + (variant?.price_modifier || 0));

                return (
                  <div key={itemId} className="flex gap-3 items-center">
                    <img
                      src={variant?.image || product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover flex-shrink-0 rounded-sm border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-xs text-emerald-950 line-clamp-1">{product.name}</p>
                      {variant && (
                        <p className="text-[10px] text-emerald-800 font-medium font-sans">
                          Option: {variant.label}
                        </p>
                      )}
                      <p className="text-gray-400 text-[11px] sm:text-xs font-sans">Qty: {quantity}</p>
                    </div>
                    <p className="text-xs sm:text-sm font-sans font-bold text-emerald-950 shrink-0">
                      {formatPrice(unitPrice * quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ─── Coupon Section ─── */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-2">
                Coupon Codes
              </p>

              {/* Input row */}
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                  placeholder="Enter coupon code"
                  className="flex-1 min-w-0 border border-gray-300 px-3 py-2 text-xs sm:text-sm font-sans focus:outline-none focus:border-emerald-950 uppercase"
                  disabled={couponLoading}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className={cn(
                    'shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors',
                    'bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Tag size={12} />
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>

              {/* Error */}
              {couponError && (
                <div className="flex items-start gap-1.5 mt-2 text-red-500 text-xs font-sans">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Applied coupons list */}
              {appliedCoupons.length > 0 && (
                <div className="mt-3 space-y-2">
                  {appliedCoupons.map((c) => (
                    <div
                      key={c.code}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 border text-xs font-sans',
                        COUPON_TYPE_COLORS[c.coupon_type] ?? 'bg-gray-50 border-gray-200 text-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{COUPON_TYPE_ICONS[c.coupon_type]}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold">{c.code}</span>
                            <CheckCircle size={11} />
                          </div>
                          <p className="text-[10px] opacity-75 mt-0.5">{c.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.free_shipping ? (
                          <span className="font-bold text-[11px]">FREE Shipping</span>
                        ) : c.discount_amount > 0 ? (
                          <span className="font-bold">− {formatPrice(c.discount_amount)}</span>
                        ) : (
                          <span className="font-bold text-[11px]">Applied</span>
                        )}
                        <button
                          onClick={() => removeCoupon(c.code)}
                          className="opacity-60 hover:opacity-100 transition-opacity ml-1"
                          title={`Remove ${c.code}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total savings callout */}
              {(totalCouponDiscount > 0 || hasFreeShipping) && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-sans">
                  <span className="font-semibold">
                    🎉 You&apos;re saving{' '}
                    {totalCouponDiscount > 0 ? formatPrice(totalCouponDiscount) : ''}
                    {totalCouponDiscount > 0 && hasFreeShipping ? ' + ' : ''}
                    {hasFreeShipping ? 'Free Shipping' : ''}
                    !
                  </span>
                </div>
              )}
            </div>

            {/* ─── Totals ─── */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-xs sm:text-sm font-sans">
              {/* Subtotal */}
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {SHIPPING === 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    FREE
                    {shippingWaived && <span className="ml-1 text-[10px] line-through text-gray-400">₹{BASE_SHIPPING}</span>}
                  </span>
                ) : (
                  <span>₹{SHIPPING}</span>
                )}
              </div>

              {/* Free shipping threshold notice */}
              {!hasFreeShipping && (
                <div className="bg-emerald-50 border border-emerald-200/70 rounded-md p-2.5 my-2.5 text-center">
                  {subtotal >= 1999 ? (
                    <p className="text-[11px] sm:text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1">
                      <span>🎉</span> <strong className="font-bold">Free Shipping Applied!</strong> (Orders above ₹1,999)
                    </p>
                  ) : (
                    <div>
                      <p className="text-[11px] sm:text-xs text-emerald-950 font-semibold">
                        Add <strong className="text-emerald-700 font-bold">{formatPrice(1999 - subtotal)}</strong> more for{' '}
                        <span className="text-emerald-700 underline font-bold">FREE Shipping</span>!
                      </p>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5">Orders above ₹1,999 get free delivery across India</p>
                    </div>
                  )}
                </div>
              )}

              {/* Per-coupon discount breakdown */}
              {appliedCoupons.filter((c) => c.discount_amount > 0).map((c) => (
                <div key={c.code} className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    <span className="font-mono text-[11px]">{c.code}</span>
                    <span className="text-gray-400 text-[11px]">({c.label})</span>
                  </span>
                  <span className="font-semibold">− {formatPrice(c.discount_amount)}</span>
                </div>
              ))}

              {/* Total savings summary row */}
              {totalCouponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold text-xs border-t border-dashed border-emerald-200 pt-2 mt-1">
                  <span>Total Savings</span>
                  <span>− {formatPrice(totalCouponDiscount)}</span>
                </div>
              )}

              {/* Final total */}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-emerald-950 text-sm sm:text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {hasFreeShipping && shippingWaived && (
                <p className="text-emerald-600 text-[11px] text-right">+ Free shipping via coupon</p>
              )}
            </div>

            <button
              form="checkout-form"
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-emerald-950 font-sans font-bold uppercase tracking-widest text-xs sm:text-sm py-3.5 sm:py-4 transition-colors',
                submitting && 'opacity-70 cursor-not-allowed'
              )}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
