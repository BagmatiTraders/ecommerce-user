import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'All Products | Bagmati Shop',
  description: 'Browse our collection of premium gadgets, fashion, and home essentials. Find high-quality items with fast delivery and great customer support.',
  openGraph: {
    title: 'All Products | Bagmati Shop',
    description: 'Browse our collection of premium gadgets, fashion, and home essentials. Find high-quality items with fast delivery and great customer support.',
    url: 'https://bagmati.shop/products',
    type: 'website',
  },
};

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Fetch categories
  const { data: categories } = await supabase
    .from('ecommerce_categories')
    .select('id, name')
    .order('name', { ascending: true });

  // 2. Fetch order items to calculate sales metrics
  const { data: orderItems } = await supabase
    .from('ecommerce_order_items')
    .select('product_id, quantity');

  const salesMap: Record<string, number> = {};
  if (orderItems) {
    orderItems.forEach((item: any) => {
      salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
    });
  }

  // 3. Fetch active storefront products
  const { data: activeProds } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active');

  const products = (activeProds || []).map((p: any) => ({
    ...p,
    price: p.special_price || p.regular_price || 0,
    soldCount: salesMap[p.id] || 0
  }));

  return (
    <ProductsClient 
      initialProducts={products}
      initialCategories={categories || []}
    />
  );
}
