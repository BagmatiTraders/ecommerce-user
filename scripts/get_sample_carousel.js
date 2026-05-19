const { createClient } = require('@supabase/supabase-js');

const url = 'https://cukcxhvfgzaayjypykny.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2N4aHZmZ3phYXlqeXB5a255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjU5NDAsImV4cCI6MjA5NDIwMTk0MH0.1LHhrXbXk5O73R4vx4NwHFeaZwkFuPFdX6HoTzFBRPY';
const supabase = createClient(url, anonKey);

async function run() {
  console.log('Fetching sample carousel...');
  const { data, error } = await supabase.from('store_carousels').select('*').limit(1);
  if (error) {
    console.error('Error fetching carousel:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Sample carousel columns:', Object.keys(data[0]));
      console.log('Sample carousel values:', data[0]);
    } else {
      console.log('No carousels found, printing columns metadata via postgrest if possible or creating a placeholder row...');
      // Let's print the error or empty
      console.log('Table is empty.');
    }
  }
}

run();
