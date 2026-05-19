const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (error) console.error(error);
    else console.log('Inventory Source (products table) count:', count);

    const { count: eCount } = await supabase.from('ecommerce_products').select('*', { count: 'exact', head: true });
    console.log('Storefront (ecommerce_products table) count:', eCount);
}

check();
