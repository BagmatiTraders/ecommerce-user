'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { 
  Package, 
  ChevronRight, 
  Clock, 
  MapPin, 
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  ecommerce_order_items: any[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserAndOrders();
  }, []);

  const fetchUserAndOrders = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    if (authUser) {
      const { data, error } = await supabase
        .from('ecommerce_orders')
        .select('*, ecommerce_order_items(*, ecommerce_products(display_name, images))')
        .eq('customer_email', authUser.email)
        .order('created_at', { ascending: false });

      if (!error) setOrders(data || []);
    } else {
      // For guests, we could use device_id from local storage
      const deviceId = localStorage.getItem('ecommerce_device_id');
      if (deviceId) {
        const { data, error } = await supabase
          .from('ecommerce_orders')
          .select('*, ecommerce_order_items(*, ecommerce_products(display_name, images))')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false });

        if (!error) setOrders(data || []);
      }
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'processing': return 'bg-blue-50 text-blue-600';
      case 'shipped': return 'bg-purple-50 text-purple-600';
      case 'delivered': return 'bg-green-50 text-green-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface-0)] pb-20">
      <Header />
      
      <div className="container pt-32 pb-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">My Orders</h1>
            <p className="text-[var(--text-secondary)] font-medium">Review and track your recent purchases.</p>
          </div>
          <button 
            onClick={fetchUserAndOrders}
            className="p-3 rounded-xl glass hover:bg-[var(--surface-1)] transition-all flex items-center gap-2 font-bold text-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Sync Orders
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse border border-[var(--surface-2)]"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-[var(--surface-2)] shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[var(--surface-1)] flex-center mx-auto mb-6 text-[var(--text-muted)]">
              <ShoppingBag size={40} strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-[var(--text-secondary)] mb-8">Ready to start shopping? Explore our collection today.</p>
            <Link href="/" className="px-8 py-4 rounded-2xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[var(--surface-2)] hover:shadow-md transition-all group">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between lg:justify-start lg:gap-6">
                      <div className="px-4 py-1.5 rounded-xl bg-slate-100 font-extrabold text-sm tracking-widest text-slate-600">
                        {order.order_number}
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-[0.2em] ${getStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] font-bold flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3 overflow-hidden">
                        {order.ecommerce_order_items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="inline-block h-12 w-12 rounded-full ring-4 ring-white bg-[var(--surface-1)] overflow-hidden">
                            {item.ecommerce_products?.images?.[0] ? (
                              <img src={item.ecommerce_products.images[0]} className="w-full h-full object-cover" />
                            ) : <Package className="text-[var(--text-muted)] m-3" size={12} />}
                          </div>
                        ))}
                        {order.ecommerce_order_items.length > 3 && (
                          <div className="flex items-center justify-center h-12 w-12 rounded-full ring-4 ring-white bg-slate-100 text-[10px] font-bold text-slate-500">
                            +{order.ecommerce_order_items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[var(--text-secondary)]">
                        {order.ecommerce_order_items[0]?.ecommerce_products?.display_name}
                        {order.ecommerce_order_items.length > 1 && ` and ${order.ecommerce_order_items.length - 1} more items`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-12 pt-6 lg:pt-0 border-t lg:border-none border-[var(--surface-2)]">
                    <div className="text-right">
                      <div className="text-[var(--text-muted)] text-[10px] font-extrabold uppercase tracking-widest mb-1 text-right">Total Amount</div>
                      <div className="text-2xl font-extrabold">${order.total_amount.toFixed(2)}</div>
                    </div>
                    <Link 
                      href={`/track?id=${order.order_number}`}
                      className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-[var(--surface-1)] text-[var(--text-primary)] font-bold hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                    >
                      Track Order
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
