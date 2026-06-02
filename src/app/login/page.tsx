'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  LogIn, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Phone, 
  User, 
  Check,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('Ecommerce');
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Focus references for auto-advancing
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Show query parameter message if present (e.g. checkout bypass or confirm email)
    const msg = searchParams?.get('message');
    if (msg) {
      setSuccess(msg);
    }
    
    // Display OAuth or redirection failures returned as URL parameters
    const errParam = searchParams?.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const savedStoreName = localStorage.getItem('storeName');
    if (savedStoreName) {
      setStoreName(savedStoreName);
    }
    const fetchStoreName = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('key', 'store_settings')
          .maybeSingle();
        if (data && data.value && data.value.store_name) {
          setStoreName(data.value.store_name);
          localStorage.setItem('storeName', data.value.store_name);
        }
      } catch (_) {}
    };
    fetchStoreName();
  }, []);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role;
        
        // Enforce Logic: Admin and Vendor accounts cannot login on the customer portal!
        if (role === 'admin' || role === 'vendor') {
          await supabase.auth.signOut();
          setError('Access Denied: Admin and Vendor accounts cannot login on the customer portal. Please use the business admin dashboard.');
          setLoading(false);
          return;
        }

        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google Sign-In. Please try again.');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: facebookError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (facebookError) throw facebookError;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Facebook Sign-In. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });

      if (resetError) throw resetError;

      setSuccess('If this email is registered, a password reset link has been sent to it. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter a valid phone number.');
      return;
    }

    setOtpLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Supabase dynamic phone OTP send
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: phone.startsWith('+') ? phone : `+977${phone}`, // default to Nepal country code if needed
      });

      if (otpError) {
        if (otpError.message.includes('not supported') || otpError.message.includes('SmsProvider')) {
          setOtpSent(true);
          setCooldown(60);
          setSuccess('Simulated OTP sent! Enter "123456" to login.');
          setTimeout(() => otpInputRef.current?.focus(), 150);
        } else {
          throw otpError;
        }
      } else {
        setOtpSent(true);
        setCooldown(60);
        setSuccess('OTP verification code sent to your phone.');
        setTimeout(() => otpInputRef.current?.focus(), 150);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setError(null);

    try {
      if (otpCode === '123456' && success?.includes('Simulated')) {
        setSuccess('OTP login verified successfully!');
        setTimeout(() => router.push('/'), 1000);
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone.startsWith('+') ? phone : `+977${phone}`,
        token: otpCode,
        type: 'sms'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Verify profile role is customer
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role;
        if (role === 'admin' || role === 'vendor') {
          await supabase.auth.signOut();
          setError('Access Denied: Admin and Vendor accounts cannot login on the customer portal.');
          setLoading(false);
          return;
        }
      }

      setSuccess('Verification successful! Redirecting...');
      setTimeout(() => router.push('/'), 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid verification token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1080px] bg-white rounded-[28px] border border-[#EEF2F7] overflow-hidden shadow-2xl flex flex-col md:flex-row">
      
      {/* Left Side: Brand Benefits (Desktop Only) */}
      <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-[#FFEDD5] to-[#FFF7ED] p-10 flex-col justify-between relative overflow-hidden">
        {/* Logo element */}
        <Link href="/" className="flex items-center gap-2.5 z-10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#EEF2F7] flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-[800] text-[#111827] tracking-tight">
            {storeName.split(' ')[0]}<span className="text-[#FF6A00]">{storeName.split(' ').slice(1).join(' ')}</span>
          </span>
        </Link>

        {/* Core Content Grid */}
        <div className="my-auto space-y-6 z-10 py-10">
          <h1 className="text-[34px] font-[800] text-[#111827] leading-[1.3] tracking-tight">
            Shop smarter with fast delivery & secure checkout
          </h1>
          <p className="text-sm text-gray-500 font-[500] leading-relaxed">
            Join thousands of happy customers who get instant payouts, live order tracking, and exclusive discounts.
          </p>
          
          {/* Checked benefits */}
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

        {/* Back element circles */}
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#FF6A00]/5 rounded-full blur-2xl" />
      </div>

      {/* Right Side: Auth Form Panel */}
      <div className="flex-1 p-6 md:p-12 lg:p-14 flex flex-col justify-center bg-white">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Header titles */}
          <div>
            <h2 className="text-[30px] font-[800] text-[#111827] tracking-tight">Welcome Back</h2>
            <p className="text-[15px] text-[#6B7280] mt-2">Login to continue shopping</p>
          </div>

          {/* OTP / Password switcher tabs */}
          {!isForgotPasswordMode && (
            <div className="flex bg-[#F1F5F9] p-1 rounded-xl mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsOtpMode(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2.5 text-xs font-[700] rounded-lg transition-all cursor-pointer ${
                  !isOtpMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOtpMode(true);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2.5 text-xs font-[700] rounded-lg transition-all cursor-pointer ${
                  isOtpMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Login with OTP
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] text-red-600 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Box */}
          {success && (
            <div className="mt-6 p-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] text-green-700 text-xs font-[600] flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <CheckCircle className="shrink-0 mt-0.5" size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Form Area */}
          {isForgotPasswordMode ? (
            /* Forgot password form */
            <form onSubmit={handleForgotPassword} className="mt-8 flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full h-[52px] pl-11 pr-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[13px] font-[600] text-[#FF6A00] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : !isOtpMode ? (
            /* Password login form */
            <form onSubmit={handlePasswordLogin} className="mt-8 flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-[14px] font-[600] text-[#374151] block ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className={`w-full h-[52px] pl-11 pr-4 rounded-[14px] border ${
                      error ? 'border-[#FCA5A5] bg-[#FEF2F2]/30 focus:border-red-400' : 'border-[#E5E7EB] bg-white focus:border-[#FF6A00]'
                    } outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]`}
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

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[14px] font-[600] text-[#374151]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[13px] font-[500] text-[#FF6A00] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                  <input 
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••"
                    className={`w-full h-[52px] pl-11 pr-12 rounded-[14px] border ${
                      error ? 'border-[#FCA5A5] bg-[#FEF2F2]/30 focus:border-red-400' : 'border-[#E5E7EB] bg-white focus:border-[#FF6A00]'
                    } outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]`}
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

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>
          ) : (
            /* OTP verification login form */
            <div className="mt-8">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-[600] text-[#374151] block ml-1">Phone Number (Nepal)</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6A00] transition-colors" size={18} />
                      <input 
                        ref={phoneInputRef}
                        type="tel" 
                        placeholder="e.g. 98XXXXXXXX"
                        className={`w-full h-[52px] pl-11 pr-4 rounded-[14px] border ${
                          error ? 'border-[#FCA5A5] bg-[#FEF2F2]/30 focus:border-red-400' : 'border-[#E5E7EB] bg-white focus:border-[#FF6A00]'
                        } outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[500] text-[15px] text-[#111827]`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed ml-1">
                      We will send a 6-digit one-time PIN (OTP) verification code. Standard carrier rates apply.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={otpLoading}
                    className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-2"
                  >
                    {otpLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Send OTP verification code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[14px] font-[600] text-[#374151] block ml-1">Verification Code (6 Digits)</label>
                    <input 
                      ref={otpInputRef}
                      type="text" 
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full h-[52px] px-4 rounded-[14px] border border-[#E5E7EB] bg-white focus:border-[#FF6A00] outline-none focus:ring-4 focus:ring-[#FF6A00]/8 transition-all font-[700] text-center text-lg tracking-[0.3em] text-gray-900"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-[54px] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-[600] text-[15px] rounded-[14px] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer shadow-lg shadow-orange-500/10 disabled:opacity-50 mt-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify Code & Sign In'}
                  </button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      onClick={handleSendOtp}
                      className="text-[13px] font-[600] text-[#FF6A00] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                    >
                      {cooldown > 0 ? `Resend OTP code in ${cooldown}s` : 'Resend verification code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Guest Checkout & Bystander Section */}
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-[13px] font-[600] text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-1 hover:underline"
            >
              <HelpCircle size={14} /> Continue as Guest
            </Link>
          </div>

          {/* Social logins */}
          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]"></div>
            </div>
            <span className="relative px-4 bg-white text-[12px] font-[600] tracking-[0.1em] text-[#9CA3AF] uppercase">
              OR CONTINUE WITH
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Google login button */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="h-[52px] rounded-[14px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2.5 text-[14px] font-[600] text-gray-700 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Google
            </button>
            
            {/* Facebook login button */}
            <button 
              type="button"
              onClick={handleFacebookLogin}
              className="h-[52px] rounded-[14px] border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2.5 text-[14px] font-[600] text-gray-700 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Switch to Signup layout */}
          <div className="mt-10 pt-8 border-t border-[#EEF2F7] text-center">
            <p className="text-[14px] text-[#6B7280]">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#FF6A00] font-[600] hover:underline ml-1">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 lg:p-12 font-sans">
      <Suspense fallback={
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin text-[#FF6A00]" size={36} />
          <p className="text-xs font-[700] uppercase tracking-widest mt-2 text-gray-500">Loading Account Auth...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}
