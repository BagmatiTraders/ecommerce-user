'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  price: number;
  category: string;
  rating: number;
  images: string[];
  soldCount: number;
  brand?: string;
}

export default function TopRankingSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        // 1. Fetch order items to calculate dynamic quantities sold
        const { data: orderItems, error: oiError } = await supabase
          .from('ecommerce_order_items')
          .select('product_id, quantity');
          
        const salesMap: Record<string, number> = {};
        if (!oiError && orderItems) {
          orderItems.forEach((item: any) => {
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
          });
        }

        // 2. Fetch active storefront products (retrieve only essential fields)
        const { data: activeProds, error: pError } = await supabase
          .from('ecommerce_products')
          .select('id, display_name, slug, regular_price, special_price, images, category, rating, brand')
          .eq('status', 'active');

        if (pError) throw pError;

        if (activeProds) {
          // Map sales counts and sort products by sold quantity descending
          const rankedProducts = activeProds.map((p: any) => ({
            ...p,
            price: p.special_price || p.regular_price || 0,
            soldCount: salesMap[p.id] || 0
          })).sort((a: any, b: any) => {
            if (b.soldCount !== a.soldCount) {
              return b.soldCount - a.soldCount; // Order by quantity sold first
            }
            return b.rating - a.rating; // Tie-breaker by rating
          });

          // Limit to top 6 for the grid (showing 3 rows x 2 columns on mobile)
          setProducts(rankedProducts.slice(0, 6));
        }
      } catch (err) {
        console.error('Error calculating top ranking products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellingProducts();
  }, []);

  if (loading) {
    return (
      <section className="mt-[16px] md:mt-[44px] pt-[14px] pb-[12px] md:py-[24px] bg-[#FAFAFA] select-none animate-pulse">
        <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-[24px] p-4 md:p-[28px] border border-[#F1F5F9]">
            <div className="flex justify-between items-center mb-4 md:mb-8">
              <div className="h-6 w-32 md:h-8 md:w-64 bg-gray-100 rounded-lg"></div>
              <div className="h-4 w-16 md:h-10 md:w-28 bg-gray-100 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[18px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className={`bg-white border border-[#F1F5F9] rounded-[16px] md:rounded-[18px] w-full h-[250px] md:min-h-[385px] md:h-auto ${i === 6 ? 'lg:hidden' : ''}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-[16px] md:mt-[44px] pt-[14px] pb-[12px] md:py-[24px] bg-[#FAFAFA] select-none">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* Section Container Card */}
        <div className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-[28px] border border-[#F1F5F9] shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
          
          {/* Left Aligned Compact Header */}
          <div className="flex justify-between items-center mb-4 md:mb-8">
            <div className="flex items-center gap-1.5 md:gap-3">
              <h2 className="text-[16px] md:text-[20px] font-bold text-[#111827] flex items-center gap-1">
                <span className="text-[18px]">🏆</span> Top Ranking
              </h2>
              {/* Desktop Only Highlight Badge */}
              <span className="hidden md:inline-block bg-[#FFF3E6] text-[#FF6A00] text-[11px] font-[700] px-2.5 py-1.5 rounded-full tracking-[0.5px] uppercase">
                BEST SELLERS
              </span>
            </div>
            
            <Link 
              href="/top-selling" 
              className="text-[#FF6A00] font-[600] hover:text-[#E85D00] transition-colors hover:underline flex items-center gap-0.5 text-[13px] md:text-sm"
            >
              <span>View All</span>
              <span className="hidden md:inline">&nbsp;Top Ranking</span>
              <span>&nbsp;→</span>
            </Link>
          </div>

          {/* Grid Layout: 2 columns on mobile, gap 8px */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[18px]">
            {products.map((product, index) => {
              const rank = index + 1;

              return (
                <div key={product.id} className={index === 5 ? 'lg:hidden' : ''}>
                  <ProductCard
                    product={{
                      id: product.id,
                      display_name: product.display_name,
                      slug: product.slug,
                      regular_price: product.price, // map the base ranked price
                      images: product.images,
                      category: product.category,
                      brand: product.brand,
                      rating: product.rating,
                      soldCount: product.soldCount
                    }}
                    variant="ranked"
                    rank={rank}
                    priority={index < 2}
                  />
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
