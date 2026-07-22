import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Header from '@/components/layout/Header';
import Carousel from '@/components/home/Carousel';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import TopRankingSection from '@/components/home/TopRankingSection';
import ViewAllProductsSection from '@/components/home/ViewAllProductsSection';

export const revalidate = 60; // Revalidate static cache every 60 seconds for ultra-fast TTFB

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const nowMs = Date.now();
  const twoHoursLater = new Date(nowMs + 2 * 60 * 60 * 1000).toISOString();
  const now = new Date(nowMs).toISOString();

  // Parallel server-side data fetching
  const [carouselsRes, categoriesRes, flashSalesRes, topProductsRes] = await Promise.all([
    supabase
      .from('store_carousels')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('ecommerce_categories')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('store_flash_sales')
      .select(`
        id, flash_price, total_stock, sold_qty, start_time, end_time,
        product:ecommerce_products!inner(id, display_name, slug, regular_price, images, category, brand)
      `)
      .eq('is_active', true)
      .lt('start_time', twoHoursLater)
      .gt('end_time', now)
      .limit(6),
    supabase
      .from('ecommerce_products')
      .select('id, display_name, slug, regular_price, special_price, images, category, rating, reviews_count, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(60)
  ]);

  const carousels = carouselsRes.data || [];
  const categories = (categoriesRes.data || []).filter((cat: any) => !cat.parent_id);
  const flashSales = (flashSalesRes.data || []).filter((sale: any) => sale.sold_qty < sale.total_stock);
  const topProducts = topProductsRes.data || [];

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <h1 className="sr-only">Bagmati Shop | Online Shopping at Best Price in Nepal</h1>
      <Header />
      <div className="px-6 max-w-[1440px] mx-auto">
        <Carousel initialImages={carousels} />
      </div>
      
      <FlashSaleSection initialFlashSales={flashSales} />
      <CategoriesSection initialCategories={categories} />
      <TopRankingSection initialProducts={topProducts.slice(0, 12)} />
      
      <ViewAllProductsSection initialProducts={topProducts} />
    </main>
  );
}
