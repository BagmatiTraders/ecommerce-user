const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

async function seed() {
    console.log('Seeding initial payment methods in app_settings...');
    const initialMethods = [
        {
            id: "cod",
            name: "Cash on Delivery",
            code: "cod",
            icon: "💵",
            description: "Pay with cash upon delivery of your items.",
            is_active: true
        }
    ];

    // Check if it already exists
    const { data: existing } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'payment_methods')
        .maybeSingle();

    if (existing) {
        console.log('Payment methods key already exists in app_settings:', existing.value);
        return;
    }

    const { error } = await supabase
        .from('app_settings')
        .insert({
            key: 'payment_methods',
            value: initialMethods
        });

    if (error) {
        console.error('Error seeding payment methods:', error);
    } else {
        console.log('Successfully seeded Payment Methods in app_settings table!');
    }
}

seed();
