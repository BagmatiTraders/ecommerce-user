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
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="mt-[40px] py-[24px] select-none">
        <div className="container max-w-[1440px] mx-auto px-6">
          <div className="bg-[#FCFCFC] rounded-[20px] p-6 border border-[#E5E7EB] animate-pulse">
            <div className="h-7 w-32 bg-gray-200/50 rounded-lg mb-6"></div>
            <div className="flex flex-wrap gap-[20px]">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col items-center w-[120px]">
                  <div className="w-[96px] h-[96px] rounded-full bg-gray-200/50"></div>
                  <div className="h-4 w-16 bg-gray-200/50 rounded mt-3"></div>
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
    <section className="mt-[40px] py-[24px] select-none">
      <div className="container max-w-[1440px] mx-auto px-6">
        {/* Category Section Background: #FCFCFC, border-radius: 20px, padding: 24px */}
        <div className="bg-[#FCFCFC] rounded-[20px] p-6 border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          {/* Heading Style: font-size: 22px, font-weight: 700, color: #111827 */}
          <h2 className="text-[22px] font-[700] text-[#111827] mb-6">
            Categories
          </h2>
          
          {/* Gap between categories: 20px */}
          <div className="flex flex-wrap gap-[20px] justify-start">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/search?category=${encodeURIComponent(category.name)}`}
                className="flex flex-col items-center w-[120px] group cursor-pointer"
              >
                {/* 
                  Categories Image Container:
                  width: 96px, height: 96px, border-radius: 999px, background: #F9FAFB, padding: 12px, border: 1px solid #E5E7EB
                  Hover Lift & Border Color:
                  transform: translateY(-4px), box-shadow: 0 8px 18px rgba(0,0,0,0.08), border-color: #FF6A00, transition: 0.3s ease
                */}
                <div className="w-[96px] h-[96px] rounded-full bg-[#F9FAFB] p-[12px] border border-[#E5E7EB] flex items-center justify-center transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] group-hover:border-[#FF6A00] shrink-0">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  )}
                </div>
                
                {/* 
                  Categories Name Design:
                  font-size: 14px, font-weight: 500, color: #374151, text-align: center, margin-top: 10px, line-height: 1.4
                */}
                <span className="text-[14px] font-[500] text-[#374151] text-center mt-[10px] leading-[1.4] transition-colors duration-300 group-hover:text-[#FF6A00] line-clamp-2 max-w-[110px]">
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
