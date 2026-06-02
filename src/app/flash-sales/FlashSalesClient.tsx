'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
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

  if (!timeLeft) return <span className="text-[12px] font-semibold text-red-500 uppercase">Expired</span>;

  const totalMinutes = timeLeft.h * 60 + timeLeft.m;
  const isUrgent = totalMinutes < 60; // < 1 hour
  const isCritical = totalMinutes < 10; // < 10 minutes

  let textColor = '#FF6A00';
  let bgColor = '#FFF3E6';
  let urgencyText = '';

  if (isCritical) {
    textColor = '#DC2626';
    bgColor = '#FEE2E2';
    urgencyText = '⚡ Last Chance: ';
  } else if (isUrgent) {
    textColor = '#EF4444';
    bgColor = '#FEF2F2';
    urgencyText = '🔥 Ending Soon: ';
  } else {
    urgencyText = 'Ends in: ';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(timeLeft.h)}h ${pad(timeLeft.m)}m ${pad(timeLeft.s)}s`;

  return (
    <div 
      className="flex items-center gap-1 font-semibold select-none transition-all duration-300"
      style={{
        background: bgColor,
        color: textColor,
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        borderRadius: '999px',
        display: 'inline-flex'
      }}
    >
      <span>⏱ {urgencyText}{timeStr}</span>
    </div>
  );
};

export default function FlashSalesClient() {
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
        .order('start_time', { ascending: true })
        .order('end_time', { ascending: true });

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

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col select-none">
      <Header />
      
      <div className="pt-24 pb-12 flex-1">
        <div className="container max-w-[1440px] mx-auto px-6">
          
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-[700] text-[#111827] flex items-center gap-2 mb-2">
                Hot Deals
                <span className="bg-[#FF6A00] text-white px-2.5 py-1 rounded-full text-[12px] font-[600] tracking-wide animate-pulse">
                  🔥 Super Deals
                </span>
              </h1>
              <p className="text-[#6B7280] font-semibold text-sm max-w-2xl">
                Grab these premium limited-time offers. High quality items, heavily optimized prices, available while stocks last.
              </p>
            </div>
            <Link href="/" className="text-sm font-[600] text-gray-500 hover:text-black transition-colors hover:underline">
              Back to Home
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-[#E5E7EB] rounded-[20px] h-[360px] animate-pulse"></div>
              ))}
            </div>
          ) : flashSales.length === 0 ? (
            <div className="bg-white rounded-[20px] p-20 flex flex-col items-center justify-center text-center border border-[#E5E7EB] shadow-sm max-w-2xl mx-auto mt-12">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                ⏱
              </div>
              <h2 className="text-2xl font-[700] text-[#111827] mb-2">No Active Hot Deals</h2>
              <p className="text-[#6B7280] font-semibold max-w-md mx-auto">
                There are currently no hot deals running. Check back shortly for premium offers!
              </p>
              <Link href="/" className="mt-8 px-8 py-4 rounded-xl bg-[#FF6A00] text-white font-[600] hover:bg-[#E85D00] transition-all">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {flashSales.map((sale) => {
                const p = sale.product;
                const progress = Math.min(100, (sale.sold_qty / sale.total_stock) * 100);
                const isUpcoming = new Date(sale.start_time).getTime() > Date.now();
                const discountPercent = Math.round(((p.regular_price - sale.flash_price) / p.regular_price) * 100);
                
                return (
                  <div 
                    key={sale.id} 
                    className="bg-white rounded-[20px] p-4 flex flex-col justify-between border border-[#E5E7EB] hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] transition-all duration-300 group"
                    style={{ minWidth: '180px', maxWidth: '200px', margin: 'auto' }}
                  >
                    {/* 1. Timer at the Top */}
                    <div className="mb-3 text-center">
                      <CountdownTimer targetTime={isUpcoming ? sale.start_time : sale.end_time} isUpcoming={isUpcoming} />
                    </div>

                    {/* 2. Image */}
                    <Link 
                      href={isUpcoming ? '#' : `/products/${p.slug}`} 
                      className={`block relative mb-3 overflow-hidden rounded-xl bg-gray-50 aspect-square ${isUpcoming ? 'cursor-default' : ''}`}
                    >
                      {p.images?.[0] ? (
                        <img 
                          src={p.images[0]} 
                          alt={p.display_name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                          ⏱
                        </div>
                      )}
                    </Link>

                    {/* 3. Sold Quantity and Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-[12px] text-[#6B7280] mb-1 font-[400]">
                        <span>{sale.sold_qty} Sold</span>
                      </div>
                      <div className="w-full h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF6A00] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Brand Name (Clickable) */}
                    {p.brand && p.brand !== 'No Brand' && (
                      <div className="mt-1 mb-0.5 flex flex-col gap-1.5">
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

                    {/* 4. Title: Max 2 lines, size 13px, weight 500, color #111827 */}
                    <div className="mb-2 h-[38px] overflow-hidden" style={{ marginTop: p.brand && p.brand !== 'No Brand' ? '0px' : '0px' }}>
                      <Link href={isUpcoming ? '#' : `/products/${p.slug}`} className={isUpcoming ? 'cursor-default pointer-events-none' : ''}>
                        <h3 
                          className="text-[#111827] leading-[1.4] line-clamp-2 hover:text-[#FF6A00] transition-colors"
                          style={{ fontSize: '13px', fontWeight: 500 }}
                        >
                          {p.display_name}
                        </h3>
                      </Link>
                    </div>

                    {/* 5. Prices: Old Price and Flash Sales Price Tag */}
                    <div className="mb-4 flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-[600] text-[#111827]">
                          Rs.{isUpcoming ? '***' : sale.flash_price}
                        </span>
                        <span className="text-[#6B7280] line-through text-[12px] font-[400]">
                          Rs.{p.regular_price}
                        </span>
                      </div>
                      <div>
                        <span className="bg-[#DCFCE7] text-[#15803D] text-[12px] font-[600] px-1.5 py-0.5 rounded-[6px] inline-block">
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
                      className={`w-full text-white font-[600] text-[13px] h-[36px] rounded-[10px] transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        isUpcoming 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-[#FF6A00] hover:bg-[#E85D00]'
                      }`}
                    >
                      {isUpcoming ? 'Dropping Soon' : 'Buy Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
