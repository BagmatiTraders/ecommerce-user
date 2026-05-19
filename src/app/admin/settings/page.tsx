'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Settings, 
  ChevronRight, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  Ticket,
  MessageCircle
} from 'lucide-react';

const SETTING_CARDS = [
  {
    title: 'Logistic Partner',
    desc: 'Manage shipping carriers, active partners, and delivery fee discounts.',
    icon: Truck,
    href: '/admin/settings/logistics',
    color: 'bg-indigo-50 text-indigo-600'
  },
  {
    title: 'Vouchers',
    desc: 'Create and manage promotional discount vouchers for products, campaigns, secrets, and new users.',
    icon: Ticket,
    href: '/admin/settings/vouchers',
    color: 'bg-orange-50 text-orange-600'
  },
  {
    title: 'Store Settings',
    desc: 'Configure store name, contact info, and global currencies.',
    icon: Globe,
    href: '/admin/settings/store',
    color: 'bg-blue-50 text-blue-600',
    locked: false
  },
  {
    title: 'Whatsapp Phone Number',
    desc: 'Configure the WhatsApp phone number used for customer order redirects.',
    icon: MessageCircle,
    href: '/admin/settings/whatsapp',
    color: 'bg-green-50 text-green-600',
    locked: false
  },
  {
    title: 'Security',
    desc: 'API keys, authentication methods, and access controls.',
    icon: Shield,
    href: '#',
    color: 'bg-green-50 text-green-600',
    locked: true
  }
];

export default function SettingsPortal() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12">
        
        <div className="mb-12">
          <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">
            <Settings size={12} />
            Control Center
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500 font-medium mt-1">Configure your ecommerce platform and integrations.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SETTING_CARDS.map((card, i) => (
            <Link 
              key={i} 
              href={card.href}
              className={`group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all ${card.locked ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex-center mb-6 transition-transform group-hover:scale-110 ${card.color}`}>
                <card.icon size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 flex items-center justify-between">
                {card.title}
                {!card.locked && <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />}
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                {card.desc}
              </p>
              {card.locked && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Coming Soon
                </div>
              )}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
