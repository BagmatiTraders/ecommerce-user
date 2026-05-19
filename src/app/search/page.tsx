'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  ShoppingBag, 
  Star, 
  ArrowUpDown,
  Filter,
  X,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/home/ProductCard';

// Remove static CATEGORIES

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState(1000);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('ecommerce_categories').select('*').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [initialQuery, category, sortBy, priceRange]);

  const fetchFilteredProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('ecommerce_products')
      .select('*')
      .eq('status', 'active');

    // Text Search
    if (initialQuery) {
      query = query.ilike('display_name', `%${initialQuery}%`);
    }

    // Category Filter
    if (category !== 'All') {
      query = query.eq('category', category);
    }

    // Price Filter
    query = query.lte('price', priceRange);

    // Sorting
    if (sortBy === 'price-low') query = query.order('price', { ascending: true });
    else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 space-y-6 shrink-0">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter size={16} /> Categories
            </h3>
            <div className="space-y-1.5">
              <button 
                onClick={() => setCategory('All')}
                className={`w-full text-left px-4 py-2 rounded-xl transition-all font-bold text-sm ${
                  category === 'All' ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-[var(--surface-1)] text-[var(--text-secondary)]'
                }`}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition-all font-bold text-sm ${
                    category === cat.name ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-[var(--surface-1)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest mb-3 flex items-center justify-between">
              Price Range
              <span className="text-[var(--primary)]">${priceRange}</span>
            </h3>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-[var(--text-muted)]">
              <span>$0</span>
              <span>$2000+</span>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="font-extrabold mb-2 relative z-10">Premium Member?</h4>
            <p className="text-xs text-blue-100 mb-4 relative z-10">Get extra 15% off on all {category !== 'All' ? category : 'store'} items.</p>
            <button className="text-[10px] font-extrabold uppercase tracking-widest bg-white text-blue-600 px-4 py-2 rounded-lg relative z-10">Learn More</button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <h1 className="text-2xl font-extrabold">
              {loading ? 'Searching...' : `${products.length} Results Found`}
              {initialQuery && <span className="text-[var(--text-muted)] font-bold ml-2 text-lg">for "{initialQuery}"</span>}
            </h1>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-[var(--surface-2)]">
              <ArrowUpDown size={16} className="ml-2 text-[var(--text-muted)]" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs uppercase tracking-widest pr-4"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div key={i} className="h-72 rounded-2xl bg-white animate-pulse border border-[var(--surface-2)]"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-[var(--surface-2)] shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[var(--surface-1)] flex-center mx-auto mb-6 text-[var(--text-muted)]">
                <SearchIcon size={40} strokeWidth={1} />
              </div>
              <h2 className="text-2xl font-bold mb-4">No products found</h2>
              <p className="text-[var(--text-secondary)] mb-8">Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => {setCategory('All'); setPriceRange(1000);}}
                className="px-8 py-4 rounded-2xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-[20px] animate-fade-in">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] pb-20">
      <Header />
      <div className="pt-10">
        <Suspense fallback={<div className="container text-center py-20">Loading Results...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </main>
  );
}
