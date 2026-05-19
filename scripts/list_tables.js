require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Connecting to:', supabaseUrl);
    // Simple way to check table existence is to just try selecting from it
    const tablesToCheck = ['products', 'ecommerce_products', 'conversations', 'messages', 'todos'];
    
    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.code === 'PGRST116' || error.code === 'PGRST204') {
                // Table exists but is empty
                console.log(`Table '${table}' exists but is empty.`);
            } else if (error.code === '42P01') {
                console.log(`Table '${table}' does NOT exist.`);
            } else {
                console.log(`Table '${table}' error: ${error.message} (${error.code})`);
            }
        } else {
            console.log(`Table '${table}' exists and is accessible.`);
        }
    }
}

listAllTables();
