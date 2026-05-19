'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  MessageCircle, 
  Camera, 
  Send, 
  Video, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Zap
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Contact settings state
  const [storeName, setStoreName] = useState('Bagmati Traders');
  const [contactEmail, setContactEmail] = useState('contact@bagmatitraders.com');
  const [contactPhone, setContactPhone] = useState('+977-98490808042');
  const [contactAddress, setContactAddress] = useState('Kathmandu, Balaju');

  // Shop Categories state (Top 5 categories by product count)
  const [topCategories, setTopCategories] = useState<string[]>([
    'Electronics', 'Fashion', 'Home & Living', 'Beauty & Health', 'Sports & Outdoors'
  ]);

  useEffect(() => {
    // 1. Fetch store settings
    const fetchStoreSettings = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'store_settings')
          .maybeSingle();

        if (data && data.value) {
          const val = data.value;
          if (val.store_name) setStoreName(val.store_name);
          if (val.contact_email) setContactEmail(val.contact_email);
          if (val.contact_phone) setContactPhone(val.contact_phone);
          if (val.contact_address) setContactAddress(val.contact_address);
        }
      } catch (err) {
        console.error('Error fetching footer store settings:', err);
      }
    };

    // 2. Fetch top 5 categories by product count
    const fetchTopCategories = async () => {
      try {
        const { data: catData } = await supabase
          .from('ecommerce_categories')
          .select('*');
          
        const { data: prodData } = await supabase
          .from('ecommerce_products')
          .select('category')
          .eq('status', 'active');

        if (catData && prodData) {
          const counts: Record<string, number> = {};
          prodData.forEach((p: any) => {
            if (p.category) {
              counts[p.category] = (counts[p.category] || 0) + 1;
            }
          });

          // Map and sort
          const sortedCats = catData
            .map((c: any) => ({
              name: c.name,
              count: counts[c.name] || 0
            }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5)
            .map(c => c.name);

          if (sortedCats.length > 0) {
            setTopCategories(sortedCats);
          }
        }
      } catch (err) {
        console.error('Error calculating top categories in footer:', err);
      }
    };

    fetchStoreSettings();
    fetchTopCategories();

    // Listen to store settings updates in same window
    const handleStorageChange = () => {
      const savedName = localStorage.getItem('storeName');
      if (savedName) setStoreName(savedName);
      fetchStoreSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const firstLetter = storeName ? storeName.charAt(0).toUpperCase() : 'E';

  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 text-white group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFA41C] flex items-center justify-center shadow-lg shadow-[#FF6A00]/20 transition-transform group-hover:scale-110">
                <span className="text-white font-bold text-xl">{firstLetter}</span>
              </div>
              <span className="text-2xl font-black tracking-tight">{storeName}</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Elevating your lifestyle with curated premium products. Experience the future of seamless online shopping with 24/7 support and lightning-fast delivery.
            </p>
            <div className="flex gap-4 pt-2">
              {[MessageCircle, Camera, Send, Video].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#FF6A00] hover:text-white transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Categories - Dynamically fetches top 5 */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Shop Categories</h4>
            <ul className="space-y-4">
              {topCategories.map((link) => (
                <li key={link}>
                  <Link 
                    href={`/search?category=${encodeURIComponent(link)}`} 
                    className="text-sm hover:text-[#FF6A00] transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#FF6A00]" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support & Service */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Support & Service</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-[#FF6A00] transition-colors">Help Center (Coming Soon)</Link></li>
              <li><Link href="/track" className="hover:text-[#FF6A00] transition-colors">Track Order</Link></li>
              <li><Link href="/returns-refunds" className="hover:text-[#FF6A00] transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-[#FF6A00] transition-colors">Shipping Policy</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-[#FF6A00] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info - Dynamically loaded from Admin settings */}
          <div className="space-y-8">
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin size={20} className="text-[#FF6A00] shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed whitespace-pre-line">{contactAddress}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Mail size={18} className="text-[#FF6A00] shrink-0" />
                  <span className="text-sm truncate">{contactEmail}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone size={18} className="text-[#FF6A00] shrink-0" />
                  <span className="text-sm">{contactPhone}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="flex gap-3">
              <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700 text-[10px] font-bold text-gray-400">VISA</div>
              <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700 text-[10px] font-bold text-gray-400">MASTERCARD</div>
              <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700 text-[10px] font-bold text-gray-400">COD</div>
            </div>
          </div>

        </div>

        {/* Feature Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10 border-t border-gray-800">
          <div className="flex items-center gap-4">
            <Truck size={32} className="text-[#FF6A00]" />
            <div>
              <div className="text-white font-bold text-sm">Free Shipping</div>
              <div className="text-xs text-gray-500">On orders over Rs. 5000</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheck size={32} className="text-[#FF6A00]" />
            <div>
              <div className="text-white font-bold text-sm">Secure Payment</div>
              <div className="text-xs text-gray-500">100% secure transactions</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CreditCard size={32} className="text-[#FF6A00]" />
            <div>
              <div className="text-white font-bold text-sm">Easy Returns</div>
              <div className="text-xs text-gray-500">Instant returns at delivery time</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
          <p>© {currentYear} {storeName}. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
