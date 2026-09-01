-- Add material_type column to products (craft/material classification separate from category)
alter table products add column if not exists material_type text;

-- Update categories table to the new type-based list
-- First remove old material-based categories that are now handled by material_type
delete from categories where slug in (
  'oxidise-jewelry',
  'american-diamond-cz',
  'polki-jewelry',
  'kundan-jewelry',
  'meenakari-jewelry'
);

-- Rename existing categories to new names where needed
update categories set name = 'Necklaces & Chokers', slug = 'necklaces-chokers' where slug = 'necklaces';
update categories set name = 'Pendants & Charms',  slug = 'pendants-charms'   where slug = 'pendants';

-- Insert new type-based categories that don't exist yet
insert into categories (name, slug, sort_order) values
  ('Bangles & Kadas', 'bangles-kadas',   5),
  ('Rings',           'rings',           6),
  ('Nose Rings (Nath)', 'nose-rings-nath', 7),
  ('Maang Tikka',     'maang-tikka',     8)
on conflict (slug) do nothing;

-- Fix sort order for existing ones
update categories set sort_order = 1 where slug = 'bridal-sets';
update categories set sort_order = 2 where slug = 'necklaces-chokers';
update categories set sort_order = 3 where slug = 'earrings';
update categories set sort_order = 4 where slug = 'pendants-charms';
