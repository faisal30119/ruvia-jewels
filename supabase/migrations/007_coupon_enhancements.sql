-- ============================================================
-- Migration 007: Enhanced Coupon System
-- Adds: free_shipping & bogo coupon types, stacking rules,
--       product/category restrictions, toggle active, edit support
-- ============================================================

-- 1. Add new columns to coupons table
alter table coupons add column if not exists coupon_type text not null default 'flat';
-- coupon_type values: 'flat' | 'percent' | 'free_shipping' | 'bogo'
-- NOTE: discount_type already exists; coupon_type supersedes it for new coupons.
--       We keep discount_type for backward compat, sync via trigger below.

-- bogo_buy / bogo_get: product IDs for buy-one-get-one
alter table coupons add column if not exists bogo_buy_product_id bigint references products(id) on delete set null;
alter table coupons add column if not exists bogo_get_product_id bigint references products(id) on delete set null;

-- product/category restrictions (comma-separated IDs stored as text arrays)
alter table coupons add column if not exists allowed_product_ids bigint[];
alter table coupons add column if not exists allowed_category_slugs text[];

-- stacking: which group this coupon belongs to (coupons in same group cannot stack)
-- null = can stack with everyone unless a mutual_exclusive_with entry exists
alter table coupons add column if not exists stack_group text;
-- stackable: true = this coupon allows others to stack with it
alter table coupons add column if not exists stackable boolean not null default true;

-- maximum discount cap (for percent coupons)
alter table coupons add column if not exists max_discount_amount integer;

-- description / label for admin display
alter table coupons add column if not exists description text;

-- 2. Coupon stacking rules table
-- Defines explicit mutual-exclusion between specific coupon codes
create table if not exists coupon_stacking_rules (
  id bigint primary key generated always as identity,
  coupon_code_a text not null,
  coupon_code_b text not null,
  rule_type text not null default 'exclusive',
  -- rule_type: 'exclusive' = cannot be used together | 'required' = must be used together
  created_at timestamptz default now(),
  unique (coupon_code_a, coupon_code_b)
);
alter table coupon_stacking_rules enable row level security;
create policy "Admin can manage stacking rules" on coupon_stacking_rules
  for all using (auth.jwt()->>'email' = any(string_to_array(current_setting('app.admin_emails', true), ',')));

-- 3. Backfill coupon_type from existing discount_type values
update coupons set coupon_type = discount_type where discount_type in ('flat','percent','free_shipping','bogo');
update coupons set coupon_type = 'flat' where coupon_type not in ('flat','percent','free_shipping','bogo');

-- 4. Keep discount_type in sync going forward (optional convenience)
-- We'll manage this at the application layer instead of a trigger for simplicity.

-- 5. RLS for coupons (public read for active ones)
-- Policy already exists from init; ensure stackable rules are readable by service role only.
-- No customer-facing RLS needed on stacking_rules — validated server-side.

-- 6. Add index for fast stacking rule lookup
create index if not exists idx_stacking_rules_a on coupon_stacking_rules(coupon_code_a);
create index if not exists idx_stacking_rules_b on coupon_stacking_rules(coupon_code_b);
create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_active on coupons(is_active) where is_active = true;
