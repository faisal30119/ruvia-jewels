import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yivivoceculwwuqigbhr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdml2b2NlY3Vsd3d1cWlnYmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzOTYxMiwiZXhwIjoyMTAwMDE1NjEyfQ.rO0N7twy9XQS5Y4paGvEOFCBYbJtZA9sk9XHxh5X3nU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data: prods } = await supabase.from('products').select('id').limit(1);
  const prodId = prods[0].id;
  const { data, error } = await supabase.from('product_variants').insert({
    product_id: prodId,
    label: 'Test Image Variant',
    price_modifier: 0,
    stock: 5,
    image: 'https://example.com/test.jpg',
  }).select();

  console.log('Insert with image column result:', { data, error });

  if (data && data[0]) {
    await supabase.from('product_variants').delete().eq('id', data[0].id);
  }
}

checkColumns();
