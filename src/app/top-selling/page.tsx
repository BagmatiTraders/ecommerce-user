'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Star, Search, Award, RefreshCw, ArrowLeft } from 'lucide-react';
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

export default function TopSellingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        // 1. Fetch order items to calculate quantities sold
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
          // Map and sort all active products by sold quantity descending
          const rankedProducts = activeProds.map((p: any) => ({
            ...p,
            price: p.special_price || p.regular_price || 0,
            soldCount: salesMap[p.id] || 0
          })).sort((a: any, b: any) => {
            if (b.soldCount !== a.soldCount) {
              return b.soldCount - a.soldCount;
            }
            return b.rating - a.rating;
          });

          setProducts(rankedProducts);
        }
      } catch (err) {
        console.error('Error calculating top ranking products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellingProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <Header />
      
      {/* Title Header Section */}
      <div className="bg-white border-b border-gray-100 pt-28 pb-12">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/"
              className="w-10 h-10 rounded-full border border-gray-100 flex-center text-gray-500 hover:text-black hover:border-gray-200 transition-colors bg-white shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Back to Store</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex-center shadow-sm">
              <Award size={22} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Top Selling Products</h1>
          </div>
        </div>
      </div>

      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <RefreshCw className="animate-spin text-orange-500" size={36} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <p className="text-gray-400 font-bold uppercase tracking-wider">No Products Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product, index) => {
              const rank = index + 1;
              const isTop5 = rank <= 5;
              
              // Premium color grading for Top 5 ranks
              const rankBadgeStyles = 
                rank === 1 ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white shadow-yellow-500/20' :
                rank === 2 ? 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 text-white shadow-gray-400/20' :
                rank === 3 ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white shadow-amber-700/20' :
                rank === 4 ? 'bg-orange-500 text-white shadow-orange-500/10' :
                rank === 5 ? 'bg-orange-400 text-white shadow-orange-400/10' :
                'bg-gray-100 text-gray-400';

              return (
                <div 
                  key={product.id} 
                  className="group relative bg-white border border-gray-100/80 rounded-[2rem] overflow-hidden hover:shadow-xl hover:border-gray-200/50 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Visual Rank Indicator */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`w-8 h-8 rounded-full flex-center font-black text-xs transition-transform group-hover:scale-110 shadow-md ${rankBadgeStyles}`}>
                      {rank}
                    </div>
                    {rank === 1 && (
                      <div className="absolute inset-0 w-8 h-8 rounded-full bg-yellow-400/30 animate-ping -z-10" />
                    )}
                  </div>

                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.display_name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex-center flex-col gap-2 text-gray-300">
                          <Search size={28} strokeWidth={1.5} />
                          <span className="text-[9px] uppercase font-black tracking-widest">No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Quantity Sold badge */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-[600] uppercase tracking-widest bg-indigo-50 border border-indigo-100/40 text-indigo-600 px-2 py-0.5 rounded shadow-sm shadow-indigo-500/5 flex items-center gap-0.5">
                          🔥 {product.soldCount} Sold
                        </span>
                      </div>

                      {/* Brand Name (Clickable) */}
                      {product.brand && product.brand !== 'No Brand' && (
                        <div className="mt-1.5 flex flex-col gap-1.5">
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

                      <Link href={`/products/${product.slug}`}>
                        <h3 
                          className="text-gray-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors"
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            marginTop: product.brand && product.brand !== 'No Brand' ? '0px' : '0px'
                          }}
                        >
                          {product.display_name}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-sm text-gray-400 font-bold mr-1.5">Rs</span>
                        <span className="text-base font-black text-gray-900">{product.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg">
                        <Star size={10} fill="currentColor" />
                        {product.rating || 5.0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
