'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Star, Search } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  display_name: string;
  slug: string;
  price: number;
  category: string;
  rating: number;
  reviews_count: number;
  images: string[];
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('status', 'active')
        .limit(8);

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-3xl h-96 animate-pulse bg-[var(--surface-1)]"></div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)] italic">No products available in the store yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <div key={product.id} className="group glass rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
          <Link href={`/products/${product.slug}`} className="block">
            <div className="aspect-square bg-[var(--surface-1)] relative overflow-hidden">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.display_name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 flex-center flex-col gap-2 text-[var(--text-muted)]">
                  <Search size={32} strokeWidth={1} />
                  <span className="text-xs uppercase font-bold tracking-widest">No Image</span>
                </div>
              )}
            </div>
          </Link>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">{product.category}</span>
              <div className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                <Star size={12} fill="currentColor" />
                {product.rating}
              </div>
            </div>
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-bold text-lg mb-3 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                {product.display_name}
              </h3>
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-2xl font-extrabold">${product.price}</span>
                <span className="text-xs text-[var(--text-muted)] ml-1">USD</span>
              </div>
              <Link href={`/products/${product.slug}`} className="text-sm font-bold text-[var(--primary)] hover:underline">
                Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
