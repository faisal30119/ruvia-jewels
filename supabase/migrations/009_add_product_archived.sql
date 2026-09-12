-- Add is_archived flag to products for soft-hide from shop
alter table products add column if not exists is_archived boolean default false;
