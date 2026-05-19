'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store/useCart';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  regular_price: number;
  images: string[];
  category: string;
  brand?: string;
}

interface FlashSale {
  id: string;
  flash_price: number;
  total_stock: number;
  sold_qty: number;
  start_time: string;
  end_time: string;
  product: Product;
}

const CountdownTimer = ({ targetTime, isUpcoming }: { targetTime: string, isUpcoming?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetTime) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          h: Math.floor(difference / (1000 * 60 * 60)),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  if (!timeLeft) {
    return (
      <span className="text-[9px] md:text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
        Expired
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(timeLeft.h)}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`;

  return (
    <div 
      className="flex items-center gap-1 font-bold select-none text-[9px] md:text-[10px] px-2 py-0.5 rounded-full text-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
      style={{
        background: 'linear-gradient(135deg, #FF416C, #FF4B2B)'
      }}
    >
      <span>Ends in {timeStr}</span>
    </div>
  );
};

export default function FlashSaleSection() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchFlashSales = async () => {
      const nowMs = Date.now();
      const twoHoursLater = new Date(nowMs + 2 * 60 * 60 * 1000).toISOString();
      const now = new Date(nowMs).toISOString();
      
      const { data, error } = await supabase
        .from('store_flash_sales')
        .select(`
          id, flash_price, total_stock, sold_qty, start_time, end_time,
          product:ecommerce_products!inner(id, display_name, slug, regular_price, images, category, brand)
        `)
        .eq('is_active', true)
        .lt('start_time', twoHoursLater)
        .gt('end_time', now)
        .limit(6);

      if (!error && data) {
        const activeSales = data.filter((sale: any) => sale.sold_qty < sale.total_stock);
        setFlashSales(activeSales as any[]);
      }
      setLoading(false);
    };

    fetchFlashSales();
  }, []);

  const handleBuyNow = (sale: FlashSale) => {
    const p = sale.product;
    const expiryTime = new Date(Math.min(Date.now() + 60 * 60 * 1000, new Date(sale.end_time).getTime())).toISOString();

    addItem({
      id: p.id,
      inventory_id: p.id,
      display_name: p.display_name,
      selected_variation: null,
      price: sale.flash_price,
      quantity: 1,
      maxQuantity: Math.min(5, sale.total_stock - sale.sold_qty),
      image: p.images?.[0],
      category: p.category,
      isFlashSale: true,
      flashSaleExpiry: expiryTime
    });

    router.push('/checkout');
  };

  if (loading) {
    return (
      <section className="mt-[16px] md:mt-8 pt-[14px] pb-[12px] md:py-8 bg-white border-y border-[#E5E7EB] select-none">
        <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div className="h-6 w-32 md:h-8 md:w-48 bg-gray-100 rounded-xl animate-pulse"></div>
            <div className="h-4 w-16 md:h-5 md:w-24 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className="bg-gray-50 rounded-[16px] md:rounded-[20px] p-2.5 md:p-4 flex flex-col justify-between border border-gray-100 animate-pulse w-full h-[285px] md:h-[360px]"
              >
                <div className="aspect-square bg-gray-200/50 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200/50 rounded-full w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (flashSales.length === 0) return null;

  return (
    <section className="mt-[16px] md:mt-8 pt-[14px] pb-[12px] md:py-8 bg-[#F9FAFB] border-y border-[#E5E7EB] select-none">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* Left Aligned Compact Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center gap-1.5 md:gap-3">
            <h2 className="text-[16px] md:text-[20px] font-bold text-[#111827] flex items-center gap-1">
              <span className="text-[18px]">🔥</span> Hot Deals
            </h2>
            {/* Desktop Only Highlight Badge */}
            <span className="hidden md:inline-block bg-[#FF6A00] text-white px-2.5 py-1 rounded-full text-[12px] font-[600] tracking-wide animate-pulse">
              🔥 Hot Deals
            </span>
          </div>
          
          <Link 
            href="/flash-sales" 
            className="text-[#FF6A00] font-[600] hover:text-[#E85D00] transition-colors hover:underline flex items-center gap-0.5 text-[13px] md:text-sm"
          >
            <span>View All</span>
            <span className="hidden md:inline">&nbsp;Hot Deals</span>
            <span>&nbsp;→</span>
          </Link>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-5">
          {flashSales.map((sale) => {
            const p = sale.product;
            const progress = Math.min(100, (sale.sold_qty / sale.total_stock) * 100);
            const isUpcoming = new Date(sale.start_time).getTime() > Date.now();
            const discountPercent = Math.round(((p.regular_price - sale.flash_price) / p.regular_price) * 100);
            
            return (
              <div 
                key={sale.id} 
                className="bg-white rounded-[16px] md:rounded-[20px] p-2.5 md:p-4 flex flex-col justify-between border border-[#E5E7EB] hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] transition-all duration-300 group w-full md:max-w-[200px] md:min-w-[180px] md:mx-auto h-[285px] md:h-auto"
              >
                {/* 1. Image Container with Badge Overlay */}
                <Link 
                  href={isUpcoming ? '#' : `/products/${p.slug}`} 
                  className={`block relative mb-2 overflow-hidden rounded-xl bg-gray-50 shrink-0 h-[120px] md:h-auto md:aspect-square ${isUpcoming ? 'cursor-default' : ''}`}
                >
                  {p.images?.[0] ? (
                    <img 
                      src={p.images[0]} 
                      alt={p.display_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                      ⏱
                    </div>
                  )}

                  {/* Absolute Countdown Badge */}
                  <div className="absolute top-1.5 left-1.5 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                    <CountdownTimer targetTime={isUpcoming ? sale.start_time : sale.end_time} isUpcoming={isUpcoming} />
                  </div>
                </Link>

                {/* 2. Brand Name (Desktop Only to save height) */}
                {p.brand && p.brand !== 'No Brand' && (
                  <div className="hidden md:flex flex-col gap-1 mt-1 shrink-0">
                    <Link 
                      href={isUpcoming ? '#' : `/brand/${p.brand.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-[700] tracking-[1px] uppercase text-[#4B5563] hover:text-[#FF6A00] transition-colors inline-block"
                    >
                      {p.brand}
                    </Link>
                    <div style={{ width: '24px', height: '2px', backgroundColor: '#E5E7EB', marginTop: '4px', marginBottom: '6px' }} />
                  </div>
                )}

                {/* 3. Product Title (Max 2 lines) */}
                <div className="mb-1.5 overflow-hidden h-[36px] md:h-[40px] shrink-0">
                  <Link href={isUpcoming ? '#' : `/products/${p.slug}`} className={isUpcoming ? 'cursor-default pointer-events-none' : ''}>
                    <h3 
                      className="text-[#111827] leading-[1.3] line-clamp-2 hover:text-[#FF6A00] transition-colors text-[13px] md:text-sm font-semibold"
                    >
                      {p.display_name}
                    </h3>
                  </Link>
                </div>

                {/* 4. Sold Progress Info */}
                <div className="mb-1.5 shrink-0">
                  <div className="flex justify-between items-center text-[10px] md:text-[11px] text-[#4B5563] font-semibold">
                    <span>🔥 {sale.sold_qty} sold today</span>
                  </div>
                  <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 5. Prices and Discount Badge */}
                <div className="mb-2 flex flex-col gap-0.5 shrink-0">
                  <div className="flex items-baseline flex-wrap gap-1.5">
                    <span className="text-[16px] md:text-[18px] font-bold text-[#111827]">
                      Rs.{isUpcoming ? '***' : sale.flash_price}
                    </span>
                    <span className="text-[#6B7280] line-through text-[11px] md:text-[12px] font-[400]">
                      Rs.{p.regular_price}
                    </span>
                  </div>
                  <div>
                    <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] md:text-[11px] font-[700] px-1.5 py-0.5 rounded-[4px] inline-block">
                      {discountPercent}% OFF
                    </span>
                  </div>
                </div>

                {/* 6. Buy Now Button */}
                <button 
                  onClick={() => {
                    if (!isUpcoming) {
                      handleBuyNow(sale);
                    }
                  }}
                  disabled={isUpcoming}
                  className={`w-full font-bold text-[13px] h-[36px] md:h-[40px] rounded-[10px] md:rounded-[12px] transition-all duration-300 flex items-center justify-center cursor-pointer border-none shrink-0 ${
                    isUpcoming 
                      ? 'bg-gray-150 text-gray-400 cursor-not-allowed' 
                      : 'bg-[#FFA41C] text-[#111111] hover:bg-[#FA8900] shadow-sm shadow-[#FFA41C]/10'
                  }`}
                >
                  {isUpcoming ? 'Dropping Soon' : 'Buy Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
