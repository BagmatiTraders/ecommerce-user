const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

const sql = `
-- Alter store_carousels table to add mobile_image_url column
ALTER TABLE public.store_carousels 
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
`;

async function run() {
    console.log('Running ALTER TABLE migration to add mobile_image_url to store_carousels...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration successful! mobile_image_url column added to store_carousels table.');
    }
}

run();
