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
      <section className="mt-[44px] py-[24px] bg-[#FAFAFA] select-none animate-pulse">
        <div className="container max-w-[1440px] mx-auto px-6">
          <div className="bg-white rounded-[24px] p-[28px] border border-[#F1F5F9]">
            <div className="flex justify-between items-center mb-8">
              <div className="h-8 w-64 bg-gray-100 rounded-lg"></div>
              <div className="h-10 w-28 bg-gray-100 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[18px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-[#F1F5F9] rounded-[18px] min-h-[385px]">
                  <div className="h-[210px] bg-gray-100 rounded-t-[18px]"></div>
                  <div className="p-[14px] space-y-3">
                    <div className="h-4 w-12 bg-gray-100 rounded-full"></div>
                    <div className="h-8 w-full bg-gray-100 rounded-md"></div>
                    <div className="h-6 w-3/4 bg-gray-100 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-[44px] py-[24px] bg-[#FAFAFA] select-none">
      <div className="container max-w-[1440px] mx-auto px-6">
        
        {/* Section Container Design: background white, radius 24px, padding 28px, border 1px solid #F1F5F9 */}
        <div className="bg-white rounded-[24px] p-[28px] border border-[#F1F5F9] shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
          
          {/* Header Layout: 🏆 Top Ranking Products + Badge + View All Button */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-[24px] font-[700] text-[#111827] flex items-center gap-2">
                🏆 Top Ranking Products
              </h2>
              {/* Badge: BEST SELLERS */}
              <span className="bg-[#FFF3E6] text-[#FF6A00] text-[11px] font-[700] px-2.5 py-1.5 rounded-full tracking-[0.5px] uppercase">
                BEST SELLERS
              </span>
            </div>
            {/* View All Button */}
            <Link 
              href="/top-selling" 
              className="h-[40px] px-[18px] rounded-full bg-[#FFF3E6] text-[#FF6A00] text-[13px] font-[600] flex items-center justify-center transition-colors duration-300 hover:bg-[#FFE7CC] cursor-pointer"
            >
              View All →
            </Link>
          </div>

          {/* Grid Layout: Desktop 5 columns, gap 18px */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[18px]">
            {products.map((product, index) => {
              const rank = index + 1;

              return (
                /* 
                  Card Design: 
                  - background: #FFFFFF
                  - Better Border: border: 1px solid #F1F5F9 (reduced visibility)
                  - border-radius: 18px
                  - transition: all 0.3s ease;
                  - min-height: 385px;
                  - Hover: transform: translateY(-4px); box-shadow: 0 10px 22px rgba(0,0,0,0.06); border-color: #FF6A00;
                */
                <div 
                  key={product.id} 
                  className="bg-white border border-[#F1F5F9] rounded-[18px] overflow-hidden transition-all duration-300 min-h-[385px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_10px_22px_rgba(0,0,0,0.06)] hover:border-[#FF6A00] group relative"
                >
                  <Link href={`/products/${product.slug}`} className="block relative">
                    
                    {/* Rank Badge: 28px circle, background gradient, positioned top-left */}
                    <div className="absolute top-3 left-3 z-10 w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF6A00] text-white flex items-center justify-center font-[700] text-[12px] shadow-[0_2px_6px_rgba(255,106,0,0.3)]">
                      {rank}
                    </div>

                    {/* 
                      Product Image Container:
                      - height: 210px;
                      - display: flex; align-items: center; justify-content: center;
                      - padding: 16px;
                      - background: #FAFAFA;
                    */}
                    <div className="h-[210px] bg-[#FAFAFA] p-4 flex items-center justify-center relative shrink-0">
                      {/* Image Size Rule: max-width: 100%; max-height: 170px; object-fit: contain; */}
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.display_name} 
                          loading="lazy"
                          className="max-w-full max-h-[170px] object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-gray-300">No Image</div>
                      )}
                    </div>
                  </Link>

                  {/* Card Content Area: Padding 14px */}
                  <div className="p-[14px] flex-1 flex flex-col justify-between">
                    <div>
                      {/* 
                        Product Card Best Sold Badge:
                        - background: #FFF3E6;
                        - color: #EA580C;
                        - padding: 5px 9px;
                        - border-radius: 999px;
                        - font-size: 11px;
                        - font-weight: 600;
                      */}
                      <div className="flex mb-1">
                        <span className="inline-flex items-center gap-1 bg-[#FFF3E6] text-[#EA580C] text-[11px] font-[600] px-[9px] py-[5px] rounded-full">
                          🔥 {product.soldCount} Sold
                        </span>
                      </div>

                      {/* Brand Name (Clickable) */}
                      {product.brand && product.brand !== 'No Brand' && (
                        <div className="mt-2.5 flex flex-col gap-1.5">
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

                      {/* 
                        Product Name in Product Card:
                        - font-size: 15px; font-weight: 500; line-height: 1.5; color: #111827;
                        - min-height: 44px; for alignment
                        - margin-bottom: 14px;
                      */}
                      <Link href={`/products/${product.slug}`}>
                        <h3 
                          className="text-[#111827] leading-[1.5] line-clamp-2 hover:text-[#FF6A00] transition-colors"
                          style={{ 
                            fontSize: '15px', 
                            fontWeight: 500, 
                            minHeight: '44px',
                            marginBottom: '14px',
                            marginTop: product.brand && product.brand !== 'No Brand' ? '0px' : '10px'
                          }}
                        >
                          {product.display_name}
                        </h3>
                      </Link>
                    </div>

                    {/* Price + Review Layout: Rs 1950  ⭐ 5.0 */}
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-50">
                      
                      {/* 
                        Price Styling:
                        - Currency: font-size: 13px; font-weight: 500; color: #6B7280;
                        - Price number: font-size: 34px; font-weight: 800; line-height: 1; color: #111827;
                      */}
                      <div className="flex items-baseline leading-none">
                        <span className="text-[13px] font-[500] text-[#6B7280] mr-0.5">Rs</span>
                        <span className="text-[34px] font-[800] text-[#111827] tracking-tight leading-none">{product.price}</span>
                      </div>
                      
                      {/* 
                        Review Design:
                        - background: #FFF7ED; padding: 5px 8px; border-radius: 999px;
                        - font-size: 12px; font-weight: 600; color: #F59E0B;
                        - display: flex; align-items: center; gap: 4px;
                      */}
                      <div 
                        className="flex items-center gap-1 select-none"
                        style={{
                          background: '#FFF7ED',
                          padding: '5px 8px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#F59E0B',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
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
