'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CarouselImage {
  id: string;
  image_url: string;
  mobile_image_url?: string;
  link: string;
  sort_order: number;
}

export default function Carousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Swipe & Drag States
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchCurrentX, setTouchCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen size detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('store_carousels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setImages(data);
      }
      setLoading(false);
    };

    fetchImages();
  }, []);

  const nextSlide = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  const prevSlide = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  // Restart Auto Slide timer (Mobile & Desktop)
  const resetAutoSlide = useCallback(() => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    if (images.length > 1) {
      autoSlideTimerRef.current = setInterval(nextSlide, 5000);
    }
  }, [images.length, nextSlide]);

  useEffect(() => {
    resetAutoSlide();
    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [images.length, resetAutoSlide]);

  // Swipe / Drag Handlers (Desktop & Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchCurrentX(e.targetTouches[0].clientX);
    setIsDragging(true);
    if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setTouchCurrentX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const diffX = touchStartX - touchCurrentX;
    if (diffX > 50) {
      nextSlide();
    } else if (diffX < -50) {
      prevSlide();
    }
    setIsDragging(false);
    setTouchStartX(0);
    setTouchCurrentX(0);
    resetAutoSlide();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (images.length <= 1) return;
    setTouchStartX(e.clientX);
    setTouchCurrentX(e.clientX);
    setIsDragging(true);
    if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTouchCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    const diffX = touchStartX - touchCurrentX;
    if (diffX > 50) {
      nextSlide();
    } else if (diffX < -50) {
      prevSlide();
    }
    setIsDragging(false);
    setTouchStartX(0);
    setTouchCurrentX(0);
    resetAutoSlide();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTouchStartX(0);
      setTouchCurrentX(0);
      resetAutoSlide();
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    const diffX = Math.abs(touchStartX - touchCurrentX);
    if (diffX > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (loading) {
    return (
      <div 
        className="w-full max-w-[1440px] mx-auto mt-[12px] md:mt-[20px] mb-[22px] md:mb-[32px] bg-gray-50 rounded-[18px] md:rounded-[20px] animate-pulse flex items-center justify-center border border-gray-100 h-[380px] md:h-[400px]" 
        style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}
      >
        <span className="text-gray-400 font-semibold uppercase tracking-widest text-xs">Loading Banners...</span>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const getImageUrl = (img: CarouselImage) => {
    if (isMobile && img.mobile_image_url) {
      return img.mobile_image_url;
    }
    return img.image_url;
  };

  // Mobile View Render: Snap Slider with Next-Slide Peeking (88% width)
  if (isMobile) {
    const dragOffset = isDragging ? touchCurrentX - touchStartX : 0;
    return (
      <div className="w-full mt-[12px] mb-[22px] relative overflow-hidden select-none">
        <div 
          className="w-full flex gap-3"
          style={{
            transform: `translateX(calc(16px - ${currentIndex} * (88% + 12px) + ${dragOffset}px))`,
            transitionProperty: 'transform',
            transitionDuration: isDragging ? '0ms' : '400ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
            touchAction: 'pan-y'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((img, index) => (
            <div 
              key={img.id}
              className="w-[88%] shrink-0 rounded-[18px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100/50 relative aspect-[4/5] h-auto"
            >
              {img.link ? (
                <Link href={img.link} onClick={handleLinkClick} className="block w-full h-full relative cursor-pointer">
                  <img 
                    src={getImageUrl(img)} 
                    alt={`Slide ${index + 1}`} 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </Link>
              ) : (
                <img 
                  src={getImageUrl(img)} 
                  alt={`Slide ${index + 1}`} 
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Custom Mobile Active Indicators */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  resetAutoSlide();
                }}
                className="rounded-full transition-all duration-300 border-none p-0 cursor-pointer"
                style={{
                  height: '6px',
                  width: index === currentIndex ? '18px' : '6px',
                  background: index === currentIndex ? '#FF6A00' : 'rgba(0, 0, 0, 0.2)'
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop View Render: Traditional Slider
  const dragOffset = isDragging ? touchCurrentX - touchStartX : 0;

  return (
    <div 
      className="w-full max-w-[1440px] mx-auto mt-[12px] md:mt-[20px] mb-[22px] md:mb-[32px] relative group overflow-hidden rounded-[18px] md:rounded-[20px]" 
      style={{ 
        height: '400px', 
        boxShadow: '0 4px 18px rgba(0,0,0,0.06)', 
        background: 'white',
        touchAction: 'pan-y'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="w-full h-full flex"
        style={{ 
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transitionProperty: 'transform',
          transitionDuration: isDragging ? '0ms' : '500ms',
          transitionTimingFunction: 'ease-out'
        }}
      >
        {images.map((img, index) => (
          <div 
            key={img.id} 
            className="w-full h-full shrink-0 relative select-none"
          >
            {img.link ? (
              <Link 
                href={img.link} 
                onClick={handleLinkClick}
                className="block w-full h-full relative cursor-pointer group/link"
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`Slide ${index + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/link:scale-105 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/link:bg-black/5 transition-colors duration-300 pointer-events-none" />
              </Link>
            ) : (
              <img 
                src={getImageUrl(img)} 
                alt={`Slide ${index + 1}`} 
                className="w-full h-full object-cover pointer-events-none"
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full bg-white/95 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-[#FF6A00] hover:scale-110 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-full bg-white/95 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-[#FF6A00] hover:scale-110 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20"
          style={{ bottom: '24px' }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
              className="rounded-full transition-all duration-300 cursor-pointer"
              style={{
                height: '8px',
                width: index === currentIndex ? '24px' : '8px',
                background: index === currentIndex ? '#FF6A00' : '#D1D5DB',
                border: 'none',
                padding: 0
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
