'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, RefreshCw, ShoppingBag, Grid, Award } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/home/ProductCard';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  regular_price: number;
  special_price?: number;
  images: string[];
  category: string;
  brand?: string;
  rating?: number;
  reviews_count?: number;
  soldCount?: number;
}

export default function BrandStorePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [brandName, setBrandName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBrandProducts();
    }
  }, [slug]);

  const fetchBrandProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch order items to calculate sales metrics
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
        // Slugify match helper
        const slugify = (str: string) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const brandProducts = activeProds
          .map((p: any) => ({
            ...p,
            soldCount: salesMap[p.id] || 0
          }))
          .filter((p: any) => p.brand && p.brand !== 'No Brand' && slugify(p.brand) === slug);

        // Sort by sales popularity as default
        brandProducts.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

        setProducts(brandProducts);

        // Resolve clean capitalized brand name from products or path
        if (brandProducts.length > 0) {
          setBrandName(brandProducts[0].brand || '');
        } else {
          // Fallback guess from slug
          const guessed = (slug as string)
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setBrandName(guessed);
        }
      }
    } catch (err) {
      console.error('Error fetching brand products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Title Header Section */}
      <div className="bg-white border-b border-gray-100 pt-28 pb-12">
        <div className="container max-w-[1440px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              href="/"
              className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-200 transition-colors bg-white shrink-0 cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Back to Store</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-[700] text-gray-900 leading-none mb-2">
                  {brandName} Store
                </h1>
                <p className="text-sm font-semibold text-gray-500">
                  Discover premium products from {brandName}
                </p>
              </div>
            </div>

            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl px-5 py-3 flex items-center gap-3 shrink-0 self-start md:self-auto">
              <ShoppingBag size={18} className="text-orange-600" />
              <div>
                <div className="text-[16px] font-[800] text-gray-900 leading-none">{products.length}</div>
                <div className="text-[10px] font-[700] uppercase text-gray-400 mt-1">Available items</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-[1440px] mx-auto px-6 mt-12">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <RefreshCw className="animate-spin text-orange-500" size={36} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6">
              🔍
            </div>
            <h3 className="text-xl font-[700] text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-500 font-semibold max-w-sm mx-auto">
              There are currently no active storefront products listed under the {brandName} brand store.
            </p>
            <Link 
              href="/"
              className="mt-6 inline-flex h-[42px] px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-sm font-semibold items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-[700] text-gray-800 flex items-center gap-2">
                <Grid size={16} className="text-orange-500" />
                Featured Catalog
              </h2>
              <span className="text-xs font-semibold text-gray-400">Sorted by Popularity</span>
            </div>

            {/* 5-column Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px]">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
