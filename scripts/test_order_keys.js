const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

async function test() {
    console.log('Querying one order to check keys...');
    const { data, error } = await supabase.from('ecommerce_orders').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Success! Order keys:', Object.keys(data[0]));
    } else {
        console.log('No orders found to inspect keys.');
    }
}

test();
