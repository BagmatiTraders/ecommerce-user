'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Package,
  Lock
} from 'lucide-react';
import { Zap } from 'lucide-react';
import Link from 'next/link';

const CartFlashSaleBanner = ({ items, onExpire }: { items: any[], onExpire: () => void }) => {
  const flashSaleItems = items.filter(item => item.isFlashSale && item.flashSaleExpiry);
  
  if (flashSaleItems.length === 0) return null;

  // Find the earliest expiry
  const earliestExpiry = flashSaleItems.reduce((earliest, current) => {
    return new Date(current.flashSaleExpiry) < new Date(earliest) ? current.flashSaleExpiry : earliest;
  }, flashSaleItems[0].flashSaleExpiry);

  const [timeLeft, setTimeLeft] = useState<{ h: number, m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(earliestExpiry) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
        onExpire(); // Trigger cart revalidation
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [earliestExpiry]);

  if (!timeLeft) return null;

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-center gap-3 shadow-sm">
      <Zap className="text-amber-500 animate-pulse shrink-0" size={20} />
      <span className="font-bold text-amber-900 text-sm text-center">
        Proceed this order within <span className="font-black text-amber-600 bg-white px-2 py-1 rounded shadow-sm mx-1">{formatTime(timeLeft.h)}:{formatTime(timeLeft.m)}:{formatTime(timeLeft.s)}</span> for flash sales price!
      </span>
    </div>
  );
};

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, validatePrices } = useCart();
  const router = useRouter();
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Default select all items on load
    if (items.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
    validatePrices(supabase);
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        document.body.setAttribute('data-hide-header', 'true');
      } else {
        document.body.setAttribute('data-hide-header', 'false');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeAttribute('data-hide-header');
    };
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const selectedTotal = items
    .filter(item => selectedIds.has(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
    router.push('/checkout');
  };

  const cartQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Header />
        <div className="container max-w-[1440px] mx-auto px-6 mt-[20px] text-center">
          <div className="max-w-md mx-auto space-y-8 py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-white border border-[#EEF2F7] flex-center mx-auto text-gray-300 shadow-sm">
              <ShoppingBag size={48} className="text-[#FF6A00]" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Your cart is empty</h1>
              <p className="text-[#6B7280] font-medium">Looks like you haven't added anything to your cart yet.</p>
            </div>
            <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF6A00] px-8 text-sm font-bold text-white transition-all hover:bg-[#E85D00] shadow-md shadow-[#FF6A00]/10">
              <ArrowLeft size={18} /> Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-20 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Container: max-width 1440px, margin auto, padding 24px (px-6 mt-[20px] pb-12 is perfect) */}
      <div className="container max-w-[1440px] mx-auto px-6 mt-[20px] pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#FF6A00] font-black text-[10px] uppercase tracking-widest mb-2">
              <Package size={12} />
              Shopping Cart
            </div>
            {/* Header Title: "Shopping Cart {cart quantity}" with specific styles */}
            <h1 className="text-[32px] font-[700] text-[#111827] leading-none">
              Shopping Cart ({cartQuantity})
            </h1>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="hidden md:flex text-sm font-semibold text-[#6B7280] hover:text-[#FF6A00] items-center gap-2 transition-colors cursor-pointer self-start sm:self-center bg-transparent border-none"
          >
            <ArrowLeft size={16} /> Continue Shopping
          </button>
        </div>

        {/* Layout Ratio: Left Cart Area 70% | Right Order Summary 30% using grid-cols-[7fr_3fr] */}
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 items-start">
          
          {/* LEFT CART AREA (70% on desktop) */}
          <div className="space-y-6">
            <CartFlashSaleBanner items={items} onExpire={() => validatePrices(supabase)} />
            
            {/* SELECT ALL UI CHECKBOX CARD */}
            <div className="flex items-center justify-between bg-white border border-[#EEF2F7] rounded-[18px] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {/* SELECT ALL UI CHECKBOX STYLE */}
                <input 
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  className="w-[18px] h-[18px] cursor-pointer accent-[#FF6A00] rounded"
                  style={{ accentColor: '#FF6A00' }}
                />
                <span className="text-[14px] font-[500] text-[#374151]">
                  Select All ({items.length})
                </span>
              </div>
            </div>

            {/* CART ITEMS CARD LIST */}
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white border border-[#EEF2F7] rounded-[18px] p-5 transition-all duration-[250ms] ease-in-out hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    selectedIds.has(item.id) ? 'opacity-100' : 'opacity-85 grayscale-[20%]'
                  }`}
                  style={{
                    background: 'white',
                    borderRadius: '18px',
                    padding: '20px',
                    border: '1px solid #EEF2F7',
                    transition: '0.25s ease'
                  }}
                >
                  {/* Left Group: Checkbox + Product Image + Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Item Checkbox */}
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-[18px] h-[18px] cursor-pointer accent-[#FF6A00] rounded shrink-0"
                      style={{ accentColor: '#FF6A00' }}
                    />
                    
                    {/* Product Image Design */}
                    <div 
                      className="w-[80px] h-[80px] md:w-[110px] md:h-[110px] rounded-[14px] bg-[#FAFAFA] p-[8px] md:p-[12px] flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden"
                      style={{
                        borderRadius: '14px',
                        background: '#FAFAFA'
                      }}
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.display_name} 
                          className="w-full h-full object-contain" 
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="text-gray-300 text-xs">No Image</div>
                      )}
                    </div>
                    
                    {/* Product Title & Meta/Variation Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Product Title */}
                      <h3 
                        className="text-[14px] md:text-[16px] font-[500] leading-[1.4] md:leading-[1.5] text-[#111827] line-clamp-2"
                        style={{
                          fontWeight: 500,
                          color: '#111827'
                        }}
                      >
                        {item.display_name}
                      </h3>
                      
                      {/* Product Meta / Variation Info */}
                      <div 
                        className="text-[11px] md:text-[14px] text-[#6B7280] font-[400] flex flex-wrap items-center gap-x-2 gap-y-0.5"
                        style={{
                          color: '#6B7280',
                          fontWeight: 400
                        }}
                      >
                        <span>Category: {item.category}</span>
                        {item.selected_variation && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-[#FF6A00] font-medium">{item.selected_variation}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Group: Quantity Selector + Price + Delete */}
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    
                    {/* Quantity Selector Design */}
                    <div 
                      className="flex items-center h-[38px] md:h-[42px] border border-[#E5E7EB] rounded-[10px] md:rounded-[12px] overflow-hidden bg-white shrink-0"
                      style={{
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden',
                        background: 'white'
                      }}
                    >
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="w-[34px] md:w-[40px] h-full bg-[#F9FAFB] text-[14px] md:text-[16px] font-[600] flex items-center justify-center border-r border-[#E5E7EB] hover:bg-gray-100 transition-colors border-none cursor-pointer"
                        style={{
                          background: '#F9FAFB',
                          fontWeight: 600
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span 
                        className="min-w-[34px] md:min-w-[42px] text-center text-[13px] md:text-[15px] font-[600] text-[#111827]"
                        style={{
                          textAlign: 'center',
                          fontWeight: 600
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => {
                          const itemMax = item.maxQuantity || 5;
                          if (item.quantity < itemMax) {
                            updateQuantity(item.id, item.quantity + 1);
                          }
                        }} 
                        className="w-[34px] md:w-[40px] h-full bg-[#F9FAFB] text-[14px] md:text-[16px] font-[600] flex items-center justify-center border-l border-[#E5E7EB] hover:bg-gray-100 transition-colors border-none cursor-pointer"
                        style={{
                          background: '#F9FAFB',
                          fontWeight: 600
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price Design */}
                    <div className="flex flex-col items-end min-w-[80px] md:min-w-[120px] shrink-0">
                      <div className="flex items-baseline gap-0.5">
                        <span 
                          className="text-[12px] md:text-[14px] font-[500] text-[#6B7280]"
                          style={{
                            fontWeight: 500,
                            color: '#6B7280'
                          }}
                        >
                          Rs.
                        </span>
                        <span 
                          className="text-[20px] md:text-[28px] font-[800] leading-none text-[#111827]"
                          style={{
                            fontWeight: 800,
                            lineHeight: 1,
                            color: '#111827'
                          }}
                        >
                          {item.price * item.quantity}
                        </span>
                      </div>
                      <span className="text-[10px] md:text-[12px] text-[#6B7280] mt-0.5 font-medium">
                        Rs. {item.price} each
                      </span>
                    </div>

                    {/* Remove Button Design - Premium Soft Pill Style */}
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-[4px] md:gap-[6px] cursor-pointer transition-all duration-200 shrink-0 self-center"
                      style={{
                        height: '34px',
                        padding: '0 10px',
                        borderRadius: '999px',
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#6B7280',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: '0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF2F2';
                        e.currentTarget.style.borderColor = '#FECACA';
                        e.currentTarget.style.color = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                    >
                      <Trash2 size={16} style={{ width: '16px', height: '16px' }} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Location Preview */}
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#EEF2F7] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Deliver To</div>
                  <div className="font-semibold text-sm text-[#111827]">Kathmandu, New Road (Default Location)</div>
                </div>
              </div>
              <button className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-none">Change</button>
            </div>
          </div>

          {/* RIGHT ORDER SUMMARY (30% on desktop) */}
          <div className="space-y-6">
            {/* Order Summary Card Design */}
            <div 
              className="bg-white rounded-[22px] p-[24px] border border-[#EEF2F7] sticky shadow-sm"
              style={{
                background: 'white',
                borderRadius: '22px',
                padding: '24px',
                border: '1px solid #EEF2F7',
                position: 'sticky',
                top: '100px'
              }}
            >
              {/* Summary Title */}
              <h2 
                className="text-[22px] font-[700] text-[#111827] mb-6"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111827'
                }}
              >
                Order Summary
              </h2>
              
              <div className="space-y-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-[#6B7280] text-[13px]">Subtotal ({selectedIds.size} Items)</span>
                  <span className="text-[#111827]">Rs. {selectedTotal}</span>
                </div>

              </div>


              {/* Total Section Design & Separator */}
              <div 
                className="flex items-center justify-between"
                style={{
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '18px',
                  marginTop: '18px'
                }}
              >
                <span 
                  className="text-[18px] font-[600]"
                  style={{
                    fontSize: '18px',
                    fontWeight: 600
                  }}
                >
                  Total
                </span>
                <span 
                  className="text-[30px] font-[800] text-[#111827]"
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    color: '#111827'
                  }}
                >
                  Rs. {selectedTotal}
                </span>
              </div>

              {/* Proceed To Checkout Button Design */}
              <button 
                onClick={handleCheckout}
                className="w-full h-[56px] bg-[#FFA41C] text-[#111111] rounded-[16px] text-[16px] font-[700] border border-[#FF8F00] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FFA41C]/10 mt-6"
                style={{
                  height: '56px',
                  width: '100%',
                  background: '#FFA41C',
                  color: '#111111',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: '1px solid #FF8F00',
                  transition: '0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FA8900';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFA41C';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Lucide Lock Icon for trust */}
                <Lock size={18} />
                <span>Proceed to Checkout</span>
              </button>

              {/* Trust Text Below Button */}
              <div 
                className="hidden md:block mt-6 space-y-2 text-[13px] text-[#6B7280] leading-[1.8] border-t border-gray-100 pt-4"
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.8'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span>🔒</span>
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>🚚</span>
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>↩</span>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
