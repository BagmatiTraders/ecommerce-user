'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  ShieldCheck, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Focus refs for auto autofocus next input
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', colorClass: '', widthClass: 'w-0' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 6) {
      return { score: 1, label: 'Weak', colorClass: 'text-red-500 bg-red-50 border-red-100', widthClass: 'w-1/3 bg-red-500' };
    }
    if (score <= 2) {
      return { score: 2, label: 'Medium', colorClass: 'text-amber-500 bg-amber-50 border-amber-100', widthClass: 'w-2/3 bg-amber-500' };
    }
    return { score: 3, label: 'Strong', colorClass: 'text-green-500 bg-green-50 border-green-100', widthClass: 'w-full bg-green-500' };
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms & Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) {
        if (signupError.message.includes('rate limit')) {
          setError('Too many signup attempts. Please try again in an hour.');
        } else {
          setError(signupError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?message=Account created successfully! Check your email to confirm your account.');
      }, 3000);

    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  if (success) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center space-y-6 animate-fade-in bg-white rounded-[28px] border border-[#EEF2F7] p-10 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto shadow-sm border border-green-100">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-[800] tracking-tight text-gray-900">Check Your Email</h1>
            <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
              We've sent a verification link to <span className="font-bold text-black">{email}</span>. 
              Click the link inside to activate your premium customer account.
            </p>
          </div>
          <Link href="/login" className="inline-block text-[#FF6A00] font-bold hover:underline">
            Go to Login Page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 lg:p-12 font-sans">
      <div className="w-full max-w-[1080px] bg-white rounded-[28px] border border-[#EEF2F7] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Brand Benefits (Desktop Only) */}
        <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-[#FFEDD5] to-[#FFF7ED] p-10 flex-col justify-between relative overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 z-10 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center shadow-lg font-[800] text-lg">
              E
            </div>
            <span className="text-xl font-[800] text-[#111827] tracking-tight">Eco<span className="text-[#FF6A00]">mmerce</span></span>
          </Link>

          {/* Heading and bullets */}
          <div className="my-auto space-y-6 z-10 py-10">
            <h1 className="text-[34px] font-[800] text-[#111827] leading-[1.3] tracking-tight">
              Shop smarter with fast delivery & secure checkout
            </h1>
            <p className="text-sm text-gray-500 font-[500] leading-relaxed">
              Register now to unlock tracked order statuses, premium local payment options, and early campaign drops.
            </p>
            
            <div className="space-y-3.5 pt-4">
              {[
                'Fast Checkout',
                'Track Your Orders',
                'Exclusive Deals',
                'Easy Returns'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5.5 h-5.5 rounded-full bg-[#FF6A00]/10 text-[#FF6A00] flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-[15px] font-[600] text-[#374151]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Trust label footer */}
          <div className="flex items-center gap-2.5 text-gray-400 z-10">
            <ShieldCheck size={18} className="text-[#FF6A00]" />
            <span className="text-xs font-[600] tracking-wider uppercase">100% Secure Checkout</span>
          </div>

          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#FF6A00]/5 rounded-full blur-2xl" />
        </div>

        {/* Right Side: Signup Form */}
        <div className="flex-1 p-6 md:p-12 lg:p-14 flex flex-col justify-center bg-white">
          <div className="w-full max-w-[520px] mx-auto">
            {/* Header titles */}
            <div>
              <h2 className="text-[30px] font-[800] text-[#111827] tracking-tight">Create Your Account</h2>
              <p className="text-[15px] text-[#6B7280] mt-2">
                Start shopping with faster checkout and order tracking
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mt-6 p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-red-600 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="mt-8 flex flex-col gap-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full h-[52px] pl-11 pr-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        emailInputRef.current?.focus();
                      }
                    }}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    ref={emailInputRef}
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full h-[52px] pl-11 pr-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        passwordInputRef.current?.focus();
                      }
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="•••••••• (Min 6 characters)"
                    className="w-full h-[52px] pl-11 pr-12 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmPasswordInputRef.current?.focus();
                      }
                    }}
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
                
                {/* Dynamic Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs font-[700]">
                      <span className="text-gray-400">Security Strength:</span>
                      <span className={`px-2 py-0.5 rounded border ${strength.colorClass}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/30">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.widthClass}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    ref={confirmPasswordInputRef}
                    type="password" 
                    placeholder="••••••••"
                    className="w-full h-[52px] pl-11 pr-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 mt-2 ml-1">
                <input 
                  type="checkbox" 
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#FF6A00] cursor-pointer rounded border-[#E5E7EB] text-[#FF6A00]"
                />
                <label htmlFor="agreeTerms" className="text-xs text-[#6B7280] leading-relaxed cursor-pointer font-[500]">
                  I agree to the <Link href="#" className="text-[#FF6A00] font-[600] hover:underline">Terms of Service</Link> & <Link href="#" className="text-[#FF6A00] font-[600] hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={16} /> Create Account</>}
              </button>
            </form>

            {/* Switch to Signin layout */}
            <div className="mt-8 pt-6 border-t border-[#EEF2F7] text-center">
              <p className="text-[14px] text-[#6B7280]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#FF6A00] font-[600] hover:underline ml-1">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
}
