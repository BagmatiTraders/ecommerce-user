'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store/useCart';
import ProductCard from './ProductCard';

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
                className="bg-gray-50 rounded-[16px] md:rounded-[20px] p-2.5 md:p-4 flex flex-col justify-between border border-gray-100 animate-pulse w-full h-[315px] md:h-[360px]"
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
          {flashSales.map((sale, index) => {
            const p = sale.product;
            const isUpcoming = new Date(sale.start_time).getTime() > Date.now();
            
            return (
              <ProductCard
                key={sale.id}
                product={{
                  id: p.id,
                  display_name: p.display_name,
                  slug: p.slug,
                  regular_price: p.regular_price,
                  special_price: sale.flash_price,
                  images: p.images,
                  category: p.category,
                  brand: p.brand,
                  soldCount: sale.sold_qty
                }}
                variant="flash-sale"
                totalStock={sale.total_stock}
                flashSaleExpiry={isUpcoming ? sale.start_time : sale.end_time}
                isUpcoming={isUpcoming}
                priority={index < 2}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
