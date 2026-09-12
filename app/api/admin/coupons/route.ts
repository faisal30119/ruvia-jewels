import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-helper';

// ─── Types ────────────────────────────────────────────────────────────────────
export type CouponType = 'flat' | 'percent' | 'free_shipping' | 'bogo';

// ─── GET /api/admin/coupons ───────────────────────────────────────────────────
export async function GET(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const { data: coupons, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch stacking rules
  const { data: stackingRules } = await supabaseAdmin
    .from('coupon_stacking_rules')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ coupons: coupons ?? [], stackingRules: stackingRules ?? [] });
}

// ─── POST /api/admin/coupons ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    code,
    coupon_type = 'flat',
    discount_amount,
    min_order_amount = 0,
    usage_limit,
    expires_at,
    max_discount_amount,
    stackable = true,
    stack_group,
    allowed_product_ids,
    allowed_category_slugs,
    bogo_buy_product_id,
    bogo_get_product_id,
    description,
    // stacking_rules: array of { coupon_code_b, rule_type }
    stacking_rules,
  } = body;

  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  // Validate discount_amount requirement per type
  if (['flat', 'percent'].includes(coupon_type) && (!discount_amount || Number(discount_amount) <= 0)) {
    return NextResponse.json({ error: 'discount_amount is required for flat/percent coupons' }, { status: 400 });
  }

  if (coupon_type === 'percent' && Number(discount_amount) > 100) {
    return NextResponse.json({ error: 'Percent discount cannot exceed 100' }, { status: 400 });
  }

  const insertPayload: Record<string, unknown> = {
    code: code.toUpperCase().trim(),
    coupon_type,
    discount_type: coupon_type, // keep legacy col in sync
    discount_amount: ['flat', 'percent'].includes(coupon_type) ? Math.round(Number(discount_amount)) : 0,
    min_order_amount: Number(min_order_amount ?? 0),
    usage_limit: usage_limit ? Number(usage_limit) : null,
    expires_at: expires_at || null,
    max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
    stackable: Boolean(stackable),
    stack_group: stack_group || null,
    allowed_product_ids: allowed_product_ids?.length ? allowed_product_ids : null,
    allowed_category_slugs: allowed_category_slugs?.length ? allowed_category_slugs : null,
    bogo_buy_product_id: bogo_buy_product_id || null,
    bogo_get_product_id: bogo_get_product_id || null,
    description: description || null,
    is_active: true,
  };

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert(insertPayload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert stacking rules if provided
  if (stacking_rules?.length) {
    const rules = stacking_rules.map((r: { coupon_code_b: string; rule_type?: string }) => ({
      coupon_code_a: (data as { code: string }).code,
      coupon_code_b: r.coupon_code_b.toUpperCase().trim(),
      rule_type: r.rule_type ?? 'exclusive',
    }));
    await supabaseAdmin.from('coupon_stacking_rules').insert(rules);
  }

  return NextResponse.json({ coupon: data }, { status: 201 });
}

// ─── PUT /api/admin/coupons ───────────────────────────────────────────────────
export async function PUT(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, stacking_rules, ...rest } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Normalize
  const updatePayload: Record<string, unknown> = { ...rest };
  if (rest.coupon_type) updatePayload.discount_type = rest.coupon_type; // keep legacy in sync
  if (rest.discount_amount !== undefined) updatePayload.discount_amount = Math.round(Number(rest.discount_amount));
  if (rest.min_order_amount !== undefined) updatePayload.min_order_amount = Number(rest.min_order_amount);
  if (rest.usage_limit !== undefined) updatePayload.usage_limit = rest.usage_limit ? Number(rest.usage_limit) : null;
  if (rest.max_discount_amount !== undefined) {
    updatePayload.max_discount_amount = rest.max_discount_amount ? Number(rest.max_discount_amount) : null;
  }
  if (rest.allowed_product_ids !== undefined) {
    updatePayload.allowed_product_ids = rest.allowed_product_ids?.length ? rest.allowed_product_ids : null;
  }
  if (rest.allowed_category_slugs !== undefined) {
    updatePayload.allowed_category_slugs = rest.allowed_category_slugs?.length ? rest.allowed_category_slugs : null;
  }
  if (rest.code) updatePayload.code = rest.code.toUpperCase().trim();

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update(updatePayload)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace stacking rules if provided
  if (stacking_rules !== undefined && data) {
    const couponCode = (data as { code: string }).code;
    // Delete old rules for this coupon (both directions)
    await supabaseAdmin
      .from('coupon_stacking_rules')
      .delete()
      .or(`coupon_code_a.eq.${couponCode},coupon_code_b.eq.${couponCode}`);

    if (stacking_rules.length) {
      const rules = stacking_rules.map((r: { coupon_code_b: string; rule_type?: string }) => ({
        coupon_code_a: couponCode,
        coupon_code_b: r.coupon_code_b.toUpperCase().trim(),
        rule_type: r.rule_type ?? 'exclusive',
      }));
      await supabaseAdmin.from('coupon_stacking_rules').insert(rules);
    }
  }

  return NextResponse.json({ coupon: data });
}

// ─── DELETE /api/admin/coupons ────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const { user, error: authError } = await requireAdmin(request);
  if (authError || !user) {
    return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Remove associated stacking rules first
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('code')
    .eq('id', Number(id))
    .single();

  if (coupon) {
    await supabaseAdmin
      .from('coupon_stacking_rules')
      .delete()
      .or(`coupon_code_a.eq.${(coupon as { code: string }).code},coupon_code_b.eq.${(coupon as { code: string }).code}`);
  }

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
