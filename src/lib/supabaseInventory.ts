import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_INVENTORY_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_INVENTORY_SUPABASE_ANON_KEY!;

// This client specifically talks to the Inventory/Warehouse database
export const supabaseInventory = createBrowserClient(supabaseUrl, supabaseKey);
