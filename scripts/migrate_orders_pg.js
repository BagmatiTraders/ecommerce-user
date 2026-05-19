const { Client } = require('pg');

const sql = `
-- Add columns to ecommerce_orders for voucher integration
ALTER TABLE public.ecommerce_orders 
ADD COLUMN IF NOT EXISTS applied_voucher_id UUID REFERENCES public.ecommerce_vouchers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0.00;

-- Ensure ecommerce_orders has RLS update/insert policies for guest and authenticated checkouts
DROP POLICY IF EXISTS "Allow inserts to orders for everyone" ON public.ecommerce_orders;
CREATE POLICY "Allow inserts to orders for everyone" ON public.ecommerce_orders
    FOR INSERT WITH CHECK (true);
`;

async function run() {
    // Remote direct connection string
    const remoteConnectionString = 'postgresql://postgres:postgres.shblzjrzulnrsarfxptv@db.shblzjrzulnrsarfxptv.supabase.co:5432/postgres';
    console.log('Connecting to direct remote Supabase instance...');
    const remoteClient = new Client({ 
        connectionString: remoteConnectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await remoteClient.connect();
        console.log('Connected directly to remote Supabase database! Running Migration...');
        await remoteClient.query(sql);
        console.log('Success! Columns added to remote ecommerce_orders table.');
        await remoteClient.end();
    } catch (err) {
        console.error('Remote migration failed:', err.message);
        await remoteClient.end().catch(() => {});
    }
}

run();
