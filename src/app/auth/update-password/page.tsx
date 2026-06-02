'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('Ecommerce');
  const router = useRouter();

  useEffect(() => {
    // Check if the user actually has a valid session (passed by the recovery redirect)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?error=Invalid or expired recovery link. Please request a new password reset link.');
        return;
      }
      setCheckingSession(false);
    };

    // Load storeName from localStorage
    const savedStoreName = localStorage.getItem('storeName');
    if (savedStoreName) {
      setStoreName(savedStoreName);
    }
    
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Log out user session after update to force them to log in with new password
      await supabase.auth.signOut();

      setSuccess('Password updated successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login?message=Your password has been successfully reset. Please log in with your new credentials.');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin text-[#FF6A00]" size={36} />
          <p className="text-xs font-[700] uppercase tracking-widest mt-2 text-gray-500">Checking auth token...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 lg:p-12 font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-[#EEF2F7] overflow-hidden shadow-2xl p-8 md:p-12 flex flex-col justify-center">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#EEF2F7] flex items-center justify-center overflow-hidden shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-[800] text-[#111827] tracking-tight">
              {storeName.split(' ')[0]}<span className="text-[#FF6A00]">{storeName.split(' ').slice(1).join(' ')}</span>
            </span>
          </Link>
        </div>

        <div className="w-full">
          <h2 className="text-[26px] font-[800] text-[#111827] tracking-tight text-center">Reset Your Password</h2>
          <p className="text-[14px] text-[#6B7280] mt-2 text-center">Enter your new secure password below</p>

          {/* Error Message Box */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-red-600 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Box */}
          {success && (
            <div className="mt-6 p-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] text-green-700 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="mt-8 flex flex-col gap-5">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-[600] text-[#374151] block ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  className="w-full h-[52px] pl-11 pr-12 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[14px] font-[600] text-[#374151] block ml-1">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full h-[52px] pl-11 pr-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
