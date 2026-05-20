const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

const sql = `
-- Alter ecommerce_products table to add video_url column
ALTER TABLE public.ecommerce_products 
ADD COLUMN IF NOT EXISTS video_url TEXT;
`;

async function run() {
    console.log('Running ALTER TABLE migration to add video_url to ecommerce_products...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration successful! video_url column added to ecommerce_products table.');
    }
}

run();
