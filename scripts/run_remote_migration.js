const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

const sql = `
-- Alter ecommerce_orders table to integrate vouchers
ALTER TABLE public.ecommerce_orders 
ADD COLUMN IF NOT EXISTS applied_voucher_id UUID REFERENCES public.ecommerce_vouchers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0.00;

-- Ensure RLS insert policy is set for everyone to allow guest and customer orders
DROP POLICY IF EXISTS "Allow inserts to orders for everyone" ON public.ecommerce_orders;
CREATE POLICY "Allow inserts to orders for everyone" ON public.ecommerce_orders
    FOR INSERT WITH CHECK (true);
`;

async function run() {
    console.log('Running ALTER TABLE migration on remote Supabase (cukcxhvfgzaayjypykny)...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Remote migration failed:', error);
    } else {
        console.log('Remote migration successful! Columns added to remote ecommerce_orders table.');
    }
}

run();
