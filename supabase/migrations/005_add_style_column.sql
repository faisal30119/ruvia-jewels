-- add style/aesthetic column to products
alter table products add column if not exists style text;
