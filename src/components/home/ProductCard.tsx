'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Heart, Eye, RefreshCw, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';
import { sendMetaCapiEvent } from '@/app/actions/metaCapi';

interface ProductCardProps {
  product: {
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
  };
  variant?: 'default' | 'flash-sale' | 'ranked';
  rank?: number;
  totalStock?: number;
  flashSaleExpiry?: string;
  isUpcoming?: boolean;
  hideAddToCart?: boolean;
  viewMoreOption?: boolean;
  priority?: boolean;
}

const CountdownTimer = ({ targetTime, isUpcoming }: { targetTime: string; isUpcoming?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetTime) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          h: Math.floor(difference / (1000 * 60 * 60)),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
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
      <span>{isUpcoming ? 'Starts in' : 'Ends in'} {timeStr}</span>
    </div>
  );
};

export default function ProductCard({ 
  product, 
  variant = 'default',
  rank,
  totalStock = 0,
  flashSaleExpiry,
  isUpcoming = false,
  hideAddToCart = false, 
  viewMoreOption = false,
  priority = false
}: ProductCardProps) {
  const { addItem } = useCart();
  const router = useRouter();
  
  const currentPrice = (product.special_price && product.special_price > 0) ? product.special_price : product.regular_price;
  const hasDiscount = !!(product.special_price && product.special_price > 0 && product.special_price < product.regular_price);
  const discountPercent = hasDiscount 
    ? Math.round(((product.regular_price - product.special_price!) / product.regular_price) * 100) 
    : 0;

  // Determine Badge Text
  let badgeText = '';
  if (hasDiscount) {
    badgeText = 'Sale';
  } else if (product.soldCount && product.soldCount > 15) {
    badgeText = 'Best Seller';
  } else if (product.rating && product.rating >= 4.7) {
    badgeText = 'Trending';
  } else {
    badgeText = 'New';
  }

  const getBadgeStyles = (text: string) => {
    switch (text.toLowerCase()) {
      case 'sale':
        return 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]';
      case 'new':
        return 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]';
      case 'best seller':
        return 'bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]';
      case 'trending':
        return 'bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      inventory_id: product.id,
      display_name: product.display_name,
      selected_variation: null,
      price: currentPrice,
      quantity: 1,
      maxQuantity: 5,
      image: product.images?.[0],
      category: product.category
    });

    // Log the cart addition event (fire-and-forget)
    try {
      const getQueryFromUrl = () => {
        if (typeof window === 'undefined') return undefined;
        const params = new URLSearchParams(window.location.search);
        return params.get('q') || undefined;
      };
      
      const searchQuery = getQueryFromUrl();
      import('@/lib/searchTracking').then(({ logCartAdd }) => {
        supabase.auth.getUser().then(({ data }) => {
          logCartAdd({
            productId: product.id,
            productName: product.display_name,
            quantity: 1,
            price: currentPrice,
            source: searchQuery ? 'search' : 'browse',
            searchQuery: searchQuery,
            userId: data?.user?.id || null
          });
        });
      });
    } catch (err) {
      console.warn('Failed to log cart add event:', err);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const expiryTime = new Date(Math.min(Date.now() + 60 * 60 * 1000, new Date(flashSaleExpiry || '').getTime())).toISOString();

    addItem({
      id: product.id,
      inventory_id: product.id,
      display_name: product.display_name,
      selected_variation: null,
      price: currentPrice,
      quantity: 1,
      maxQuantity: Math.min(5, totalStock - (product.soldCount || 0)),
      image: product.images?.[0],
      category: product.category,
      isFlashSale: true,
      flashSaleExpiry: expiryTime
    });

    router.push('/checkout');
  };
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const eventId = `wishlist_${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const productPrice = product.special_price || product.regular_price;

    // 1. Meta Pixel AddToWishlist event (client-side)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToWishlist', {
        content_name: product.display_name,
        content_ids: [product.id],
        content_type: 'product',
        value: productPrice,
        currency: 'NPR'
      }, { eventID: eventId });
    }

    // 2. Meta Conversions API AddToWishlist event (server-side)
    const triggerWishlistCapi = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await sendMetaCapiEvent({
          eventName: 'AddToWishlist',
          eventId: eventId,
          customData: {
            content_name: product.display_name,
            content_ids: [product.id],
            content_type: 'product',
            value: productPrice,
            currency: 'NPR'
          },
          userData: user ? {
            email: user.email || undefined,
            phone: user.phone || undefined
          } : undefined
        });
      } catch (err) {
        console.warn('Meta CAPI AddToWishlist tracking error:', err);
      }
    };
    triggerWishlistCapi();

    alert(`Added "${product.display_name}" to Wishlist!`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert(`Quick View: ${product.display_name}`);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert(`Compare: ${product.display_name}`);
  };

  const hasBrand = product.brand && product.brand !== 'No Brand';
  const brandSlug = hasBrand ? product.brand!.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : '';

  const isFlashSale = variant === 'flash-sale';
  const isRanked = variant === 'ranked';

  return (
    <div 
      onMouseEnter={() => router.prefetch(`/products/${product.slug}`)}
      className={`bg-white border border-[#F1F5F9] rounded-[16px] md:rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:border-[#FF6A00] group relative flex flex-col justify-between w-full p-2.5 md:p-0 ${
        isRanked ? 'h-[248px] md:h-auto' : (hideAddToCart && !viewMoreOption && !isFlashSale) ? 'h-[265px] md:h-auto' : 'h-[315px] md:h-auto'
      }`}
    >
      
      <Link href={isUpcoming ? '#' : `/products/${product.slug}`} className={`block relative shrink-0 ${isUpcoming ? 'cursor-default' : ''}`}>
        {/* Badges on top-left */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10 select-none">
          {isFlashSale && flashSaleExpiry ? (
            <CountdownTimer targetTime={flashSaleExpiry} isUpcoming={isUpcoming} />
          ) : isRanked && rank ? (
            <div className="w-5 h-5 md:w-[28px] md:h-[28px] rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF6A00] text-white flex items-center justify-center font-bold text-[10px] md:text-[12px] shadow-[0_2px_6px_rgba(255,106,0,0.3)]">
              {rank}
            </div>
          ) : (
            <span className={`${getBadgeStyles(badgeText)} px-2 py-0.5 md:px-2.5 md:py-1 rounded-[6px] text-[10px] md:text-[11px] font-bold uppercase tracking-wider shadow-[0_2px_8px_rgba(0,0,0,0.02)]`}>
              {badgeText}
            </span>
          )}
        </div>

        {/* Quick Actions (Wishlist, Quick View, Compare) - Hidden on Mobile */}
        <div className="absolute top-3 right-3 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-red-500 transition-all cursor-pointer"
            title="Add to Wishlist"
          >
            <Heart size={16} />
          </button>
          <button 
            onClick={handleQuickView}
            aria-label="Quick view product"
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-[#FF6A00] transition-all cursor-pointer"
            title="Quick View"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={handleCompare}
            aria-label="Compare product"
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-blue-500 transition-all cursor-pointer"
            title="Compare"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Product Image Area with Breathing Space */}
        <div className="h-[130px] md:h-[240px] bg-[#FAFAFA] rounded-xl md:rounded-t-[18px] md:rounded-b-none p-2.5 md:p-4 flex items-center justify-center shrink-0 overflow-hidden relative w-full">
          {product.images?.[0] ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image 
                src={product.images[0]} 
                alt={product.display_name} 
                fill
                sizes="(max-width: 768px) 150px, 240px"
                priority={priority}
                className="object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              />
            </div>
          ) : (
            <div className="text-gray-300 font-semibold text-[10px] uppercase tracking-widest">No Image</div>
          )}
        </div>
      </Link>

      {/* Product Content Area */}
      <div className="p-0 md:p-4 flex-1 flex flex-col justify-between mt-2 md:mt-0">
        <div>
          {/* Rank Badge Sold Info Row (Ranked Variant only) */}
          {isRanked && (
            <div className="flex mb-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 bg-[#FFF3E6] text-[#EA580C] text-[10px] md:text-[11px] font-semibold px-2.5 py-1 rounded-full">
                🔥 {product.soldCount || 0} Sold
              </span>
            </div>
          )}

          {/* Brand Name (Clickable) - Hidden on Mobile */}
          {hasBrand && (
            <div className="hidden md:flex flex-col gap-1.5 mt-2">
              <Link 
                href={isUpcoming ? '#' : `/brand/${brandSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[#4B5563] hover:text-[#FF6A00] transition-colors"
              >
                {product.brand}
              </Link>
              <div style={{ width: '24px', height: '2px', backgroundColor: '#E5E7EB', marginTop: '4px', marginBottom: '6px' }} />
            </div>
          )}

          {/* Product Name (Max 2 lines) */}
          <Link href={isUpcoming ? '#' : `/products/${product.slug}`} className={isUpcoming ? 'cursor-default pointer-events-none' : ''}>
            <h3 className="text-[#111827] text-[13px] md:text-[15px] font-semibold leading-[1.4] tracking-tight line-clamp-2 hover:text-[#FF6A00] transition-colors h-[36px] md:h-[42px] overflow-hidden mt-1 mb-1">
              {product.display_name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Flash Sale Sold Progress Info */}
          {isFlashSale && (
            <div className="mb-2 shrink-0">
              <div className="flex justify-between items-center text-[10px] md:text-[11px] text-[#4B5563] font-semibold">
                <span>🔥 {product.soldCount || 0} sold today</span>
              </div>
              <div className="w-full h-[3.5px] bg-[#F1F5F9] rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((product.soldCount || 0) / (totalStock || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Price & Review Side-by-Side Flex */}
          <div className="flex flex-col gap-0.5 mt-1 mb-2 shrink-0">
            <div className="flex items-baseline flex-wrap justify-between w-full">
              <div className="flex items-baseline">
                <span className="text-[12px] font-semibold text-[#6B7280] mr-0.5">Rs.</span>
                <span className="text-[16px] md:text-[17px] font-bold text-[#111827] leading-[1.2]">
                  {isUpcoming ? '***' : currentPrice}
                </span>
              </div>
              
              {/* Review Badge */}
              <div className="flex items-center gap-0.5 text-[10px] md:text-[12px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full shrink-0 border border-[#FEF3C7]">
                <Star size={10} fill="#D97706" stroke="#D97706" className="md:w-3 md:h-3" />
                <span>
                  {product.rating ? product.rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] md:text-[12px] text-[#9CA3AF] line-through font-normal">
                  Rs. {product.regular_price}
                </span>
                <span className="text-[10px] md:text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded-[4px] tracking-wide">
                  {discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button (Default Variant) */}
          {variant === 'default' && !hideAddToCart && !viewMoreOption && (
            <button 
              onClick={handleAddToCart}
              className="w-full h-[36px] md:h-[42px] rounded-[10px] md:rounded-[12px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF3E6] font-bold text-[13px] md:text-[14px] flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm shrink-0"
            >
              <ShoppingCart size={14} className="md:w-4 md:h-4" />
              <span>Add to Cart</span>
            </button>
          )}

          {/* View More Link */}
          {variant === 'default' && viewMoreOption && (
            <Link 
              href={`/products/${product.slug}`}
              className="w-full h-[36px] md:h-[42px] rounded-[10px] md:rounded-[12px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF3E6] font-bold text-[13px] md:text-[14px] flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm shrink-0"
            >
              <span>View More</span>
            </Link>
          )}

          {/* Buy Now Button (Flash Sale Variant) */}
          {isFlashSale && (
            <button 
              onClick={handleBuyNow}
              disabled={isUpcoming}
              className={`w-full font-bold text-[13px] h-[36px] md:h-[40px] rounded-[10px] md:rounded-[12px] transition-all duration-300 flex items-center justify-center cursor-pointer border-none shrink-0 ${
                isUpcoming 
                  ? 'bg-gray-150 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#FFA41C] text-[#111111] hover:bg-[#FA8900] shadow-sm shadow-[#FFA41C]/10'
              }`}
            >
              {isUpcoming ? 'Dropping Soon' : 'Buy Now'}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
