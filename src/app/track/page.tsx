'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get('id');
  
  const [orderNumber, setOrderNumber] = useState(orderIdFromUrl || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderIdFromUrl) {
      handleTrack(orderIdFromUrl);
    }
  }, [orderIdFromUrl]);

  const handleTrack = async (id?: string) => {
    const idToSearch = id || orderNumber;
    if (!idToSearch) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ecommerce_orders')
        .select('*, ecommerce_order_items(*, ecommerce_products(display_name, images))')
        .eq('order_number', idToSearch.toUpperCase())
        .single();

      if (fetchError) throw fetchError;
      setOrder(data);
    } catch (err: any) {
      setError('Order not found. Please check the order number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status.toLowerCase());
  };

  return (
    <div className="container max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">Track Your Order</h1>
        <p className="text-[var(--text-secondary)] font-medium">Enter your order number to check the current status.</p>
      </div>

      {/* Search Box */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-xl flex gap-4 mb-16 border border-[var(--surface-2)]">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
          <input 
            type="text" 
            placeholder="e.g. ORD-123456789"
            className="w-full pl-16 pr-6 py-5 rounded-[1.5rem] bg-[var(--surface-1)] border-none outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold tracking-widest uppercase"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          />
        </div>
        <button 
          onClick={() => handleTrack()}
          disabled={loading}
          className="px-10 py-5 rounded-[1.5rem] bg-[var(--primary)] text-white font-extrabold hover:bg-[var(--primary-hover)] transition-all shadow-lg"
        >
          {loading ? <Clock className="animate-spin" /> : 'Track'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] border border-red-100 flex items-center gap-4 animate-fade-in">
          <AlertCircle size={32} />
          <div className="font-bold">{error}</div>
        </div>
      )}

      {order && (
        <div className="space-y-8 animate-fade-in">
          {/* Tracking Status */}
          <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-[var(--surface-2)]">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--text-muted)] mb-1">Current Status</div>
                <div className="text-3xl font-extrabold capitalize text-[var(--primary)]">{order.status}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--text-muted)] mb-1">Expected Delivery</div>
                <div className="font-extrabold">Next 3-5 Business Days</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative pt-10 pb-10">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--surface-2)] -translate-y-1/2"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[var(--primary)] -translate-y-1/2 transition-all duration-1000"
                style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
              ></div>
              
              <div className="flex justify-between relative z-10">
                {[
                  { id: 'pending', label: 'Placed', icon: Clock },
                  { id: 'processing', label: 'Processing', icon: Package },
                  { id: 'shipped', label: 'Shipped', icon: Truck },
                  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
                ].map((step, i) => {
                  const isActive = getStatusStep(order.status) >= i;
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex-center transition-all duration-500 ${
                        isActive ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-[var(--surface-2)] text-[var(--text-muted)]'
                      }`}>
                        <step.icon size={24} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-[var(--surface-2)]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Package className="text-[var(--primary)]" size={20} />
                Order Items
              </h3>
              <div className="space-y-6">
                {order.ecommerce_order_items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[var(--surface-1)] flex-center overflow-hidden">
                      {item.ecommerce_products?.images?.[0] ? (
                        <img src={item.ecommerce_products.images[0]} className="w-full h-full object-cover" />
                      ) : <Package size={20} className="text-[var(--text-muted)]" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm line-clamp-1">{item.ecommerce_products?.display_name}</div>
                      <div className="text-xs text-[var(--text-muted)] font-bold">Qty: {item.quantity} • ${item.unit_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-[var(--surface-2)]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <MapPin className="text-[var(--primary)]" size={20} />
                Delivery Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest mb-1">Customer</div>
                  <div className="font-extrabold">{order.customer_name}</div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest mb-1">Shipping Address</div>
                  <div className="font-bold leading-relaxed">{order.shipping_address}</div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest mb-1">Contact</div>
                  <div className="font-bold">{order.customer_phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-1)] pt-32 pb-20">
      <Header />
      <Suspense fallback={<div className="container text-center py-20"><Loader2 className="animate-spin mx-auto" /></div>}>
        <TrackingContent />
      </Suspense>
    </main>
  );
}
