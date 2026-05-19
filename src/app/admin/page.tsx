'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  RefreshCw,
  MoreVertical,
  Activity,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <div className="premium-card group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700`}></div>
    
    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className={`w-16 h-16 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')} flex-center transition-all group-hover:scale-110`}>
        <Icon size={32} />
      </div>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
    </div>
    
    <div className="relative z-10">
      <div className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</div>
      <div className="text-4xl font-black tracking-tight">{value}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: '$0',
    orders: '0',
    products: '0',
    users: '0'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: productCount } = await supabase.from('ecommerce_products').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('ecommerce_orders').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    setStats({
      revenue: '$45,280',
      orders: String(orderCount || 0),
      products: String(productCount || 0),
      users: String(userCount || 0)
    });
  };

  return (
    <AdminLayout>
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Operational <span className="gradient-text">Overview</span></h1>
          <p className="text-[var(--text-secondary)] font-medium">Real-time metrics and system health across your store.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 font-bold text-xs uppercase tracking-widest border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            System Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard title="Total Revenue" value={stats.revenue} icon={DollarSign} trend="up" trendValue="+18.4%" color="bg-blue-500" />
        <StatCard title="Total Orders" value={stats.orders} icon={Package} trend="up" trendValue="+12.5%" color="bg-purple-500" />
        <StatCard title="Active Products" value={stats.products} icon={ShoppingBag} trend="down" trendValue="-3.1%" color="bg-amber-500" />
        <StatCard title="Registered Users" value={stats.users} icon={Users} trend="up" trendValue="+54.2%" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Performance Chart (Placeholder UI) */}
        <div className="lg:col-span-2 premium-card">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <TrendingUp size={20} className="text-[var(--primary)]" />
                Sales Performance
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-bold uppercase mt-1">Daily revenue trends</p>
            </div>
            <select className="bg-[var(--surface-1)] border-none rounded-xl px-4 py-2 text-xs font-bold outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div 
                  className="w-full bg-blue-100 rounded-t-2xl relative transition-all group-hover:bg-[var(--primary)]"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${h * 120}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-[var(--text-muted)]">Day {i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="premium-card">
          <h2 className="text-xl font-bold mb-10 flex items-center gap-3">
            <Activity size={20} className="text-purple-500" />
            Live Activity
          </h2>
          <div className="space-y-8 relative before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--surface-2)]">
            {[
              { time: '10:30 AM', event: 'New order #1027', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
              { time: '09:45 AM', event: 'Stock update: Headphones', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
              { time: '08:20 AM', event: 'New user registered', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
              { time: 'Yesterday', event: 'Payment failed #1024', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex-center shrink-0 shadow-sm border border-white`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <div className="text-sm font-black">{item.event}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-bold mt-1 uppercase tracking-widest">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 rounded-2xl bg-[var(--surface-1)] text-sm font-bold hover:bg-[var(--surface-2)] transition-all">
            View All Logs
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
