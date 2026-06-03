'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';

// Wrapped in Suspense because useSearchParams() requires it in Next.js App Router
function UpdatePasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [storeName, setStoreName] = useState('Bagmati Shop');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load store name
    const savedStoreName = localStorage.getItem('storeName');
    if (savedStoreName) setStoreName(savedStoreName);

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      // ── Method 1: PKCE code in URL (Supabase v2 default) ──────────────────
      // When redirectTo points here, Supabase adds ?code=xxx to the URL
      const code = searchParams?.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // Clean the URL so the code can't be reused
          window.history.replaceState({}, '', '/auth/update-password');
          setIsValidSession(true);
          setSessionLoading(false);
          return;
        }
      }

      // ── Method 2: token_hash in URL (Supabase implicit / OTP flow) ─────────
      const tokenHash = searchParams?.get('token_hash');
      const type = searchParams?.get('type');
      if (tokenHash && type === 'recovery') {
        try {
          const { error } = await (supabase.auth as any).verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!error) {
            window.history.replaceState({}, '', '/auth/update-password');
            setIsValidSession(true);
            setSessionLoading(false);
            return;
          }
        } catch (_) {}
      }

      // ── Method 3: Existing recovery session in cookies ─────────────────────
      // e.g. when user arrived via /auth/callback?next=/auth/update-password
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
        setSessionLoading(false);
        return;
      }

      // ── Method 4: onAuthStateChange PASSWORD_RECOVERY event ────────────────
      // Fires when the reset link uses hash fragments (#access_token=...) 
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setIsValidSession(true);
          setSessionLoading(false);
        }
      });
      unsubscribe = () => subscription.unsubscribe();

      // After 3 seconds with no valid session — show expired message
      setTimeout(() => {
        setSessionLoading(false);
      }, 3000);
    };

    init();
    return () => { unsubscribe?.(); };
  }, []);

  // Password strength calculation
  const getStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = getStrength();
  const strengthColors = ['bg-red-400', 'bg-amber-400', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Medium', 'Strong'];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !isValidSession) return;

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

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Sign out so user must login with new password
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => {
        router.push('/login?message=Password reset successful! Please log in with your new password.');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
          <p className="text-xs font-[700] uppercase tracking-widest text-gray-400">
            Verifying reset link...
          </p>
        </div>
      </main>
    );
  }

  // ── Expired / Invalid Link ─────────────────────────────────────────────────
  if (!isValidSession) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-[460px] bg-white rounded-[28px] border border-[#EEF2F7] p-8 md:p-12 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[22px] font-[800] text-[#111827]">Link Expired</h2>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              This password reset link has expired or already been used.
              Please go back to login and request a new reset link.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full h-[52px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[700] text-[14px] rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/10"
          >
            <LogIn size={16} /> Back to Login
          </Link>
        </div>
      </main>
    );
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-[460px] bg-white rounded-[28px] border border-[#EEF2F7] p-8 md:p-12 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto border border-green-100">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[24px] font-[800] text-[#111827]">Password Updated!</h2>
            <p className="text-[14px] text-[#6B7280]">
              Your password has been reset successfully. Redirecting you to login...
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center text-gray-400 text-xs">
            <Loader2 size={13} className="animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </main>
    );
  }

  // ── Main Password Reset Form ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-[28px] border border-[#EEF2F7] shadow-2xl overflow-hidden">
        
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#FF6A00] via-[#FF8C38] to-[#FFB347]" />
        
        <div className="p-8 md:p-12">
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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FFD8A8] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={26} className="text-[#FF6A00]" />
            </div>
            <h1 className="text-[26px] font-[800] text-[#111827] tracking-tight">Set New Password</h1>
            <p className="text-[14px] text-[#6B7280] mt-2 leading-relaxed">
              Your identity is verified. Choose a strong new password below.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-red-600 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[14px] font-[600] text-[#374151] block ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  className="w-full h-[52px] pl-11 pr-12 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? strengthColors[strength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-[600]">
                    <span className="text-gray-400">Strength:</span>
                    <span className={`${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-green-600'}`}>
                      {strengthLabels[strength - 1]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[14px] font-[600] text-[#374151] block ml-1">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  className={`w-full h-[52px] pl-11 pr-4 rounded-[14px] border transition-all font-[500] text-[15px] text-[#111827] outline-none focus:ring-4 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/20'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-100 bg-green-50/20'
                      : 'border-[#E5E7EB] focus:border-[#FF6A00] focus:ring-[#FF6A00]/8 bg-white'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {/* Match indicator icon */}
                {confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <AlertCircle size={18} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 font-[500] ml-1 animate-in fade-in">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!!confirmPassword && password !== confirmPassword)}
              className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[700] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/15 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> Updating Password...</>
              ) : (
                <><ShieldCheck size={18} /> Update Password</>
              )}
            </button>
          </form>

          {/* Skip Option — user proved identity by clicking the link */}
          <div className="mt-6 pt-6 border-t border-[#EEF2F7] text-center space-y-1">
            <p className="text-[12px] text-gray-400">Your email was already verified by clicking this link.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#FF6A00] hover:underline transition-colors"
            >
              <LogIn size={13} /> Skip — Go to Login Instead
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#FF6A00]" size={40} />
        </main>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
