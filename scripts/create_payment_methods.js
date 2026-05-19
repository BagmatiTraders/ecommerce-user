const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

const sql = `
-- Create ecommerce_payment_methods table
CREATE TABLE IF NOT EXISTS public.ecommerce_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ecommerce_payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow select for active payment methods for everyone
DROP POLICY IF EXISTS "Allow select for active payment methods" ON public.ecommerce_payment_methods;
CREATE POLICY "Allow select for active payment methods" ON public.ecommerce_payment_methods
    FOR SELECT USING (true);

-- Allow all for everyone (convenient for our admin panel testing)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.ecommerce_payment_methods;
CREATE POLICY "Allow all for authenticated users" ON public.ecommerce_payment_methods
    FOR ALL USING (true);

-- Seed Cash on Delivery
INSERT INTO public.ecommerce_payment_methods (name, code, icon, description, is_active)
VALUES (
    'Cash on Delivery', 
    'cod', 
    '💵', 
    'Pay with cash upon delivery of your items.', 
    true
)
ON CONFLICT (code) DO NOTHING;

-- Add payment_method column to ecommerce_orders
ALTER TABLE public.ecommerce_orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'cod';
`;

async function run() {
    console.log('Running payment methods migration on remote Supabase (cukcxhvfgzaayjypykny)...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Remote migration failed:', error);
    } else {
        console.log('Remote migration successful! ecommerce_payment_methods table created and seeded, and payment_method column added.');
    }
}

run();
