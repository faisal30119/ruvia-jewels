-- Rename 'Bangles & Kadas' to 'Bangles & Bracelets' in categories table
update categories
  set name = 'Bangles & Bracelets', slug = 'bangles-bracelets'
  where slug = 'bangles-kadas';

-- Update any existing products that still carry the old category name
update products
  set category = 'Bangles & Bracelets'
  where category = 'Bangles & Kadas';
