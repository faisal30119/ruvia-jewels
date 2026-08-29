import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yivivoceculwwuqigbhr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdml2b2NlY3Vsd3d1cWlnYmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzOTYxMiwiZXhwIjoyMTAwMDE1NjEyfQ.rO0N7twy9XQS5Y4paGvEOFCBYbJtZA9sk9XHxh5X3nU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: prods, error: pErr } = await supabase.from('products').select('id, name, price').order('id', { ascending: false }).limit(5);
  console.log('Latest 5 Products:', prods);

  const { data: vars, error: vErr } = await supabase.from('product_variants').select('*').order('id', { ascending: false }).limit(10);
  console.log('Latest 10 Variants:', vars);
}

inspect();
