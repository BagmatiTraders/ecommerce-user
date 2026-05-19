'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { Bell, Search, User } from 'lucide-react';

const AdminLayout = ({ children, isVendor = false, vendorCategory = '' }: { 
  children: React.ReactNode, 
  isVendor?: boolean, 
  vendorCategory?: string 
}) => {
  return (
    <div className="flex min-h-screen bg-[var(--surface-1)]">
      {/* Sidebar - Fixed Width */}
      <div className="w-64 shrink-0">
        <Sidebar isVendor={isVendor} vendorCategory={vendorCategory} />
      </div>
      
      {/* Main Content Area - Fills remaining space */}
      <main className="flex-1 p-8 pt-6 overflow-x-hidden">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-12 h-12 rounded-xl bg-white flex-center shadow-sm hover:bg-[var(--surface-0)] transition-all">
              <Bell size={20} className="text-[var(--text-secondary)]" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-[var(--surface-2)]">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-sm">Bagmati Traders</div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{isVendor ? 'Vendor' : 'Admin'}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex-center text-white font-bold shadow-lg">
                <User size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content - No Container Constraints */}
        <div className="animate-fade-in w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
