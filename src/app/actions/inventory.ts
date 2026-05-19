'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_INVENTORY_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_INVENTORY_SUPABASE_ANON_KEY!;

// Server-side client for Inventory (Bypasses browser restrictions)
const supabaseInventory = createClient(supabaseUrl, supabaseKey);

export async function getWarehouseInventory() {
  try {
    const { data, error } = await supabaseInventory
      .from('products')
      .select('*')
      .limit(1000);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Server Action Fetch Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWarehouseCategory(productId: string, category: string) {
  try {
    const { error } = await supabaseInventory
      .from('products')
      .update({ website_category: category })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Update Error:', error);
    return { success: false, error: error.message };
  }
}
