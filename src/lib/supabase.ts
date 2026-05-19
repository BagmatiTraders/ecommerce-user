import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Legacy export for quick compatibility, but prefer using @/utils/supabase/ patterns
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

// Note: Admin client (service role) should be handled in server actions/server components
// to avoid exposing the secret key to the browser.
