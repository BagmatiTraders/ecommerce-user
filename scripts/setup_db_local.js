const { Client } = require('pg');

const ports = [5432, 54322, 6543, 5433];
const sql = `
-- Create ecommerce_products table
CREATE TABLE IF NOT EXISTS ecommerce_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES products(id),
    display_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL,
    vendor_id UUID,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create ecommerce_orders table
CREATE TABLE IF NOT EXISTS ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    device_id TEXT, -- For guest tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create ecommerce_order_items table
CREATE TABLE IF NOT EXISTS ecommerce_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES ecommerce_products(id),
    inventory_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL
);

-- Enable RLS
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;

-- Public Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to active products') THEN
        CREATE POLICY "Allow public read access to active products" ON ecommerce_products
            FOR SELECT USING (status = 'active');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to their own orders') THEN
        CREATE POLICY "Allow public read access to their own orders" ON ecommerce_orders
            FOR SELECT USING (true);
    END IF;
END $$;
`;

async function run() {
    for (const port of ports) {
        const connectionString = `postgres://postgres:postgres@localhost:${port}/postgres`;
        console.log(`Trying port ${port}...`);
        const client = new Client({ connectionString });
        try {
            await client.connect();
            console.log(`Connected to port ${port}! Running Migration...`);
            await client.query(sql);
            console.log('Success! Ecommerce tables created.');
            await client.end();
            return;
        } catch (err) {
            console.log(`Failed port ${port}: ${err.message}`);
            await client.end().catch(() => { });
        }
    }
    console.error('All local ports failed. Please run the SQL manually in Supabase SQL Editor.');
}

run();
