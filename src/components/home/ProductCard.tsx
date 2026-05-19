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
    /* Card Design: background white, border, radius 18px, transition all 0.3s ease */
    <div className="bg-white border border-[#EEF2F7] rounded-[18px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)] hover:border-[#FF6A00] group relative flex flex-col justify-between">
      
      <Link href={`/products/${product.slug}`} className="block relative">
        {/* Badges on top-left */}
        <div className="absolute top-3 left-3 z-10 select-none">
          <span className="bg-[#FFF3E6] text-[#EA580C] px-2.5 py-1 rounded-full text-[11px] font-[700] uppercase tracking-wide shadow-sm">
            {badgeText}
          </span>
        </div>

        {/* Quick Actions (Wishlist, Quick View, Compare) - Floating Icons top-right */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

        {/* 
          Product Image Area:
          - height: 240px;
          - background: #FAFAFA;
          - padding: 16px;
          - Image size rule: max-width 100%, max-height 190px, object-fit contain
        */}
        <div className="h-[240px] bg-[#FAFAFA] p-4 flex items-center justify-center shrink-0">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.display_name} 
              loading="lazy"
              className="max-w-full max-h-[190px] object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-gray-300 font-semibold text-xs uppercase tracking-widest">No Image</div>
          )}
        </div>
      </Link>

      {/* Product Content Area: Padding 16px, flex-col, gap 10px */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Brand Name (Clickable) */}
          {hasBrand && (
            <div className="mt-3 flex flex-col gap-1.5">
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

          {/* Product Name: font-size 15px, weight 500, line-height 1.5, min-height 48px, max 2 lines */}
          <Link href={`/products/${product.slug}`}>
            <h3 
              className="text-[#111827] leading-[1.5] line-clamp-2 hover:text-[#FF6A00] transition-colors"
              style={{ 
                fontSize: '15px', 
                fontWeight: 500, 
                minHeight: '48px',
                marginTop: hasBrand ? '0px' : '12px'
              }}
            >
              {product.display_name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price & Review Side-by-Side Flex Row */}
          <div className="flex items-center justify-between gap-2 mt-2 mb-3">
            {/* Price Design */}
            <div className="flex flex-col">
              <div className="flex items-baseline leading-none">
                <span className="text-[13px] font-[500] text-[#6B7280] mr-0.5">Rs</span>
                <span className="text-[24px] font-[800] text-[#111827] leading-none tracking-tight">
                  {currentPrice}
                </span>
              </div>
              
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-[#9CA3AF] line-through font-[400]">
                    Rs {product.regular_price}
                  </span>
                  <span className="text-[11px] font-[600] text-[#15803D]">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Review Design */}
            <div className="flex items-center gap-1 text-[13px] font-[600] text-[#F59E0B] bg-[#FFFBEB] px-2 py-1 rounded-lg border border-[#FEF3C7] shrink-0">
              <Star size={13} fill="#F59E0B" stroke="#F59E0B" />
              <span>
                {product.rating ? product.rating.toFixed(1) : '5.0'}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className="w-full h-[42px] rounded-[12px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF3E6] font-[600] text-[14px] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-sm shadow-[#FF6A00]/5"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </button>
        </div>

      </div>

    </div>
  );
}
