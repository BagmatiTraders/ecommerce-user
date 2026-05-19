'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Store Products', icon: ShoppingBag, path: '/admin/products' },
  { name: 'Inventory Sync', icon: RefreshCw, path: '/admin/inventory' },
  { name: 'Orders', icon: Package, path: '/admin/orders' },
  { name: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { name: 'Customers', icon: Users, path: '/admin/users' },
  { name: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

const Sidebar = ({ isVendor = false, vendorCategory = '' }) => {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 bg-white border-r border-[var(--surface-2)] flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary-gradient)] flex-center text-white font-bold text-xl">
          E
        </div>
        <div>
          <div className="font-extrabold text-xl tracking-tight">Eco<span className="text-[var(--primary)]">mmerce</span></div>
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)]">
            {isVendor ? `Vendor: ${vendorCategory}` : 'Administrator'}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          // Filter items if vendor
          if (isVendor && (item.name === 'Inventory Sync' || item.name === 'Customers')) return null;

          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-blue-50 text-[var(--primary)]' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
                <span className="font-bold text-sm">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-[var(--surface-2)]">
        <button className="flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all w-full text-left">
          <LogOut size={20} />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
