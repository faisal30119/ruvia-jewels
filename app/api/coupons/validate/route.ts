import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type CouponType = 'flat' | 'percent' | 'free_shipping' | 'bogo';

export interface CouponRecord {
  id: number;
  code: string;
  coupon_type: CouponType;
  discount_type: string; // legacy column
  discount_amount: number;
  min_order_amount: number;
  usage_count: number;
  usage_limit: number | null;
  expires_at: string | null;
  is_active: boolean;
  stackable: boolean;
  stack_group: string | null;
  max_discount_amount: number | null;
  allowed_product_ids: number[] | null;
  allowed_category_slugs: string[] | null;
  bogo_buy_product_id: number | null;
  bogo_get_product_id: number | null;
  description: string | null;
}

export interface AppliedCouponResult {
  code: string;
  coupon_type: CouponType;
  label: string;          // human-readable description
  discount_amount: number; // actual ₹ savings (0 for free_shipping)
  free_shipping: boolean;
  bogo_product_id?: number | null;
  bogo_product_name?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coupons/validate
// Body: { codes: string[], subtotal: number, cart_product_ids?: number[] }
// Validates multiple coupons, checks stacking rules, and returns per-coupon
// discount breakdown plus total savings.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const {
    codes,
    subtotal,
    cart_product_ids = [],
  }: { codes: string[]; subtotal: number; cart_product_ids?: number[] } = body;

  // Support single code (legacy) as well as array
  const rawCodes: string[] = Array.isArray(codes)
    ? codes
    : body.code
    ? [body.code]
    : [];

  if (!rawCodes.length) {
    return NextResponse.json({ error: 'At least one coupon code is required' }, { status: 400 });
  }

  if (typeof subtotal !== 'number' || subtotal < 0) {
    return NextResponse.json({ error: 'subtotal must be a non-negative number' }, { status: 400 });
  }

  const normalizedCodes = rawCodes.map((c) => c.toUpperCase().trim());

  // ── 1. Fetch all requested coupons ──────────────────────────────────────────
  const { data: couponsData, error: fetchError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .in('code', normalizedCodes)
    .eq('is_active', true);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }

  const coupons: CouponRecord[] = (couponsData ?? []) as CouponRecord[];

  // Check all codes resolved
  const foundCodes = new Set(coupons.map((c) => c.code));
  const missingCode = normalizedCodes.find((c) => !foundCodes.has(c));
  if (missingCode) {
    return NextResponse.json({
      error: `"${missingCode}" is not a valid or active coupon code`,
    }, { status: 404 });
  }

  // ── 2. Validate each coupon individually ────────────────────────────────────
  const now = new Date();
  const results: AppliedCouponResult[] = [];
  let totalDiscount = 0;
  let freeShipping = false;
  let bogoProductId: number | null = null;

  for (const coupon of coupons) {
    // Normalize type (handle legacy rows that only have discount_type)
    const couponType: CouponType =
      (coupon.coupon_type as CouponType) ||
      (coupon.discount_type === 'percent' ? 'percent' : 'flat');

    // Expiry check
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({
        error: `Coupon "${coupon.code}" has expired`,
      }, { status: 422 });
    }

    // Usage limit check
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({
        error: `Coupon "${coupon.code}" has reached its usage limit`,
      }, { status: 422 });
    }

    // Minimum order check
    if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount) {
      return NextResponse.json({
        error: `Coupon "${coupon.code}" requires a minimum order of ₹${coupon.min_order_amount.toLocaleString('en-IN')}`,
      }, { status: 422 });
    }

    // Product restriction check
    if (coupon.allowed_product_ids?.length) {
      const hasEligibleProduct = cart_product_ids.some((id) =>
        coupon.allowed_product_ids!.includes(id)
      );
      if (!hasEligibleProduct) {
        return NextResponse.json({
          error: `Coupon "${coupon.code}" is not applicable to the items in your cart`,
        }, { status: 422 });
      }
    }

    // ── Compute discount ─────────────────────────────────────────────────────
    let couponDiscount = 0;
    let label = '';

    if (couponType === 'flat') {
      couponDiscount = Math.min(coupon.discount_amount, subtotal);
      label = `₹${coupon.discount_amount.toLocaleString('en-IN')} OFF`;
    } else if (couponType === 'percent') {
      const raw = Math.round((subtotal * coupon.discount_amount) / 100);
      couponDiscount = coupon.max_discount_amount
        ? Math.min(raw, coupon.max_discount_amount)
        : raw;
      label = coupon.max_discount_amount
        ? `${coupon.discount_amount}% OFF (up to ₹${coupon.max_discount_amount.toLocaleString('en-IN')})`
        : `${coupon.discount_amount}% OFF`;
    } else if (couponType === 'free_shipping') {
      freeShipping = true;
      couponDiscount = 0;
      label = 'Free Shipping';
    } else if (couponType === 'bogo') {
      // BOGO: find cheapest eligible item in cart and discount it
      // We surface the product ID to the frontend for display; actual price
      // calculation happens when frontend knows the cart items
      freeShipping = false;
      couponDiscount = 0; // will be resolved client-side with cart data
      bogoProductId = coupon.bogo_get_product_id;
      label = 'Buy One Get One Free';
    }

    results.push({
      code: coupon.code,
      coupon_type: couponType,
      label,
      discount_amount: couponDiscount,
      free_shipping: couponType === 'free_shipping',
      bogo_product_id: couponType === 'bogo' ? bogoProductId : undefined,
    });

    totalDiscount += couponDiscount;
  }

  // ── 3. Stacking rules check ──────────────────────────────────────────────────
  if (normalizedCodes.length > 1) {
    // Check stackable flags
    const nonStackable = coupons.find((c) => !c.stackable);
    if (nonStackable) {
      return NextResponse.json({
        error: `Coupon "${nonStackable.code}" cannot be combined with other coupons`,
      }, { status: 422 });
    }

    // Check stack groups (coupons in the same non-null group are mutually exclusive)
    const groupMap = new Map<string, string>();
    for (const c of coupons) {
      if (c.stack_group) {
        if (groupMap.has(c.stack_group)) {
          return NextResponse.json({
            error: `Coupons "${groupMap.get(c.stack_group)}" and "${c.code}" cannot be combined (same group)`,
          }, { status: 422 });
        }
        groupMap.set(c.stack_group, c.code);
      }
    }

    // Check explicit stacking rules
    const { data: rules } = await supabaseAdmin
      .from('coupon_stacking_rules')
      .select('*')
      .eq('rule_type', 'exclusive')
      .or(
        normalizedCodes
          .map((c) => `coupon_code_a.eq.${c},coupon_code_b.eq.${c}`)
          .join(',')
      );

    if (rules?.length) {
      for (const rule of rules) {
        const aInCart = normalizedCodes.includes(rule.coupon_code_a);
        const bInCart = normalizedCodes.includes(rule.coupon_code_b);
        if (aInCart && bInCart) {
          return NextResponse.json({
            error: `Coupons "${rule.coupon_code_a}" and "${rule.coupon_code_b}" cannot be used together`,
          }, { status: 422 });
        }
      }
    }
  }

  // ── 4. Return breakdown ──────────────────────────────────────────────────────
  // Legacy single-coupon compatibility: still return `discount` field
  const legacySingleDiscount = results[0]?.discount_amount ?? 0;

  return NextResponse.json({
    // Legacy field (single coupon)
    discount: legacySingleDiscount,
    code: results[0]?.code,
    // New multi-coupon fields
    applied_coupons: results,
    total_discount: totalDiscount,
    free_shipping: freeShipping,
    bogo_product_id: bogoProductId,
  });
}
