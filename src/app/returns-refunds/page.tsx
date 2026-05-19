'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ShieldAlert, RefreshCw, XCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ReturnsRefundsPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] pb-20">
      <Header />
      
      <div className="pt-24 max-w-4xl mx-auto px-6">
        
        {/* Banner Section */}
        <div className="text-center py-12 border-b border-gray-100">
          <div className="w-16 h-16 bg-orange-50 text-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-orange-500/5">
            <RefreshCw size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight">Returns & Refunds Policy</h1>
          <p className="text-gray-500 font-semibold mt-2">Transparent, simple, and reliable policies for your satisfaction.</p>
        </div>

        {/* Policy Notice Box */}
        <div className="mt-12 bg-orange-50/50 border border-orange-200/60 rounded-3xl p-8 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Instant Return at Delivery Time</h2>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                To guarantee absolute peace of mind, all returns and refunds must be initiated and completed <span className="font-bold text-gray-900 underline">instantly at the time of delivery</span>. Please inspect your items thoroughly while our delivery executive is present.
              </p>
            </div>
          </div>
        </div>

        {/* Two Columns: Valid vs Invalid Returns */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          
          {/* Valid Returns Card */}
          <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Valid Return Conditions</h3>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed font-semibold">
              Returns are accepted and eligible for full instant refund under the following strict conditions:
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">1</div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Damaged Product</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Physical damage, broken parts, or defect upon unboxing.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">2</div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Different / Wrong Product</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Received a wrong model, incorrect size, or different color from what was ordered.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Invalid Returns Card */}
          <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <XCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Invalid Return Conditions</h3>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed font-semibold">
              To keep our logistics efficient and offer you the lowest possible prices, we cannot accept returns for:
            </p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">1</div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Change of Mind</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Deciding you no longer want the product, or preferring another style after delivery.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">2</div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Post-Delivery Requests</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Claims raised after the delivery executive has left your premises.</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Process Detail Section */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-[var(--primary)]" />
            How the Process Works
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-[var(--primary)] font-black text-xs uppercase tracking-widest">Step 1</div>
              <h4 className="font-bold text-sm text-gray-900">Inspect Product</h4>
              <p className="text-xs text-gray-400 font-semibold">Open and check the product thoroughly when it arrives.</p>
            </div>
            <div className="space-y-2">
              <div className="text-[var(--primary)] font-black text-xs uppercase tracking-widest">Step 2</div>
              <h4 className="font-bold text-sm text-gray-900">Verify Defect</h4>
              <p className="text-xs text-gray-400 font-semibold">If damaged or incorrect, immediately inform the delivery agent.</p>
            </div>
            <div className="space-y-2">
              <div className="text-[var(--primary)] font-black text-xs uppercase tracking-widest">Step 3</div>
              <h4 className="font-bold text-sm text-gray-900">Instant Refund</h4>
              <p className="text-xs text-gray-400 font-semibold">The delivery agent takes it back and an instant refund/cancellation is triggered.</p>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
