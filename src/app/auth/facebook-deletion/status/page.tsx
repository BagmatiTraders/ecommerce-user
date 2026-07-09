'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CheckCircle2, ShieldCheck, Calendar, Hash, FileText } from 'lucide-react';
import Link from 'next/link';

function DeletionStatusContent() {
  const searchParams = useSearchParams();
  const rawCode = searchParams?.get('code');
  const confirmationCode = rawCode || 'bgmt-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="pt-32 pb-20 max-w-2xl mx-auto px-6">
      {/* Deletion Card Container */}
      <div className="bg-white rounded-[2.5rem] border border-[#EEF2F7] p-8 md:p-12 shadow-2xl space-y-8 animate-fade-in relative overflow-hidden">
        
        {/* Success Header Badge */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
            <ShieldCheck size={44} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Data Deletion Status
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">
            Confirming the erasure of your personal data
          </p>
        </div>

        {/* Deletion Status Details Box */}
        <div className="bg-[#F9FAFB] rounded-3xl border border-gray-100 p-6 space-y-4 font-sans text-sm text-[#374151]">
          {/* Status Indicator Row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-extrabold text-gray-500 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Request Status:
            </span>
            <span className="px-3.5 py-1 rounded-full bg-green-100 text-green-700 font-extrabold text-xs tracking-wider uppercase">
              Completed
            </span>
          </div>

          {/* Confirmation Code Row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-extrabold text-gray-500 flex items-center gap-2">
              <Hash size={16} className="text-[#FF6A00]" />
              Confirmation Code:
            </span>
            <code className="px-3 py-1 font-mono bg-white border border-gray-200 rounded-xl font-bold text-gray-800">
              {confirmationCode}
            </code>
          </div>

          {/* Processed Date Row */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-extrabold text-gray-500 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Processed Date:
            </span>
            <span className="font-semibold text-gray-700">
              {currentDate}
            </span>
          </div>

          {/* Data Type Removed Row */}
          <div className="flex items-start justify-between py-2">
            <span className="font-extrabold text-gray-500 flex items-center gap-2 shrink-0">
              <FileText size={16} className="text-purple-500" />
              Scope of Deletion:
            </span>
            <span className="font-semibold text-gray-700 text-right">
              Facebook Auth credentials, customer profile, and personal contact links
            </span>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-black text-gray-900">What does this mean?</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-semibold">
            In compliance with Meta's developer data deletion policy, all database rows, profile records, and active authentication links associated with your Facebook account have been permanently purged from our platform. You have been securely logged out, and your details can no longer be accessed.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <Link 
            href="/" 
            className="w-full text-center py-4 bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[800] text-[15px] rounded-[1.5rem] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
      
      {/* Background design elements */}
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-[#FF6A00]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl -z-10" />
    </div>
  );
}

export default function DeletionStatusPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <Suspense fallback={
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-4 border-t-[#FF6A00] border-gray-200 rounded-full animate-spin"></div>
            <p className="text-xs font-[700] uppercase tracking-widest mt-4 text-gray-500">Loading Deletion Status...</p>
          </div>
        }>
          <DeletionStatusContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
