'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Tag, AlertCircle } from 'lucide-react';
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user, session, loading: authLoading, openAuthModal } = useAuth();
  const { items, cartTotal, clearCart } = useCart();

  const [subtotal, setSubtotal] = useState(cartTotal);
  const SHIPPING = subtotal >= 1999 || subtotal === 0 ? 0 : 49;
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
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

  useEffect(() => {
    setSubtotal(cartTotal);
  }, [cartTotal]);

  useEffect(() => {
    const btn = document.getElementById('pay-now-btn');
    if (!btn) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowScrollHint(false); },
      { threshold: 0.5 }
    );
    observer.observe(btn);
    return () => observer.disconnect();
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

  async function validateCoupon() {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.discount) {
        setCouponDiscount(data.discount);
        setCouponApplied(true);
      } else {
        setCouponError(data.error ?? 'Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  const total = subtotal + SHIPPING - couponDiscount;

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
                couponCode: couponApplied ? coupon : undefined,
                couponDiscount,
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

      {/* ─── Mobile scroll hint ─── */}
      {showScrollHint && (
        <div className="lg:hidden max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-md py-2.5 px-4 text-amber-700 text-xs font-sans">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'scrollBounce 1.2s ease-in-out infinite', flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span className="tracking-wide">Fill in your details, then scroll down to <strong>Pay Now</strong></span>
          </div>
          <style>{`
            @keyframes scrollBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(3px); }
            }
          `}</style>
        </div>
      )}

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

            {/* Coupon */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-[11px] sm:text-xs font-sans uppercase tracking-wider text-gray-500 mb-2">
                Coupon Code
              </p>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setCouponError('');
                    if (couponApplied) {
                      setCouponApplied(false);
                      setCouponDiscount(0);
                    }
                  }}
                  placeholder="WELCOME10"
                  className="flex-1 min-w-0 border border-gray-300 px-3 py-2 text-xs sm:text-sm font-sans focus:outline-none focus:border-emerald-950 uppercase"
                />
                <button
                  onClick={validateCoupon}
                  disabled={couponLoading || couponApplied}
                  className={cn(
                    'shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors',
                    couponApplied
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-950 text-white hover:bg-emerald-900'
                  )}
                >
                  <Tag size={12} />
                  {couponApplied ? 'Applied!' : couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="text-red-500 text-xs font-sans mt-1">{couponError}</p>
              )}
              {couponApplied && (
                <p className="text-emerald-600 text-xs font-sans mt-1">
                  Coupon applied! You save {formatPrice(couponDiscount)}.
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-xs sm:text-sm font-sans">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {SHIPPING === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  <span>₹{SHIPPING}</span>
                )}
              </div>

              {/* Free shipping threshold notice banner */}
              <div className="bg-emerald-50 border border-emerald-200/70 rounded-md p-2.5 my-2.5 text-center">
                {subtotal >= 1999 ? (
                  <p className="text-[11px] sm:text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1">
                    <span>🎉</span> <strong className="font-bold">Free Shipping Applied!</strong> (Orders above ₹1,999)
                  </p>
                ) : (
                  <div>
                    <p className="text-[11px] sm:text-xs text-emerald-950 font-semibold">
                      Add <strong className="text-emerald-700 font-bold">{formatPrice(1999 - subtotal)}</strong> more for <span className="text-emerald-700 underline font-bold">FREE Shipping</span>!
                    </p>
                    <p className="text-[10px] text-emerald-700/80 mt-0.5">Orders above ₹1,999 get free delivery across India</p>
                  </div>
                )}
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>− {formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-emerald-950 text-sm sm:text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              id="pay-now-btn"
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
