'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, TrendingUp, Search, RefreshCw } from 'lucide-react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  regular_price: number;
  special_price?: number;
  images: string[];
  category: string;
  rating?: number;
  reviews_count?: number;
  soldCount?: number;
  created_at: string;
}

const shuffleArray = (array: any[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface ViewAllProductsSectionProps {
  initialProducts?: any[];
}

export default function ViewAllProductsSection({ initialProducts = [] }: ViewAllProductsSectionProps) {
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [allStoreProducts, setAllStoreProducts] = useState<any[]>(initialProducts);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Rows state
  const [row1, setRow1] = useState<Product[]>([]);
  const [row2, setRow2] = useState<Product[]>([]);
  const [row3, setRow3] = useState<Product[]>([]);
  
  // Load More pool
  const [loadMorePool, setLoadMorePool] = useState<Product[]>([]);
  const [extraRows, setExtraRows] = useState<Product[]>([]);
  const [shownSet, setShownSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(searches);
    }
  }, []);

  useEffect(() => {
    const fetchAndOrganize = async () => {
      try {
        // 1. Fetch active storefront products (limited to 60 with essential fields)
        const { data: activeProds, error: pError } = await supabase
          .from('ecommerce_products')
          .select('id, display_name, slug, regular_price, special_price, images, category, rating, reviews_count, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(60);

        if (pError) throw pError;

        const salesMap: Record<string, number> = {};
        if (activeProds && activeProds.length > 0) {
          const productIds = activeProds.map((p: any) => p.id);
          // 2. Fetch order items only for retrieved products
          const { data: orderItems, error: oiError } = await supabase
            .from('ecommerce_order_items')
            .select('product_id, quantity')
            .in('product_id', productIds);
            
          if (!oiError && orderItems) {
            orderItems.forEach((item: any) => {
              salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
            });
          }
        }

        if (activeProds) {
          const prods = activeProds.map((p: any) => ({
            ...p,
            price: p.special_price || p.regular_price || 0,
            soldCount: salesMap[p.id] || 0
          }));

          // ROW 1: Search/Interest category related products
          let row1Products: Product[] = [];
          if (recentSearches.length > 0) {
            // Find categories matching any recent search keyword
            const matchingCategories = Array.from(new Set(
              prods.filter(p => 
                recentSearches.some(s => 
                  p.display_name.toLowerCase().includes(s.toLowerCase()) || 
                  p.category.toLowerCase().includes(s.toLowerCase())
                )
              ).map(p => p.category)
            ));

            if (matchingCategories.length > 0) {
              row1Products = prods.filter(p => matchingCategories.includes(p.category));
            }
          }

          // Fallback if no recent searches: Randomize popular categories
          if (row1Products.length === 0) {
            const allCats = Array.from(new Set(prods.map(p => p.category)));
            if (allCats.length > 0) {
              const randCat = allCats[Math.floor(Math.random() * allCats.length)];
              row1Products = prods.filter(p => p.category === randCat);
            } else {
              row1Products = [...prods];
            }
          }

          // Shuffle Row 1 and take first 5
          row1Products = shuffleArray(row1Products).slice(0, 5);
          const shownIds = new Set(row1Products.map(p => p.id));

          // ROW 2: Newest products, randomized
          // Exclude Row 1 to prevent double displaying
          let newestCandidates = prods
            .filter(p => !shownIds.has(p.id))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15);
          
          let row2Products = shuffleArray(newestCandidates).slice(0, 5);
          row2Products.forEach(p => shownIds.add(p.id));

          // ROW 3: Most selling products for every category (one per category), randomized
          const categoryGroups: Record<string, Product[]> = {};
          prods.forEach(p => {
            if (!categoryGroups[p.category]) categoryGroups[p.category] = [];
            categoryGroups[p.category].push(p);
          });

          let bestSellersPerCategory: Product[] = [];
          Object.keys(categoryGroups).forEach(cat => {
            const sortedGroup = categoryGroups[cat].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
            if (sortedGroup.length > 0) {
              bestSellersPerCategory.push(sortedGroup[0]);
            }
          });

          let row3Candidates = bestSellersPerCategory.filter(p => !shownIds.has(p.id));
          if (row3Candidates.length < 5) {
            const extraSellers = prods
              .filter(p => !shownIds.has(p.id))
              .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
              .slice(0, 10);
            row3Candidates = [...row3Candidates, ...extraSellers];
          }

          let row3Products = shuffleArray(row3Candidates).slice(0, 5);
          row3Products.forEach(p => shownIds.add(p.id));

          // Load More pool (shuffle the remaining products ordered by popular mix)
          const remainingPool = shuffleArray(prods.filter(p => !shownIds.has(p.id)));

          setAllStoreProducts(prods);
          setRow1(row1Products);
          setRow2(row2Products);
          setRow3(row3Products);
          setLoadMorePool(remainingPool);
          setShownSet(shownIds);
        }
      } catch (err) {
        console.error('Error fetching personalized products logic:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndOrganize();
  }, [recentSearches]);

  const handleLoadMore = () => {
    // Append exactly 10 products (2 rows of 5 cards) from the pool
    const newItems = loadMorePool.slice(0, 10);
    setExtraRows(prev => [...prev, ...newItems]);
    
    // Update pool and shown lists
    setLoadMorePool(prev => prev.slice(10));
    const newShown = new Set(shownSet);
    newItems.forEach(p => newShown.add(p.id));
    setShownSet(newShown);
  };

  if (loading) {
    return (
      <section className="mt-[16px] md:mt-[44px] pt-[14px] pb-[12px] md:py-[32px] bg-[#FAFAFA] select-none">
        <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-[24px] p-4 md:p-[28px] border border-[#F1F5F9] space-y-12">
            <div className="space-y-6">
              <div className="h-6 w-48 bg-gray-100 rounded-md animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[20px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className={`bg-white border border-[#EEF2F7] rounded-[18px] h-[315px] md:h-[380px] animate-pulse ${i > 5 ? 'hidden lg:block' : ''}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-[16px] md:mt-[44px] pt-[14px] pb-[12px] md:py-[32px] bg-[#FAFAFA] select-none">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* Section Wrapper Container */}
        <div className="bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-[28px] border border-[#F1F5F9] shadow-[0_4px_25px_rgba(0,0,0,0.01)] space-y-8 md:space-y-12">
          
          {/* Combined Recommendations Grid */}
          {(row1.length > 0 || row2.length > 0 || row3.length > 0) && (() => {
            // Deduplicate across all 3 rows before rendering — prevents duplicate key warning
            const seen = new Set<string>();
            const combined = [...row1, ...row2, ...row3].filter(p => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            return (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Search size={16} className="text-[#FF6A00] md:w-[18px] md:h-[18px]" />
                  <h2 className="text-[16px] md:text-[20px] font-bold text-[#111827]">
                    Recommended For You
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[20px]">
                  {combined.map(product => (
                    <ProductCard key={`rec-${product.id}`} product={product} hideAddToCart={true} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Extra Loaded Rows */}
          {extraRows.length > 0 && (
            <div className="space-y-4 md:space-y-6 pt-4 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Sparkles size={16} className="text-[#FF6A00] md:w-[18px] md:h-[18px]" />
                <h2 className="text-[16px] md:text-[20px] font-bold text-[#111827]">
                  More Suggestions For You
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[20px]">
                {extraRows.map(product => (
                  <ProductCard key={`extra-${product.id}`} product={product} hideAddToCart={true} />
                ))}
              </div>
            </div>
          )}

          {/* Load More Button */}
          {loadMorePool.length > 0 && (
            <div className="flex justify-center pt-6 md:pt-8 border-t border-[#F1F5F9]">
              <button 
                onClick={handleLoadMore}
                className="h-[40px] md:h-[46px] px-6 md:px-8 rounded-full bg-[#FFF3E6] hover:bg-[#FFE7CC] text-[#FF6A00] text-[13px] md:text-[14px] font-[600] flex items-center gap-1.5 md:gap-2 transition-all duration-300 cursor-pointer shadow-sm shadow-[#FF6A00]/5"
              >
                <RefreshCw size={14} className="animate-spin-hover" />
                <span>Load More Products</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
