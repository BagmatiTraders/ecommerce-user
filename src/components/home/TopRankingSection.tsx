'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';
import Link from 'next/link';

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

        // 2. Fetch active storefront products
        const { data: activeProds, error: pError } = await supabase
          .from('ecommerce_products')
          .select('*')
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

          // Limit to top 5 for the grid
          setProducts(rankedProducts.slice(0, 5));
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-[#F1F5F9] rounded-[16px] md:rounded-[18px] w-full h-[250px] md:min-h-[385px] md:h-auto"></div>
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
                <div 
                  key={product.id} 
                  className="bg-white border border-[#F1F5F9] rounded-[16px] md:rounded-[18px] overflow-hidden transition-all duration-300 w-full h-[250px] md:min-h-[385px] md:h-auto flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_22px_rgba(0,0,0,0.06)] hover:border-[#FF6A00] group relative p-2.5 md:p-0"
                >
                  <Link href={`/products/${product.slug}`} className="block relative shrink-0">
                    
                    {/* Rank Badge: Smaller on mobile */}
                    <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 z-10 w-5 h-5 md:w-[28px] md:h-[28px] rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF6A00] text-white flex items-center justify-center font-bold text-[10px] md:text-[12px] shadow-[0_2px_6px_rgba(255,106,0,0.3)]">
                      {rank}
                    </div>

                    {/* Image Container: Max 120px height on mobile */}
                    <div className="h-[120px] md:h-[210px] bg-[#FAFAFA] rounded-xl md:rounded-none p-2 md:p-4 flex items-center justify-center relative shrink-0 overflow-hidden">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.display_name} 
                          loading="lazy"
                          className="max-w-full max-h-[100px] md:max-h-[170px] object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                        />
                      ) : (
                        <div className="text-gray-300 text-xs">No Image</div>
                      )}
                    </div>
                  </Link>

                  {/* Card Content Area */}
                  <div className="p-0 md:p-[14px] flex-1 flex flex-col justify-between mt-2 md:mt-0">
                    <div>
                      {/* Sold Info Badge */}
                      <div className="flex mb-1 shrink-0">
                        <span className="inline-flex items-center gap-1 bg-[#FFF3E6] text-[#EA580C] text-[10px] md:text-[11px] font-[600] px-[7px] py-[3px] md:px-[9px] md:py-[5px] rounded-full">
                          🔥 {product.soldCount} Sold
                        </span>
                      </div>

                      {/* Brand Name (Desktop Only to save height) */}
                      {product.brand && product.brand !== 'No Brand' && (
                        <div className="hidden md:flex flex-col gap-1.5 mt-2.5">
                          <Link 
                            href={`/brand/${product.brand.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-[700] tracking-[1px] uppercase text-[#4B5563] hover:text-[#FF6A00] transition-colors inline-block"
                          >
                            {product.brand}
                          </Link>
                          <div style={{ width: '24px', height: '2px', backgroundColor: '#E5E7EB', marginTop: '4px', marginBottom: '6px' }} />
                        </div>
                      )}

                      {/* Product Name (Max 2 lines) */}
                      <Link href={`/products/${product.slug}`}>
                        <h3 
                          className="text-[#111827] leading-[1.3] md:leading-[1.5] line-clamp-2 hover:text-[#FF6A00] transition-colors text-[13px] md:text-[15px] font-semibold"
                          style={{ 
                            minHeight: '34px',
                            maxHeight: '34px',
                            marginTop: '2px'
                          }}
                        >
                          {product.display_name}
                        </h3>
                      </Link>
                    </div>

                    {/* Price + Rating Footer */}
                    <div className="flex items-baseline justify-between w-full mt-auto pt-1.5 border-t border-gray-50 shrink-0">
                      <div className="flex items-baseline leading-none">
                        <span className="text-[11px] md:text-[13px] font-semibold text-[#6B7280] mr-0.5">Rs.</span>
                        <span className="text-[16px] md:text-[34px] font-bold md:font-[800] text-[#111827] tracking-tight leading-none">{product.price}</span>
                      </div>
                      
                      <div 
                        className="flex items-center gap-0.5 select-none bg-[#FFF7ED] text-[#F59E0B] text-[10px] md:text-[12px] font-bold px-1.5 py-0.5 rounded-full"
                      >
                        <Star size={10} fill="#F59E0B" stroke="#F59E0B" className="md:w-3 md:h-3" />
                        <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
