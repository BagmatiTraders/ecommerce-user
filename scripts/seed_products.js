const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sampleProducts = [
  {
    display_name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'Experience studio-quality sound with active noise cancellation and 40-hour battery life.',
    price: 299.99,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.9,
    reviews_count: 128
  },
  {
    display_name: 'Minimalist Wall Clock',
    slug: 'minimalist-wall-clock',
    description: 'A timeless piece for your modern home. Silent movement and sleek matte finish.',
    price: 45.00,
    category: 'Home & Kitchen',
    images: ['https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.5,
    reviews_count: 85
  },
  {
    display_name: 'Performance Running Shoes',
    slug: 'performance-running-shoes',
    description: 'Lightweight, breathable, and designed for maximum speed and comfort.',
    price: 120.00,
    category: 'Sports',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.8,
    reviews_count: 240
  },
  {
    display_name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-tshirt',
    description: 'Soft, sustainable, and perfectly fitted for everyday wear.',
    price: 25.99,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.7,
    reviews_count: 320
  },
  {
    display_name: 'Professional Chef Knife',
    slug: 'professional-chef-knife',
    description: 'High-carbon stainless steel blade with ergonomic handle for precision cutting.',
    price: 89.00,
    category: 'Home & Kitchen',
    images: ['https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.9,
    reviews_count: 56
  },
  {
    display_name: 'Hydrating Face Serum',
    slug: 'hydrating-face-serum',
    description: 'Enriched with hyaluronic acid for a natural, healthy glow.',
    price: 34.50,
    category: 'Beauty & Care',
    images: ['https://images.unsplash.com/photo-1570172619380-4106bdf8596c?q=80&w=1000&auto=format&fit=crop'],
    status: 'active',
    rating: 4.6,
    reviews_count: 92
  }
];

async function seed() {
  console.log('Seeding products...');
  for (const product of sampleProducts) {
    const { error } = await supabase.from('ecommerce_products').upsert(product, { onConflict: 'slug' });
    if (error) console.error(`Error seeding ${product.display_name}:`, error.message);
    else console.log(`Seeded: ${product.display_name}`);
  }
  console.log('Seeding complete!');
}

seed();
