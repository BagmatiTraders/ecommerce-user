'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Truck, Navigation, ShieldCheck, MapPin } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] pb-20">
      <Header />
      
      <div className="pt-24 max-w-4xl mx-auto px-6">
        
        {/* Banner Section */}
        <div className="text-center py-12 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-500/5">
            <Truck size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight">Shipping Policy</h1>
          <p className="text-gray-500 font-semibold mt-2">Fast, reliable, and secure logistics right to your doorstep.</p>
        </div>

        {/* Dynamic Partner Details */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          
          {/* Valley Timelines Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Navigation size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Delivery Timelines</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Inside Kathmandu Valley</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Prompt delivery via standard local courier.</p>
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full">1 - 2 Days</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Outside Kathmandu Valley</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Reliable parcel delivery across major hub locations.</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">3 - 5 Days</span>
              </div>
            </div>
          </div>

          {/* Pricing Info Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Shipping Costs</h3>
            </div>

            <div className="space-y-4 text-sm text-gray-500 font-semibold leading-relaxed">
              <p>
                Shipping costs are calculated automatically during checkout based on your selected district, local address, and active logistics configuration.
              </p>
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                <span className="text-xs text-gray-600 font-bold">
                  Free standard shipping applies on all orders total value exceeding Rs. 5000!
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Process Detail Section */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900">Order Verification and Packing</h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Once an order is successfully placed, it undergoes a mandatory verification check by our operations team. Verified orders are immediately printed and carefully packed by our premium logistic partners. A notification containing real-time status and package details will be dispatched to your phone/email to help you track the package progress conveniently.
          </p>
        </div>

      </div>

      <Footer />
    </main>
  );
}
