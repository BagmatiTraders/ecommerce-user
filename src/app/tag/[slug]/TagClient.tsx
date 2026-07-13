'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/home/ProductCard';
import { ArrowLeft, Tag, ShoppingBag, SlidersHorizontal, ChevronRight } from 'lucide-react';

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

type SortKey = 'popularity' | 'price-low' | 'price-high' | 'newest';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'price-low',  label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest First' },
];

export default function TagClient({
  initialProducts,
  tagLabel,
  tagSlug,
}: {
  initialProducts: Product[];
  tagLabel: string;
  tagSlug: string;
}) {
  const [sortBy, setSortBy] = useState<SortKey>('popularity');

  const sorted = [...initialProducts].sort((a, b) => {
    if (sortBy === 'price-low')  return (a.special_price ?? a.regular_price) - (b.special_price ?? b.regular_price);
    if (sortBy === 'price-high') return (b.special_price ?? b.regular_price) - (a.special_price ?? a.regular_price);
    if (sortBy === 'newest')     return 0; // already sorted by created_at on server
    return (b.soldCount ?? 0) - (a.soldCount ?? 0); // popularity
  });

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100 pt-28 pb-10">
        <div className="container max-w-[1440px] mx-auto px-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-5 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-[#FF6A00] transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/products" className="hover:text-[#FF6A00] transition-colors">Products</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700">{tagLabel}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm shrink-0">
                <Tag size={26} />
              </div>
              <div>
                {/* This h1 is what Google reads and shows in search results */}
                <h1 className="text-[26px] md:text-[32px] font-[800] text-gray-900 leading-none mb-2">
                  Buy {tagLabel} Online
                </h1>
                <p className="text-sm font-semibold text-gray-500">
                  at Best Price in Nepal — Fast Delivery · Cash on Delivery
                </p>
              </div>
            </div>

            {/* Stats + Sort */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 flex items-center gap-3">
                <ShoppingBag size={18} className="text-orange-600" />
                <div>
                  <div className="text-[16px] font-[800] text-gray-900 leading-none">{initialProducts.length}</div>
                  <div className="text-[10px] font-[700] uppercase text-gray-400 mt-1">Products Found</div>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="container max-w-[1440px] mx-auto px-6 mt-10">
        {sorted.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">🔍</div>
            <h2 className="text-xl font-[700] text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-500 font-semibold max-w-sm mx-auto mb-6">
              We couldn't find any products matching "{tagLabel}" right now.
            </p>
            <Link
              href="/products"
              className="inline-flex h-[44px] px-7 rounded-xl bg-[#FF6A00] hover:bg-[#E85D00] text-white text-sm font-semibold items-center justify-center transition-all shadow-sm"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SEO-friendly paragraph — Google reads this text */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Showing <strong>{sorted.length} products</strong> for{' '}
                <strong>"{tagLabel}"</strong> available online in Nepal.
                Shop the latest {tagLabel} at the best price with fast delivery and cash on delivery
                across Nepal at <strong>Bagmati Shop</strong>.
              </p>
            </div>

            {/* 5-column Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px]">
              {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center pt-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-[#FF6A00] hover:text-[#FF6A00] transition-all"
              >
                <ArrowLeft size={16} />
                Browse All Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
