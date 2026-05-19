'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  ShoppingBag, 
  Package, 
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// In a real app, this would come from the logged-in user's profile/metadata
const VENDOR_CONFIG = {
  name: 'Electronics Hub',
  category: 'Electronics',
  id: 'vendor-uuid-123'
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border border-[var(--surface-2)]">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex-center`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-extrabold">{value}</div>
      </div>
    </div>
  </div>
);

export default function VendorDashboard() {
  const [stats, setStats] = useState({
    products: '0',
    orders: '0',
    messages: '0',
    revenue: '$0'
  });

  useEffect(() => {
    const fetchVendorStats = async () => {
      // Filter products by vendor's category
      const { count: productCount } = await supabase
        .from('ecommerce_products')
        .select('*', { count: 'exact', head: true })
        .eq('category', VENDOR_CONFIG.category);

      // In a real app, we would also filter orders and messages by category/vendor_id
      
      setStats({
        products: String(productCount || 0),
        orders: '12', // Mock
        messages: '5', // Mock
        revenue: '$3,240' // Mock
      });
    };

    fetchVendorStats();
  }, []);

  return (
    <AdminLayout isVendor={true} vendorCategory={VENDOR_CONFIG.category}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {VENDOR_CONFIG.name}</h1>
        <p className="text-[var(--text-secondary)]">Manage your {VENDOR_CONFIG.category} products and orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="My Products" value={stats.products} icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
        <StatCard title="Total Orders" value={stats.orders} icon={Package} color="bg-green-50 text-green-600" />
        <StatCard title="Unread Messages" value={stats.messages} icon={MessageSquare} color="bg-amber-50 text-amber-600" />
        <StatCard title="Estimated Revenue" value={stats.revenue} icon={DollarSign} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Products */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[var(--surface-2)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Your {VENDOR_CONFIG.category} Products</h2>
            <button className="text-[var(--primary)] font-bold text-sm hover:underline">Manage All</button>
          </div>
          
          <div className="space-y-4">
            {/* We will fetch real products here, showing mock for now */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-1)]">
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex-center text-[var(--text-muted)]">
                  <ShoppingBag size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">Product Sample {i}</div>
                  <div className="text-xs text-[var(--text-muted)]">In Stock: 45 units</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold">$120.00</div>
                  <div className="text-[10px] text-green-500 font-bold uppercase">Active</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Messages */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-[var(--surface-2)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Category Messages</h2>
            <button className="text-[var(--primary)] font-bold text-sm hover:underline">Open Inbox</button>
          </div>
          
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-[var(--surface-1)] transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex-center text-white font-bold">
                  C{i}
                </div>
                <div className="flex-1 border-b border-[var(--surface-2)] pb-4 group-last:border-none">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-sm">Customer {i}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">12:45 PM</div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                    Hi, is this {VENDOR_CONFIG.category} item still available? I want to buy...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
