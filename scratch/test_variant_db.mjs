import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yivivoceculwwuqigbhr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdml2b2NlY3Vsd3d1cWlnYmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzOTYxMiwiZXhwIjoyMTAwMDE1NjEyfQ.rO0N7twy9XQS5Y4paGvEOFCBYbJtZA9sk9XHxh5X3nU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testVariantOperations() {
  const { data: prods } = await supabase.from('products').select('id, name').limit(1);
  if (!prods || prods.length === 0) {
    console.log('No products found to test variants on.');
    return;
  }
  const prodId = prods[0].id;
  console.log('Testing variant insertion for product:', prodId, prods[0].name);

  const { data: inserted, error: insErr } = await supabase
    .from('product_variants')
    .insert([
      { product_id: prodId, label: 'Emerald Green', price_modifier: 0, stock: 15 },
      { product_id: prodId, label: 'Ruby Red', price_modifier: 200, stock: 8 },
    ])
    .select();

  console.log('Inserted variants:', { inserted, insErr });

  const { data: fetched, error: fetchErr } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', prodId);

  console.log('Fetched variants:', { fetched, fetchErr });

  // Clean up test variants
  if (inserted && inserted.length > 0) {
    const ids = inserted.map((v) => v.id);
    await supabase.from('product_variants').delete().in('id', ids);
    console.log('Cleaned up test variants successfully.');
  }
}

testVariantOperations();
