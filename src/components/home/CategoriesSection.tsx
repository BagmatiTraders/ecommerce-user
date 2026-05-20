'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('ecommerce_categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setCategories(data.filter((cat: any) => !cat.parent_id));
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="mt-[12px] md:mt-[40px] py-[12px] md:py-[24px] select-none">
        <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="bg-[#FCFCFC] rounded-[20px] p-4 md:p-6 border border-[#E5E7EB] animate-pulse">
            <div className="h-6 w-24 md:h-7 md:w-32 bg-gray-200/50 rounded-lg mb-4 md:mb-6"></div>
            <div className="flex gap-3 md:gap-[20px] overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col items-center w-[75px] md:w-[120px] shrink-0">
                  <div className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] rounded-full bg-gray-200/50"></div>
                  <div className="h-3 w-12 bg-gray-200/50 rounded mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="mt-[12px] md:mt-[40px] py-[12px] md:py-[24px] select-none">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Category Section Background Card */}
        <div className="bg-[#FCFCFC] rounded-[20px] p-4 md:p-6 border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          
          {/* Header text size adjusted */}
          <h2 className="text-[16px] md:text-[22px] font-[700] text-[#111827] mb-4 md:mb-6">
            Categories
          </h2>
          
          {/* Horizontal Slide container on mobile, normal flex-wrap on desktop */}
          <div 
            className="flex md:flex-wrap gap-3 md:gap-[20px] justify-start overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none pb-2 md:pb-0 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/search?category=${encodeURIComponent(category.name)}`}
                className="flex flex-col items-center w-[75px] md:w-[120px] shrink-0 snap-start group cursor-pointer"
              >
                {/* 
                  Categories Image Container:
                  width/height: 64px on mobile, 96px on desktop
                  background: #F9FAFB, padding: 8px on mobile, 12px on desktop
                */}
                <div className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] rounded-full bg-[#F9FAFB] p-[8px] md:p-[12px] border border-[#E5E7EB] flex items-center justify-center transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] group-hover:border-[#FF6A00] shrink-0">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      loading="lazy"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200"></div>
                  )}
                </div>
                
                {/* 
                  Categories Name Design:
                  font-size: 11px on mobile, 14px on desktop
                  margin-top: 6px on mobile, 10px on desktop
                */}
                <span className="text-[11px] md:text-[14px] font-[500] text-[#374151] text-center mt-[6px] md:mt-[10px] leading-[1.3] md:leading-[1.4] transition-colors duration-300 group-hover:text-[#FF6A00] line-clamp-2 max-w-[75px] md:max-w-[110px]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
