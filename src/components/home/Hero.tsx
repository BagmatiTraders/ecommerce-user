'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-[var(--surface-0)]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-50 animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-[100px] opacity-40 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[var(--primary)] font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
              <Sparkles size={14} />
              The Future of Shopping is Here
            </div>
            
            <h1 className="text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
              Elevate Your <br />
              <span className="gradient-text">Lifestyle.</span>
            </h1>
            
            <p className="text-xl text-[var(--text-secondary)] font-medium max-w-lg leading-relaxed">
              Discover a curated collection of premium gadgets, accessories, and essentials designed for the modern individual.
            </p>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <Link href="/search" className="btn-primary flex items-center gap-3 text-lg group">
                Shop Collection
                <ArrowRight className="transition-transform group-hover:translate-x-2" />
              </Link>
              <Link href="/track" className="px-8 py-5 rounded-2xl bg-white font-bold text-lg hover:bg-[var(--surface-1)] transition-all flex items-center gap-3 border border-[var(--surface-2)] shadow-sm">
                Track Order
              </Link>
            </div>

            <div className="flex items-center gap-12 pt-8 border-t border-[var(--surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex-center">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Secure Payments</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex-center">
                  <Zap size={20} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Fast Delivery</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                alt="Premium Watch" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Featured Product</div>
                <div className="text-3xl font-black">Minimalist Chrono</div>
              </div>
            </div>
            
            {/* Floating Card */}
            <div className="absolute -bottom-10 -left-10 z-20 bg-white p-8 rounded-[2rem] shadow-2xl border border-[var(--surface-2)] animate-float">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex-center">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold">New Arrivals</div>
                  <div className="text-2xl font-black text-[var(--primary)]">+120 Items</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
