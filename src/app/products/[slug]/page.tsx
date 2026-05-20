'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  PackageCheck,
  Share2,
  Play
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
  video_url?: string;
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
  const [selectedMedia, setSelectedMedia] = useState<'video' | number>(0);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sticky Footer & View More States
  const [showStickyFooter, setShowStickyFooter] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullHighlights, setShowFullHighlights] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const playYoutube = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo' }),
          '*'
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pauseYoutube = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo' }),
          '*'
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Swipe Gestures for Mobile Image Slider
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const mediaItems: Array<'video' | number> = [];
    if (product?.video_url) {
      mediaItems.push('video');
    }
    if (product?.images) {
      product.images.forEach((_, idx) => mediaItems.push(idx));
    }

    if (mediaItems.length <= 1) return;
    const currIdx = mediaItems.indexOf(selectedMedia);

    if (isLeftSwipe) {
      const nextIdx = (currIdx + 1) % mediaItems.length;
      setSelectedMedia(mediaItems[nextIdx]);
    }
    if (isRightSwipe) {
      const prevIdx = (currIdx - 1 + mediaItems.length) % mediaItems.length;
      setSelectedMedia(mediaItems[prevIdx]);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.display_name,
          text: `Check out ${product.display_name} on ${storeName}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setMessage({ text: 'Link copied to clipboard!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!priceRef.current) return;
      const priceRect = priceRef.current.getBoundingClientRect();
      // If the bottom of the price element is above the top of the viewport
      if (priceRect.bottom < 0) {
        setShowStickyFooter(true);
        document.body.setAttribute('data-hide-header', 'true');
      } else {
        setShowStickyFooter(false);
        document.body.setAttribute('data-hide-header', 'false');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeAttribute('data-hide-header');
    };
  }, [product]);

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
    if (data.video_url) {
      setSelectedMedia('video');
    } else {
      setSelectedMedia(0);
    }

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
      
      {/* Breadcrumbs - Hidden on Mobile */}
      <div className="hidden md:block bg-white border-b border-[#E5E7EB] mt-0">
        <div className="container max-w-[1440px] mx-auto px-6 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={14} />
          <Link href={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-black">{product.category}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 truncate">{product.display_name}</span>
        </div>
      </div>

      {/* Main product wrapper */}
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6 mt-[12px] md:mt-[20px]">
        
        {/* TOP ROW: IMAGE | INFO | SERVICE */}
        <div className="bg-white rounded-[20px] md:rounded-[24px] border border-[#E5E7EB] overflow-hidden mb-6 md:mb-8 p-4 md:p-6 shadow-sm">
          <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
            
            {/* Col 4: Images */}
            <div className="lg:col-span-4">
              <div 
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="w-full max-w-[320px] md:max-w-none mx-auto aspect-square rounded-[20px] bg-[#FAFAFA] border border-[#E5E7EB] overflow-hidden mb-4 group relative flex items-center justify-center select-none"
              >
                {selectedMedia === 'video' && product.video_url ? (
                  getYoutubeId(product.video_url) ? (
                    <div 
                      className="w-full h-full relative"
                      onMouseEnter={playYoutube}
                      onMouseLeave={pauseYoutube}
                    >
                      <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${getYoutubeId(product.video_url)}?enablejsapi=1&autoplay=1&mute=1&controls=1&loop=1&playlist=${getYoutubeId(product.video_url)}&playsinline=1&rel=0`}
                        title="Product Video"
                        className="w-full h-full absolute inset-0 border-0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full relative flex items-center justify-center bg-black"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <video
                        ref={videoRef}
                        src={product.video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )
                ) : product.images?.[selectedMedia as number] ? (
                  <img 
                    src={product.images[selectedMedia as number]} 
                    alt={product.display_name} 
                    className="max-h-[240px] md:max-h-[380px] object-contain transition-transform duration-700 group-hover:scale-105 pointer-events-none" 
                  />
                ) : (
                  <div className="text-gray-300">No Image</div>
                )}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 md:top-4 md:left-4 px-2.5 py-0.5 md:px-3 md:py-1 bg-[#FF6A00] text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full z-10">
                    -{discount}% OFF
                  </div>
                )}

                {/* Share button */}
                <button 
                  onClick={handleShare}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-gray-200/50 flex items-center justify-center text-gray-700 shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Share product"
                >
                  <Share2 size={14} />
                </button>

                {/* Rating Badge (Mobile Only) */}
                <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200/50 flex items-center gap-1 text-[#F59E0B] shadow-sm md:hidden">
                  <Star size={11} fill="currentColor" />
                  <span className="font-extrabold text-[11px] text-[#111827] leading-none">{calculatedAverageRating.toFixed(1)}</span>
                  {totalReviewsCount > 0 && (
                    <span className="text-[9px] text-[#6B7280] font-bold">({totalReviewsCount})</span>
                  )}
                </div>
              </div>
              
              {/* Desktop View: small thumbnail boxes */}
              <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.video_url && (
                  <button 
                    onClick={() => setSelectedMedia('video')}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-black flex-shrink-0 transition-all relative flex items-center justify-center ${
                      selectedMedia === 'video' ? 'border-[#FF6A00]' : 'border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    {getYoutubeId(product.video_url) ? (
                      <>
                        <img 
                          src={`https://img.youtube.com/vi/${getYoutubeId(product.video_url)}/mqdefault.jpg`} 
                          alt="Video Thumbnail" 
                          className="w-full h-full object-cover opacity-60" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
                          <Play size={16} fill="currentColor" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white gap-0.5 w-full h-full">
                        <Play size={16} fill="currentColor" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Video</span>
                      </div>
                    )}
                  </button>
                )}
                {product.images?.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedMedia(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-[#FAFAFA] flex-shrink-0 transition-all ${
                      selectedMedia === idx ? 'border-[#FF6A00]' : 'border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>

              {/* Mobile View: Dots Pagination indicator */}
              {((product.images?.length || 0) + (product.video_url ? 1 : 0)) > 1 && (
                <div className="flex md:hidden justify-center items-center gap-1.5 mt-3 mb-2">
                  {product.video_url && (
                    <button
                      onClick={() => setSelectedMedia('video')}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        selectedMedia === 'video' 
                          ? 'bg-[#FF6A00] w-4' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label="Go to product video"
                    />
                  )}
                  {product.images?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMedia(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        selectedMedia === idx 
                          ? 'bg-[#FF6A00] w-4' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
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
                <h1 className="text-[20px] md:text-[28px] font-[600] leading-[1.3] md:leading-[1.4] text-[#111827] tracking-[-0.2px] mb-[12px]">
                  {product.display_name}
                </h1>
                
                {/* 
                  Review Area (Desktop Only)
                */}
                <div className="hidden md:flex items-center gap-4 mb-[16px]">
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

                {/* Stock status indicator for Mobile Only */}
                <div className="md:hidden flex items-center mb-[16px]">
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${
                    product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.stock_quantity > 0 ? '● In Stock' : '● Out of Stock'}
                  </span>
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
                  Best Price Structure (Ref added for scroll tracking)
                */}
                <div ref={priceRef} className="flex flex-col gap-1 mt-[16px] mb-[20px] pb-5 border-b border-gray-100">
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-[14px] md:text-[18px] font-medium text-[#6B7280]">Rs.</span>
                    <span className="text-[28px] md:text-[42px] font-extrabold text-[#111827] leading-none tracking-tight">
                      {currentPrice}
                    </span>
                  </div>
                  {oldPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] md:text-[18px] text-[#9CA3AF] line-through font-normal">
                        Rs {oldPrice}
                      </span>
                      <span className="text-[11px] md:text-[14px] font-semibold text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-[6px]">
                        {discount}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* 
                  Variations Section
                */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mb-[20px] md:mb-[28px] p-4 md:p-5 bg-[#FAFAFA] rounded-[16px] md:rounded-[18px] border border-[#E5E7EB]">
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
                            className={`min-w-[60px] h-[38px] md:h-[42px] px-[12px] md:px-[14px] rounded-[10px] md:rounded-[12px] border bg-white font-[500] text-[13px] md:text-[14px] transition-all duration-200 cursor-pointer flex items-center justify-center ${
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

              {/* Quantity Section - Positioned above Add to Cart and Buy Now, and centered */}
              <div className="flex justify-center mb-5 mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-[#6B7280]">Qty:</span>
                  <div className="flex items-center border border-[#E5E7EB] rounded-[12px] h-[38px] md:h-[46px] overflow-hidden bg-white shrink-0">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 md:w-10 h-full flex items-center justify-center hover:bg-gray-50 text-[#6B7280] transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-10 text-center text-[14px] md:text-[16px] font-semibold text-[#111827]">{displayQuantity}</span>
                    <button 
                      onClick={() => {
                        if (displayQuantity < maxQuantity) {
                          setQuantity(displayQuantity + 1);
                        } else {
                          alert(`Maximum stock limit of ${maxQuantity} reached.`);
                        }
                      }}
                      className="w-8 md:w-10 h-full flex items-center justify-center hover:bg-gray-50 text-[#6B7280] transition-colors border-l border-gray-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 
                Buttons Buy Now & Add to Cart
              */}
              <div className="flex items-center gap-3 mt-2 w-full">
                <button 
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className="flex-1 h-[46px] md:h-[54px] rounded-[12px] md:rounded-[14px] bg-white border-[1.5px] border-[#FF6A00] text-[#FF6A00] text-[14px] md:text-[15px] font-[600] transition-colors duration-200 hover:bg-[#FFF3E6] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
                  <span>{addedToCart ? 'Added' : 'Add to Cart'}</span>
                </button>
                
                <button 
                  onClick={handleBuyNow}
                  className="flex-1 h-[46px] md:h-[54px] rounded-[12px] md:rounded-[14px] bg-[#FFA41C] border border-[#FF8F00] text-[#111111] text-[14px] md:text-[15px] font-[700] transition-colors duration-200 hover:bg-[#FA8900] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FFA41C]/10"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* WhatsApp Order Section */}
              <div className="w-full mt-3.5">
                <div className="border-t border-gray-200/80 my-3.5" />
                
                <button 
                  onClick={handleWhatsappOrder}
                  className="w-full h-[44px] md:h-[52px] rounded-[12px] md:rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] text-[#15803D] hover:text-[#166534] font-semibold flex items-center justify-center gap-2 transition-all duration-250 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.1px', fontSize: '14px' }}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.37-2.907-7.01-2.907-5.439 0-9.868 4.429-9.872 9.875-.001 1.73.453 3.422 1.32 4.924l-.995 3.635 3.737-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.2-.298.3-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Order on WhatsApp
                </button>
                
                <p className="text-[12px] md:text-[13px] text-[#6B7280] text-center mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  Need help? Chat directly with our team.
                </p>
              </div>

            </div>

            {/* Col 3: Delivery & Services Section - Hidden on Mobile */}
            <div className="hidden lg:flex lg:col-span-3 bg-white border border-[#E5E7EB] rounded-[20px] p-[22px] shadow-sm flex-col gap-[16px]">
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
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 md:p-[24px] mt-[16px] md:mt-[32px] shadow-sm">
            <h2 className="text-[18px] md:text-[22px] font-[700] text-[#111827] mb-4 md:mb-[20px]">
              Product Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] md:gap-[16px]">
              {(showFullHighlights ? product.highlights : product.highlights.slice(0, 4)).map((h, i) => (
                <div key={i} className="flex items-start gap-[10px] text-[14px] md:text-[15px] font-[500] text-[#111827]">
                  <CheckCircle2 size={16} className="text-[#15803D] shrink-0 mt-0.5" fill="#E8F5E9" />
                  <span className="leading-tight">{h}</span>
                </div>
              ))}
            </div>
            {product.highlights.length > 4 && (
              <button 
                onClick={() => setShowFullHighlights(!showFullHighlights)}
                className="mt-4 text-[13px] font-bold text-[#FF6A00] hover:text-[#E85D00] flex items-center gap-1 cursor-pointer"
              >
                <span>{showFullHighlights ? 'Show Less' : 'View More'}</span>
                <ChevronRight size={14} className={`transform transition-transform ${showFullHighlights ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* 2. PRODUCT DESCRIPTION SECTION */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 md:p-[28px] mt-[16px] md:mt-[32px] shadow-sm">
          <h2 className="text-[18px] md:text-[22px] font-[700] text-[#111827] mb-4 md:mb-[20px]">
            Product Description
          </h2>
          <div className="relative">
            <div 
              className={`max-w-[900px] text-[14px] md:text-[15px] leading-[1.8] md:leading-[1.9] font-[400] text-[#374151] whitespace-pre-line ${
                !showFullDescription && product.description.length > 300 ? 'line-clamp-[6] overflow-hidden' : ''
              }`}
            >
              {product.description}
            </div>
            {!showFullDescription && product.description.length > 300 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
          {product.description.length > 300 && (
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-3 text-[13px] font-bold text-[#FF6A00] hover:text-[#E85D00] flex items-center gap-1 cursor-pointer"
            >
              <span>{showFullDescription ? 'Show Less' : 'View More'}</span>
              <ChevronRight size={14} className={`transform transition-transform ${showFullDescription ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {/* 3. CUSTOMER REVIEWS SECTION */}
        <div id="reviews-section" className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 md:p-[24px] mt-[16px] md:mt-[32px] shadow-sm">
          <h2 className="text-[18px] md:text-[22px] font-[700] text-[#111827] mb-4 md:mb-[20px]">
            Customer Reviews ({reviews.length})
          </h2>

          {/* Top Review Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 p-4 md:p-6 bg-[#FAFAFA] border border-[#E5E7EB] rounded-[16px] mb-6 md:mb-8">
            {/* Left Side: Overall Rating */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E5E7EB] pb-4 md:pb-0 md:pr-8 text-center">
              <div className="text-[36px] md:text-[48px] font-[800] text-[#111827] leading-none mb-1.5">
                {calculatedAverageRating.toFixed(1)} <span className="text-[#F59E0B] text-[28px] md:text-[36px]">★</span>
              </div>
              <div className="text-[12px] md:text-[13px] font-[500] text-[#6B7280]">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Right Side: Rating Bars */}
            <div className="col-span-2 space-y-2 flex flex-col justify-center pt-2 md:pt-0">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starDistribution[star as 1|2|3|4|5] || 0;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                    <span className="w-12 text-[10px] md:text-[11px] font-bold text-[#6B7280] shrink-0">{star} Star</span>
                    <div className="flex-grow h-2 rounded-full bg-[#E5E7EB] overflow-hidden relative">
                      <div 
                        className="h-full rounded-full bg-[#F59E0B] transition-all" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-6 text-[10px] md:text-[11px] font-bold text-[#6B7280] text-right shrink-0">{count}</span>
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
                  <div key={review.id} className="py-[14px] md:py-[18px] border-b border-[#F3F4F6] last:border-b-0 flex gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-gray-400 font-bold text-md md:text-lg shrink-0 uppercase">
                      {review.customer_name.charAt(0)}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="text-[13px] md:text-[14px] font-[600] text-[#111827]">{review.customer_name}</div>
                        <div className="flex gap-0.5 text-[#F59E0B]">
                          {[1,2,3,4,5].map(i => (
                            <Star 
                              key={i} 
                              size={10} 
                              fill={i <= review.rating ? "#F59E0B" : "none"} 
                              stroke="#F59E0B"
                              className="md:w-3 md:h-3"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] md:text-[12px] font-[600] text-[#15803D] flex items-center gap-1">
                          ✔ Verified Purchase
                        </span>
                      </div>
                      <p className="text-[13px] md:text-[14px] leading-[1.7] md:leading-[1.8] text-[#4B5563] font-[400] whitespace-pre-line">
                        {review.comment}
                      </p>
                      <div className="text-[9px] md:text-[10px] text-[#9CA3AF] font-[500] uppercase tracking-wider">
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-[20px]">
              {recommendedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} viewMoreOption={true} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Mobile Sticky Footer */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/80 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between md:hidden transition-transform duration-300 ease-out"
        style={{ transform: showStickyFooter ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <div className="flex items-baseline leading-none">
              <span className="text-[11px] font-semibold text-[#6B7280] mr-0.5">Rs.</span>
              <span className="text-[18px] font-bold text-[#111827]">{currentPrice}</span>
            </div>
            {flashSale && (
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.15)] animate-pulse">
                🔥 Hot
              </span>
            )}
          </div>
          {oldPrice && (
            <span className="text-[11px] text-[#9CA3AF] line-through">Rs {oldPrice}</span>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2 justify-end max-w-[72%]">
          <button 
            onClick={handleWhatsappOrder}
            className="flex-[1.2] h-[42px] px-1.5 rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] flex items-center justify-center gap-1 hover:bg-[#DCFCE7] transition-all cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <svg className="w-4 h-4 fill-current shrink-0 text-[#15803D]" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.37-2.907-7.01-2.907-5.439 0-9.868 4.429-9.872 9.875-.001 1.73.453 3.422 1.32 4.924l-.995 3.635 3.737-.98zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.2-.298.3-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" fill="currentColor"/>
            </svg>
            <span className="text-[10px] font-semibold whitespace-nowrap">Order on WhatsApp</span>
          </button>
          <button 
            onClick={handleBuyNow}
            className="flex-1 h-[42px] rounded-[12px] bg-[#FFA41C] border border-[#FF8F00] text-[#111111] flex items-center justify-center hover:bg-[#FA8900] transition-colors shadow-sm shadow-[#FFA41C]/10 cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-[11px] font-bold">Buy Now</span>
          </button>
        </div>
      </div>
    </main>
  );
}
