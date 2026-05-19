'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Database,
  BarChart3,
  ChevronLeft,
  Store,
  LogOut,
  Truck,
  Ticket,
  MessageCircle
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Database, label: 'Inventory Sync', href: '/admin/inventory' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Ticket, label: 'Vouchers', href: '/admin/settings/vouchers' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Truck, label: 'Logistic Partner', href: '/admin/settings/logistics' },
  { icon: MessageCircle, label: 'WhatsApp Settings', href: '/admin/settings/whatsapp' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[var(--surface-2)] z-50 flex flex-col">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-black flex-center text-white">
          <Store size={22} />
        </div>
        <div>
          <h2 className="font-black text-xl tracking-tighter">Admin</h2>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest -mt-1">Control Center</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-black text-white shadow-lg shadow-black/10' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-black'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-black'} />
              <span className="text-sm font-bold">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
          <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-xs font-bold">System Online</span>
          </div>
        </div>
        
        <Link 
          href="/account/profile" 
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          Return to Profile
        </Link>
      </div>
    </aside>
  );
}
