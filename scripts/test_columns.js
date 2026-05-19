const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

async function test() {
    console.log('Testing query on ecommerce_orders table columns...');
    const { data, error } = await supabase
        .from('ecommerce_orders')
        .select('id, order_number, applied_voucher_id, discount_amount')
        .limit(1);

    if (error) {
        console.error('Column test failed:', error);
    } else {
        console.log('Column test succeeded! The columns exist on ecommerce_orders.');
        console.log('Data:', data);
    }
}

test();
