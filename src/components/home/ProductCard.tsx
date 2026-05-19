'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Heart, Eye, RefreshCw, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/store/useCart';

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
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  const currentPrice = product.special_price || product.regular_price;
  const hasDiscount = product.special_price && product.special_price < product.regular_price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.regular_price - product.special_price!) / product.regular_price) * 100) 
    : 0;

  // Determine Badge
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
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="bg-white border border-[#EEF2F7] rounded-[16px] md:rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:border-[#FF6A00] group relative flex flex-col justify-between w-full h-[315px] md:h-auto p-2.5 md:p-0">
      
      <Link href={`/products/${product.slug}`} className="block relative shrink-0">
        {/* Badges on top-left - smaller on mobile */}
        <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 z-10 select-none">
          <span className="bg-[#FFF3E6] text-[#EA580C] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-[11px] font-[700] uppercase tracking-wide shadow-sm">
            {badgeText}
          </span>
        </div>

        {/* Quick Actions (Wishlist, Quick View, Compare) - Hidden on Mobile */}
        <div className="absolute top-3 right-3 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={handleWishlist}
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-red-500 transition-all cursor-pointer"
            title="Add to Wishlist"
          >
            <Heart size={16} />
          </button>
          <button 
            onClick={handleQuickView}
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-[#FF6A00] transition-all cursor-pointer"
            title="Quick View"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={handleCompare}
            className="w-9 h-9 rounded-full bg-white text-gray-600 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:text-blue-500 transition-all cursor-pointer"
            title="Compare"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Product Image Area: 120px height on mobile, rounded container wrapper */}
        <div className="h-[120px] md:h-[240px] bg-[#FAFAFA] rounded-xl md:rounded-none p-2 md:p-4 flex items-center justify-center shrink-0 overflow-hidden relative">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.display_name} 
              loading="lazy"
              className="max-w-full max-h-[100px] md:max-h-[190px] object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            />
          ) : (
            <div className="text-gray-300 font-semibold text-[10px] uppercase tracking-widest">No Image</div>
          )}
        </div>
      </Link>

      {/* Product Content Area */}
      <div className="p-0 md:p-4 flex-1 flex flex-col justify-between mt-2 md:mt-0">
        <div>
          {/* Brand Name (Clickable) - Hidden on Mobile */}
          {hasBrand && (
            <div className="hidden md:flex flex-col gap-1.5 mt-3">
              <Link 
                href={`/brand/${brandSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-[700] tracking-[1.5px] uppercase text-[#4B5563] hover:text-[#FF6A00] transition-colors"
              >
                {product.brand}
              </Link>
              <div style={{ width: '24px', height: '2px', backgroundColor: '#E5E7EB', marginTop: '4px', marginBottom: '6px' }} />
            </div>
          )}

          {/* Product Name (Max 2 lines) */}
          <Link href={`/products/${product.slug}`}>
            <h3 
              className="text-[#111827] leading-[1.3] md:leading-[1.5] line-clamp-2 hover:text-[#FF6A00] transition-colors text-[13px] md:text-[15px] font-semibold"
              style={{ 
                minHeight: '34px',
                maxHeight: '34px',
                marginTop: '2px'
              }}
            >
              {product.display_name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price & Review Side-by-Side Flex */}
          <div className="flex flex-col gap-0.5 mt-1 mb-2 shrink-0">
            <div className="flex items-baseline flex-wrap justify-between w-full">
              <div className="flex items-baseline leading-none">
                <span className="text-[11px] md:text-[13px] font-semibold text-[#6B7280] mr-0.5">Rs.</span>
                <span className="text-[16px] md:text-[24px] font-bold md:font-[800] text-[#111827] leading-none tracking-tight">
                  {currentPrice}
                </span>
              </div>
              
              {/* Review Badge */}
              <div className="flex items-center gap-0.5 text-[10px] md:text-[13px] font-bold text-[#F59E0B] bg-[#FFFBEB] px-1.5 py-0.5 rounded-full shrink-0 border border-[#FEF3C7]/40">
                <Star size={10} fill="#F59E0B" stroke="#F59E0B" className="md:w-[13px] md:h-[13px]" />
                <span>
                  {product.rating ? product.rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] md:text-[11px] text-[#9CA3AF] line-through font-[400]">
                  Rs {product.regular_price}
                </span>
                <span className="text-[10px] md:text-[11px] font-[700] text-[#15803D] bg-[#DCFCE7] px-1 py-0.2 rounded">
                  {discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className="w-full h-[36px] md:h-[42px] rounded-[10px] md:rounded-[12px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF3E6] font-bold text-[13px] md:text-[14px] flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm shrink-0"
          >
            <ShoppingCart size={14} className="md:w-4 md:h-4" />
            <span>Add to Cart</span>
          </button>
        </div>

      </div>

    </div>
  );
}
