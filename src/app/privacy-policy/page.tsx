import { Metadata } from 'next';
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Eye, Key, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bagmati Shop',
  description: 'Read the privacy policy of Bagmati Shop. Learn about our commitment to protecting your personal data, secure processing, and data security.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] pb-20">
      <Header />
      
      <div className="pt-24 max-w-4xl mx-auto px-6">
        
        {/* Banner Section */}
        <div className="text-center py-12 border-b border-gray-100">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-500/5">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 font-semibold mt-2">Your trust is our greatest asset. Learn how we safeguard your data.</p>
        </div>

        {/* Introduction */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-gray-900">Commitment to Data Security</h2>
          <p className="text-sm text-gray-500 leading-relaxed font-semibold">
            We value the privacy of our customers and site visitors. This Privacy Policy details the types of personal data we collect, how it is secured, and the steps we take to guarantee that your shopping experience remains completely private.
          </p>
        </div>

        {/* Three Columns: Collection, Usage, Security */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">1. Data We Collect</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              We collect basic account information (name, phone number, email address) and delivery addresses to successfully process and deliver your ecommerce purchases.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">2. How We Use It</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              Your details are used strictly to complete transaction checkouts, provide order status notifications, handle shipping, and verify delivery details.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Key size={20} />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">3. Information Protection</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              All personal customer data is stored securely using advanced encryption protocols. We strictly never rent, sell, or disclose your private data to third parties.
            </p>
          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
