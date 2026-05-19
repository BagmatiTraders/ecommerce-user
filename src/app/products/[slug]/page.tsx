'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/store/useCart';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/home/ProductCard';
import { 
  ShoppingCart, 
  Star, 
  ChevronLeft, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Clock,
  BadgeCheck,
  Lock,
  PackageCheck
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  inventory_id: string;
  display_name: string;
  slug: string;
  description: string;
  regular_price: number;
  special_price: number;
  stock_quantity: number;
  category: string;
  images: string[];
  rating: number;
  reviews_count: number;
  variations?: any[];
  highlights?: string[];
  brand?: string;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  
  // Gallery & Selection State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // WhatsApp Settings State
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [storeName, setStoreName] = useState('Bagmati Traders');
  const [currency, setCurrency] = useState('Rs');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: waData } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'whatsapp_settings')
          .maybeSingle();
        
        if (waData?.value?.phone_number) {
          setWhatsappPhone(waData.value.phone_number);
        }

        const { data: storeData } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'store_settings')
          .maybeSingle();

        if (storeData?.value?.store_name) {
          setStoreName(storeData.value.store_name);
        }
        if (storeData?.value?.currency) {
          setCurrency(storeData.value.currency);
        }
      } catch (err) {
        console.error('Error fetching settings for WhatsApp button:', err);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (slug) fetchProduct();
    checkUser();
  }, [slug]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ecommerce_products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setProduct(data);

    // Auto-select if only one variation exists
    if (data.variations && data.variations.length === 1) {
      setSelectedVariation(data.variations[0]);
    }

    // Fetch Reviews
    const reviewsRes = await supabase
      .from('ecommerce_reviews')
      .select('*')
      .eq('product_id', data.id)
      .order('created_at', { ascending: false });
    setReviews(reviewsRes.data || []);

    // Fetch Recommended (Same category, different product)
    const { data: recs } = await supabase
      .from('ecommerce_products')
      .select('*')
      .eq('category', data.category)
      .neq('id', data.id)
      .limit(5);
    setRecommendedProducts(recs || []);

    // Fetch active Flash Sales for this product
    const now = new Date().toISOString();
    const { data: flashData } = await supabase
      .from('store_flash_sales')
      .select('*')
      .eq('product_id', data.id)
      .eq('is_active', true)
      .lt('start_time', now)
      .gt('end_time', now);
      
    if (flashData) {
      setFlashSales(flashData);
    }

    setLoading(false);
  };

  const CountdownTimer = ({ endTime }: { endTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

    useEffect(() => {
      const calculateTimeLeft = () => {
        const difference = +new Date(endTime) - +new Date();
        if (difference > 0) {
          setTimeLeft({
            d: Math.floor(difference / (1000 * 60 * 60 * 24)),
            h: Math.floor((difference / (1000 * 60 * 60)) % 24),
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
    }, [endTime]);

    if (!timeLeft) return null;

    return (
      <div className="flex items-center gap-2 text-xs font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
        <Clock size={14} />
        <span>Ends in: {timeLeft.d}d {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s</span>
      </div>
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      alert(`Please select an option before adding to cart.`);
      return;
    }

    const variationName = selectedVariation ? `${selectedVariation.name}: ${selectedVariation.value}` : '';
    const activeFlashSale = flashSales.find(fs => fs.sold_qty < fs.total_stock && (!fs.variation_name || fs.variation_name === variationName));
    
    let finalPrice = selectedVariation ? (selectedVariation.special_price || selectedVariation.price) : (product.special_price || product.regular_price);
    if (activeFlashSale) {
      finalPrice = activeFlashSale.flash_price;
    }
    
    const finalInventoryId = selectedVariation?.inventory_id || product.inventory_id;
    const maxItemQuantity = activeFlashSale ? Math.min(5, activeFlashSale.total_stock - activeFlashSale.sold_qty) : (product ? Math.min(5, product.stock_quantity) : 5);
    
    const expiryTime = activeFlashSale 
      ? new Date(Math.min(Date.now() + 60 * 60 * 1000, new Date(activeFlashSale.end_time).getTime())).toISOString()
      : undefined;

    addItem({
      id: product.id,
      inventory_id: finalInventoryId,
      display_name: product.display_name + (variationName ? ` (${variationName})` : ''),
      selected_variation: variationName,
      price: finalPrice,
      quantity: Math.min(quantity, Math.max(1, maxItemQuantity)),
      maxQuantity: maxItemQuantity,
      image: product.images?.[0],
      category: product.category,
      isFlashSale: !!activeFlashSale,
      flashSaleExpiry: expiryTime
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = () => {
    if (product?.variations && product.variations.length > 0 && !selectedVariation) {
      alert(`Please select an option before buying.`);
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[96px] select-none">
      <Header />
      <div className="container max-w-[1440px] mx-auto px-6 animate-pulse space-y-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-gray-200/50"></div>
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-gray-200/50 rounded-xl"></div>
            <div className="h-6 w-1/4 bg-gray-200/50 rounded-xl"></div>
            <div className="h-20 w-full bg-gray-200/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-6 pt-32 bg-[#FAFAFA] select-none">
      <Header />
      <h1 className="text-2xl font-bold text-[#111827]">Product not found</h1>
      <Link href="/" className="text-[#FF6A00] font-semibold underline">Go back home</Link>
    </div>
  );

  const variationName = selectedVariation ? `${selectedVariation.name}: ${selectedVariation.value}` : '';
  const flashSale = flashSales.find(fs => fs.sold_qty < fs.total_stock && (!fs.variation_name || fs.variation_name === variationName));

  let currentPrice = selectedVariation ? (selectedVariation.special_price || selectedVariation.price) : (product.special_price || product.regular_price);
  let oldPrice = selectedVariation ? (selectedVariation.special_price ? selectedVariation.price : null) : (product.special_price ? product.regular_price : null);
  
  let maxQuantity = 5;
  if (product) {
    maxQuantity = Math.min(5, product.stock_quantity);
  }
  
  if (flashSale) {
    oldPrice = currentPrice;
    currentPrice = flashSale.flash_price;
    maxQuantity = Math.min(maxQuantity, flashSale.total_stock - flashSale.sold_qty);
  }
  
  const displayQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const discount = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;

  // Reviews calculations
  const totalReviewsCount = reviews.length;
  const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating);
    if (rounded >= 1 && rounded <= 5) {
      starDistribution[rounded as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });

  const calculatedAverageRating = totalReviewsCount > 0
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1))
    : 5.0;

  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

  const handleWhatsappOrder = () => {
    if (!product) return;
    
    const productName = product.display_name + (selectedVariation ? ` (${selectedVariation.name}: ${selectedVariation.value})` : '');
    const productId = product.id.slice(0, 8).toUpperCase();
    const productUrl = `${window.location.origin}/products/${product.slug}`;
    
    const greeting = `Hello ${storeName} \u{1F44B}`;
    const intent = `I would like to order this product.`;
    const prodLine = `\u{1F6CD} Product: ${productName}`;
    const idLine = `\u{1F3F7} Product ID: ${productId}`;
    const priceLine = `\u{1F4B0} Price: ${currency} ${currentPrice}`;
    const qtyLine = `\u{1F522} Quantity: ${displayQuantity}`;
    const linkSection = `\u{1F517} Product Link:\n${productUrl}`;
    const footerText = `Please confirm availability and order process.`;

    const text = `${greeting}\n\n${intent}\n\n${prodLine}\n${idLine}\n${priceLine}\n${qtyLine}\n\n${linkSection}\n\n${footerText}`;
    
    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
    
    if (!cleanPhone) {
      alert('WhatsApp phone number is not configured by the store administrator.');
      return;
    }
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-20 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Global Notification */}
      {message.text && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'error' ? 'bg-red-600 text-white' : 'bg-black text-white'
        }`}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[#E5E7EB] mt-0">
        <div className="container max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={14} />
          <Link href={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-black">{product.category}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 truncate">{product.display_name}</span>
        </div>
      </div>

      {/* Main product wrapper - margin-top 20px */}
      <div className="container max-w-[1440px] mx-auto px-6 mt-[20px]">
        
        {/* TOP ROW: IMAGE | INFO | SERVICE */}
        <div className="bg-white rounded-[24px] border border-[#E5E7EB] overflow-hidden mb-8 p-6 shadow-sm">
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Col 4: Images */}
            <div className="lg:col-span-4">
              <div className="aspect-square rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] overflow-hidden mb-4 group relative flex items-center justify-center">
                {product.images?.[currentImageIndex] ? (
                  <img 
                    src={product.images[currentImageIndex]} 
                    alt={product.display_name} 
                    className="max-h-[380px] object-contain transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="text-gray-300">No Image</div>
                )}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-[#FF6A00] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    -{discount}% OFF
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.images?.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-[#FAFAFA] flex-shrink-0 transition-all ${
                      currentImageIndex === idx ? 'border-[#FF6A00]' : 'border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Col 5: Product details & actions */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <div>
                {flashSale && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-[#FF6A00] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                      <Zap size={12} fill="currentColor" /> Flash Sale
                    </span>
                  </div>
                )}
                
                {/* Brand Name (Clickable) */}
                {product.brand && product.brand !== 'No Brand' && (
                  <div className="mb-2 flex flex-col gap-1.5">
                    <Link 
                      href={`/brand/${product.brand.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`}
                      className="text-[13px] font-[700] tracking-[1px] uppercase text-[#374151] hover:text-[#FF6A00] transition-colors inline-block"
                    >
                      {product.brand}
                    </Link>
                    <div style={{ width: '24px', height: '2px', backgroundColor: '#E5E7EB', marginTop: '4px', marginBottom: '6px' }} />
                  </div>
                )}

                {/* 
                  Product Title:
                  - font-size: 28px; font-weight: 600; line-height: 1.4; color: #111827; letter-spacing: -0.2px;
                  - Title -> Review spacing: 12px
                */}
                <h1 className="text-[28px] font-[600] leading-[1.4] text-[#111827] tracking-[-0.2px] mb-[12px]">
                  {product.display_name}
                </h1>
                
                {/* 
                  Review Area:
                  - Review -> Price Spacing: 18px
                */}
                <div className="flex items-center gap-4 mb-[18px]">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    <Star size={14} fill="currentColor" />
                    <span className="font-bold text-xs">{calculatedAverageRating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs font-medium text-[#6B7280]">
                    {totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}
                  </div>
                  <div className="text-xs font-semibold text-green-600">
                    {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>

                {flashSale && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <CountdownTimer endTime={flashSale.end_time} />
                      <div className="text-[10px] font-black uppercase text-amber-800">
                        {flashSale.sold_qty} Sold
                      </div>
                    </div>
                    <div>
                      <div className="w-full h-2 bg-amber-200/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] rounded-full"
                          style={{ width: `${Math.min(100, (flashSale.sold_qty / flashSale.total_stock) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 
                  Best Price Structure:
                  - Currency size: 18px font-weight: 500 color: #6B7280;
                  - Current Price: font-size: 42px font-weight: 800 line-height: 1 color: #111827;
                  - Old Price: font-size: 18px color: #9CA3AF line-through
                  - Price Spacing: margin-top: 20px; margin-bottom: 24px; (Price -> Variations: 24px)
                */}
                <div className="flex flex-col gap-2 mt-[20px] mb-[24px]">
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-[18px] font-[500] text-[#6B7280]">Rs</span>
                    <span className="text-[42px] font-[800] text-[#111827] leading-none tracking-tight">
                      {currentPrice}
                    </span>
                  </div>
                  {oldPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] text-[#9CA3AF] line-through font-[400]">
                        Rs {oldPrice}
                      </span>
                      <span className="text-[14px] font-[600] text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-[6px]">
                        {discount}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* 
                  Quantity Selector Style:
                  - height: 46px; border-radius: 12px; border: 1px solid #E5E7EB;
                */}
                <div className="mb-[24px]">
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Quantity</div>
                    <div className="flex items-center border border-[#E5E7EB] rounded-[12px] h-[46px] overflow-hidden bg-white">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-[#6B7280] transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center text-[16px] font-[600] text-[#111827]">{displayQuantity}</span>
                      <button 
                        onClick={() => {
                          if (displayQuantity < maxQuantity) {
                            setQuantity(displayQuantity + 1);
                          } else {
                            alert(`Maximum stock limit of ${maxQuantity} reached.`);
                          }
                        }}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-[#6B7280] transition-colors border-l border-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 
                  Variations Button Design:
                  - min-width: 64px; height: 42px; padding: 0 14px; border-radius: 12px; border: 1px solid #E5E7EB; background: white; font-size: 14px; font-weight: 500; color: #111827; transition: 0.2s ease;
                  - Active: border-color: #FF6A00; background: #FFF3E6; color: #EA580C; font-weight: 600;
                  - Hover: border-color: #FF6A00;
                  - Variations -> Buttons Spacing: 28px
                */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-[28px] p-5 bg-[#FAFAFA] rounded-[18px] border border-[#E5E7EB]">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">
                        Select Option: <span className="text-[#111827]">{selectedVariation ? (selectedVariation.value || selectedVariation.name) : 'Select One'}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((v: any, idx: number) => {
                        const isActive = selectedVariation === v;
                        return (
                          <button 
                            key={v.id || idx}
                            onClick={() => setSelectedVariation(v)}
                            className={`min-w-[64px] h-[42px] px-[14px] rounded-[12px] border bg-white font-[500] text-[14px] transition-all duration-200 cursor-pointer flex items-center justify-center ${
                              isActive 
                                ? 'border-[#FF6A00] bg-[#FFF3E6] text-[#EA580C] font-[600]' 
                                : 'border-[#E5E7EB] text-[#111827] hover:border-[#FF6A00]'
                            }`}
                          >
                            <span>{v.value || v.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 
                Buttons Buy Now & Add to Cart Layout:
                - Add to Cart: background white, border 1.5px #FF6A00, text #FF6A00, radius 14px, size 15px, weight 600, hover #FFF3E6
                - Buy Now: background #FF6A00, text white, radius 14px, size 15px, weight 700, hover #E85D00
                - Shared properties: height 54px, flex: 1
                - Between buttons gap: 12px
              */}
              <div className="flex items-center gap-[12px] mt-2 w-full">
                <button 
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className="flex-1 h-[54px] rounded-[14px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] text-[15px] font-[600] transition-colors duration-200 hover:bg-[#FFF3E6] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart size={18} />
                  <span>{addedToCart ? 'Added' : 'Add to Cart'}</span>
                </button>
                
                <button 
                  onClick={handleBuyNow}
                  className="flex-1 h-[54px] rounded-[14px] bg-[#FFA41C] border border-[#FF8F00] text-[#111111] text-[15px] font-[700] transition-colors duration-200 hover:bg-[#FA8900] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FFA41C]/10"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* WhatsApp Order Section */}
              <div className="w-full mt-4">
                <div className="border-t border-gray-200/80 my-4" />
                
                <button 
                  onClick={handleWhatsappOrder}
                  className="w-full h-[52px] rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] text-[#15803D] hover:text-[#166534] font-semibold flex items-center justify-center gap-2.5 transition-all duration-250 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.1px', fontSize: '15px' }}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.37-2.907-7.01-2.907-5.439 0-9.868 4.429-9.872 9.875-.001 1.73.453 3.422 1.32 4.924l-.995 3.635 3.737-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.2-.298.3-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Order on WhatsApp
                </button>
                
                <p className="text-[13px] text-[#6B7280] text-center mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  Need help? Chat directly with our team.
                </p>
              </div>

            </div>

            {/* Col 3: Delivery & Services Section */}
            <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-[20px] p-[22px] shadow-sm flex flex-col gap-[16px]">
              <h3 className="text-[18px] font-[700] text-[#111827] mb-[2px]">
                Delivery & Services
              </h3>
              
              <div className="flex flex-col">
                {/* 1. Standard Delivery */}
                <div className="flex gap-[14px] py-[14px] border-b border-[#F3F4F6]">
                  <div className="shrink-0 mt-0.5">
                    <Truck size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Standard Delivery
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      Est. delivery within 2–4 business days
                    </p>
                  </div>
                </div>

                {/* 2. Express Delivery */}
                <div className="flex gap-[14px] py-[14px] border-b border-[#F3F4F6]">
                  <div className="shrink-0 mt-0.5">
                    <Zap size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Express Delivery
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      Same-day delivery available in selected areas
                    </p>
                  </div>
                </div>

                {/* 3. Easy Return */}
                <div className="flex gap-[14px] py-[14px] border-b border-[#F3F4F6]">
                  <div className="shrink-0 mt-0.5">
                    <RotateCcw size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Easy Return
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      Instant replacement for damaged products
                    </p>
                  </div>
                </div>

                {/* 4. Verified Merchant */}
                <div className="flex gap-[14px] py-[14px] border-b border-[#F3F4F6]">
                  <div className="shrink-0 mt-0.5">
                    <BadgeCheck size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Verified Merchant
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      Trusted seller with quality assurance
                    </p>
                  </div>
                </div>

                {/* 5. Secure Payment */}
                <div className="flex gap-[14px] py-[14px] border-b border-[#F3F4F6]">
                  <div className="shrink-0 mt-0.5">
                    <Lock size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Secure Payment
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      All transactions are securely encrypted
                    </p>
                  </div>
                </div>

                {/* 6. Cash on Delivery */}
                <div className="flex gap-[14px] py-[14px]">
                  <div className="shrink-0 mt-0.5">
                    <PackageCheck size={20} className="text-[#FF6A00]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-[600] text-[#111827] leading-none mb-1.5">
                      Cash on Delivery
                    </h4>
                    <p className="text-[13px] font-[400] text-[#6B7280] leading-[1.6]">
                      Pay easily when your order arrives
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 1. PRODUCT HIGHLIGHTS SECTION */}
        {product.highlights && product.highlights.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-[24px] mt-[32px] shadow-sm">
            <h2 className="text-[22px] font-[700] text-[#111827] mb-[20px]">
              Product Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {product.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-[10px] text-[15px] font-[500] text-[#111827]">
                  <CheckCircle2 size={16} className="text-[#15803D] shrink-0" fill="#E8F5E9" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. PRODUCT DESCRIPTION SECTION */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-[28px] mt-[32px] shadow-sm">
          <h2 className="text-[22px] font-[700] text-[#111827] mb-[20px]">
            Product Description
          </h2>
          <div className="max-w-[900px] text-[15px] leading-[1.9] font-[400] text-[#374151] mb-[18px] whitespace-pre-line">
            {product.description}
          </div>
        </div>

        {/* 3. CUSTOMER REVIEWS SECTION */}
        <div id="reviews-section" className="bg-white border border-[#E5E7EB] rounded-[20px] p-[24px] mt-[32px] shadow-sm">
          <h2 className="text-[22px] font-[700] text-[#111827] mb-[20px]">
            Customer Reviews ({reviews.length})
          </h2>

          {/* Top Review Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-[#FAFAFA] border border-[#E5E7EB] rounded-[16px] mb-8">
            {/* Left Side: Overall Rating */}
            <div className="flex flex-col items-center justify-center md:border-r border-[#E5E7EB] md:pr-8 text-center">
              <div className="text-[48px] font-[800] text-[#111827] leading-none mb-2">
                {calculatedAverageRating.toFixed(1)} <span className="text-[#F59E0B] text-[36px]">★</span>
              </div>
              <div className="text-[13px] font-[500] text-[#6B7280]">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Right Side: Rating Bars */}
            <div className="col-span-2 space-y-2.5 flex flex-col justify-center">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starDistribution[star as 1|2|3|4|5] || 0;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                    <span className="w-10 text-[11px] font-bold text-[#6B7280] shrink-0">{star} Star</span>
                    <div className="flex-grow h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden relative">
                      <div 
                        className="h-full rounded-full bg-[#F59E0B] transition-all" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-[11px] font-bold text-[#6B7280] text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-0">
            {paginatedReviews.length > 0 ? (
              <div className="space-y-0">
                {paginatedReviews.map((review) => (
                  <div key={review.id} className="py-[18px] border-b border-[#F3F4F6] last:border-b-0 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-gray-400 font-bold text-lg shrink-0 uppercase">
                      {review.customer_name.charAt(0)}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <div className="text-[14px] font-[600] text-[#111827]">{review.customer_name}</div>
                        <div className="flex gap-0.5 text-[#F59E0B]">
                          {[1,2,3,4,5].map(i => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i <= review.rating ? "#F59E0B" : "none"} 
                              stroke="#F59E0B"
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-[600] text-[#15803D] flex items-center gap-1">
                          ✔ Verified Purchase
                        </span>
                      </div>
                      <p className="text-[14px] leading-[1.8] text-[#4B5563] font-[400] whitespace-pre-line">
                        {review.comment}
                      </p>
                      <div className="text-[10px] text-[#9CA3AF] font-[500] uppercase tracking-wider">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#F3F4F6] mt-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] hover:border-black flex items-center justify-center disabled:opacity-40 transition-all text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentPage(i + 1);
                          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                          currentPage === i + 1
                            ? 'bg-[#FF6A00] text-white border border-[#FF6A00]'
                            : 'bg-white border border-[#E5E7EB] hover:border-black text-slate-700 cursor-pointer'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] hover:border-black flex items-center justify-center disabled:opacity-40 transition-all text-slate-600 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#9CA3AF]">
                <Star size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold uppercase tracking-wider">No reviews yet</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. RECOMMENDED PRODUCTS SECTION */}
        {recommendedProducts.length > 0 && (
          <div className="mt-[48px] pt-8 border-t border-[#E5E7EB]">
            <h2 className="text-[22px] font-[700] text-[#111827] mb-[20px]">
              You May Also Like
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px]">
              {recommendedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
