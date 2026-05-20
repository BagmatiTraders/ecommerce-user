const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres.cukcxhvfgzaayjypykny@db.cukcxhvfgzaayjypykny.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Connecting directly to database...');
    await client.connect();
    console.log('Connected! Adding video_url column to ecommerce_products table...');

    await client.query(`
      ALTER TABLE public.ecommerce_products 
      ADD COLUMN IF NOT EXISTS video_url TEXT;
    `);

    console.log('✅ Migration executed successfully! video_url column added.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
