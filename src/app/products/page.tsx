'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Filter, Grid, List, RefreshCw } from 'lucide-react';
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
  rating?: number;
  reviews_count?: number;
  soldCount?: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filter & Sort States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('popularity');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch categories
        const { data: catData } = await supabase
          .from('ecommerce_categories')
          .select('id, name')
          .order('name', { ascending: true });
        
        if (catData) setCategories(catData);

        // 2. Fetch order items to calculate sales metrics
        const { data: orderItems, error: oiError } = await supabase
          .from('ecommerce_order_items')
          .select('product_id, quantity');
          
        const salesMap: Record<string, number> = {};
        if (!oiError && orderItems) {
          orderItems.forEach((item: any) => {
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
          });
        }

        // 3. Fetch active storefront products
        const { data: activeProds, error: pError } = await supabase
          .from('ecommerce_products')
          .select('*')
          .eq('status', 'active');

        if (pError) throw pError;

        if (activeProds) {
          const prods = activeProds.map((p: any) => ({
            ...p,
            price: p.special_price || p.regular_price || 0,
            soldCount: salesMap[p.id] || 0
          }));
          setProducts(prods);
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter & Sort Logic
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    
    // Price Filter
    const price = product.special_price || product.regular_price;
    if (priceRange.min && price < parseFloat(priceRange.min)) {
      return false;
    }
    if (priceRange.max && price > parseFloat(priceRange.max)) {
      return false;
    }
    
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.special_price || a.regular_price;
    const priceB = b.special_price || b.regular_price;
    
    if (sortBy === 'price-low') {
      return priceA - priceB;
    }
    if (sortBy === 'price-high') {
      return priceB - priceA;
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Default popularity: Sort by sales metrics first, then rating
    if (sortBy === 'popularity') {
      if ((b.soldCount || 0) !== (a.soldCount || 0)) {
        return (b.soldCount || 0) - (a.soldCount || 0);
      }
      return (b.rating || 5.0) - (a.rating || 5.0);
    }
    return 0;
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setSortBy('popularity');
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col select-none">
      <Header />
      
      {/* Container: max-width 1440px, margin auto, padding 24px */}
      <div className="container max-w-[1440px] mx-auto px-6 pt-[96px] pb-12 flex-1">
        
        {/* Breadcrumb: Home / All Products */}
        <nav className="mb-6 flex items-center gap-1.5 text-[13px] font-[500] text-[#6B7280]">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-[#111827]">All Products</span>
        </nav>

        {/* Page Header Layout: All Products + Showing count */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-[700] text-[#111827] leading-none mb-2">
              All Products
            </h1>
            <p className="text-[15px] text-[#6B7280]">
              Showing {indexOfFirstProduct + 1}–{Math.min(indexOfLastProduct, sortedProducts.length)} of {sortedProducts.length} products
            </p>
          </div>
        </div>

        {/* Filter + Sort Bar */}
        <div className="mb-8 bg-white border border-[#E5E7EB] rounded-[16px] p-[16px] md:px-[20px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shadow-black/5">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
            <Filter size={16} className="text-[#FF6A00]" />
            <span>Active Filters: {selectedCategories.length + (priceRange.min || priceRange.max ? 1 : 0)} selected</span>
            {(selectedCategories.length > 0 || priceRange.min || priceRange.max) && (
              <button 
                onClick={handleClearAll} 
                className="text-[#FF6A00] hover:text-[#E85D00] text-xs font-[600] ml-2 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Sort By</span>
              <select 
                value={sortBy} 
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="h-[42px] px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm font-medium text-gray-800 outline-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                <option value="popularity">Best Selling (Popularity)</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#FF6A00] transition-colors cursor-pointer" title="Grid View">
                <Grid size={18} />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#FF6A00] transition-colors cursor-pointer" title="List View">
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar + Main Grid Container */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Filters - Width 280px */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-6">
            
            {/* Filter Card Style: background white, radius 18px, padding 20px, border */}
            <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-[20px] shadow-sm shadow-black/5 space-y-6">
              
              {/* Category Section */}
              <div>
                <h3 className="text-[15px] font-[600] text-[#111827] mb-[12px] uppercase tracking-wide">
                  Categories
                </h3>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="text-[14px] color-[#374151] flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => handleCategoryChange(cat.name)}
                        className="w-4 h-4 rounded text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 cursor-pointer"
                      />
                      <span className="group-hover:text-[#FF6A00] transition-colors">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-[15px] font-[600] text-[#111827] mb-[12px] uppercase tracking-wide">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => { setPriceRange(prev => ({ ...prev, min: e.target.value })); setCurrentPage(1); }}
                    className="w-full h-[40px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-gray-800 outline-none focus:border-[#FF6A00] transition-colors"
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => { setPriceRange(prev => ({ ...prev, max: e.target.value })); setCurrentPage(1); }}
                    className="w-full h-[40px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-gray-800 outline-none focus:border-[#FF6A00] transition-colors"
                  />
                </div>
              </div>

            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 w-full space-y-12">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="bg-white border border-[#EEF2F7] rounded-[18px] h-[380px] animate-pulse"></div>
                ))}
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-20 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6">
                  🔍
                </div>
                <h3 className="text-xl font-[700] text-[#111827] mb-2">No Products Found</h3>
                <p className="text-[#6B7280] font-medium max-w-sm mx-auto">
                  We couldn't find any products matching your active filters. Try modifying your filter choices!
                </p>
                <button 
                  onClick={handleClearAll}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* 5-column Desktop Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px]">
                  {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Layout: < Prev 1 2 3 Next > */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8 border-t border-[#E5E7EB]">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 h-[36px] bg-white border border-[#E5E7EB] hover:border-gray-400 rounded-lg text-sm font-semibold text-gray-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      &lt; Prev
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = currentPage === pageNum;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            isActive 
                              ? 'w-[36px] h-[36px] bg-[#FF6A00] text-white text-sm font-bold rounded-lg flex items-center justify-center'
                              : 'w-[36px] h-[36px] bg-white border border-[#E5E7EB] hover:border-gray-400 text-gray-700 text-sm font-semibold rounded-lg flex items-center justify-center cursor-pointer transition-all'
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 h-[36px] bg-white border border-[#E5E7EB] hover:border-gray-400 rounded-lg text-sm font-semibold text-gray-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
