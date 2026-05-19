'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { uploadToCloudinary } from '@/app/actions/cloudinary';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Calendar, 
  Package, 
  Settings,
  ChevronRight,
  Loader2,
  Camera,
  Star,
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  ImageIcon,
  Send,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  Home,
  Briefcase,
  CheckCircle2,
  Info,
  Ticket
} from 'lucide-react';
import Link from 'next/link';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  disabled = false,
  required = false
}: { 
  options: string[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string,
  label: string,
  disabled?: boolean,
  required?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label} {required && '*'}</label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-bold flex justify-between items-center cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} ${isOpen ? 'ring-2 ring-orange-500 bg-white' : ''}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? value : placeholder}
        </span>
        <Search size={16} className="text-gray-400 font-black" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-50">
            <input 
              autoFocus
              type="text" 
              placeholder="Type to search..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold outline-none border-none focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-6 py-4 hover:bg-orange-50 cursor-pointer transition-colors flex items-center justify-between group ${opt === value ? 'bg-orange-50/50' : ''}`}
                >
                  <span className={`text-sm font-bold ${opt === value ? 'text-orange-600' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                  {opt === value && <CheckCircle2 size={16} className="text-orange-600" />}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  customer_name?: string;
  customer_phone?: string;
  ecommerce_order_items: any[];
}

interface Address {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  alt_phone_number: string | null;
  province: string;
  district: string;
  city: string;
  area: string | null;
  detailed_address: string;
  label: 'Home' | 'Office';
  is_default: boolean;
  created_at: string;
}

interface DeliveryLocation {
  id: string;
  province: string;
  district: string;
  city: string;
  area: string | null;
  delivery_charge?: number;
  delivery_time?: string;
  area_covered?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'track' | 'reviews' | 'addresses' | 'vouchers'>('profile');
  
  // Address Book States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [allLocations, setAllLocations] = useState<DeliveryLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    alt_phone_number: '',
    province: '',
    district: '',
    city: '',
    area: '',
    detailed_address: '',
    label: 'Home' as 'Home' | 'Office',
    is_default: false
  });
  
  // Dashboard Core Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Reviews Tab States
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', image_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await uploadToCloudinary(base64);
        if (res.success && res.url) {
          setNewReview(prev => ({ ...prev, image_url: res.url }));
        } else {
          alert("Upload failed: " + (res.error || "Unknown error"));
        }
      } catch (err: any) {
        alert("Upload failed: " + err.message);
      } finally {
        setUploadingImage(false);
      }
    };
  };

  // Tracking Tab States
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    
    const handleTabChange = (e: any) => {
      const tab = e.detail;
      if (['profile', 'orders', 'track', 'reviews', 'addresses', 'vouchers'].includes(tab)) {
        setActiveTab(tab);
      }
    };

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['profile', 'orders', 'track', 'reviews', 'addresses', 'vouchers'].includes(tab)) {
        setActiveTab(tab as any);
      }
      window.addEventListener('profile-tab-change', handleTabChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile-tab-change', handleTabChange);
      }
    };
  }, []);

  const fetchOrdersAndReviews = async (customerEmail: string, userId: string) => {
    setLoadingData(true);
    try {
      // 1. Fetch Orders with Items and Product details (email OR local device ID)
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('ecommerce_device_id') : null;
      let orderQuery = supabase
        .from('ecommerce_orders')
        .select('*, ecommerce_order_items(*, ecommerce_products(*))')
        .order('created_at', { ascending: false });

      if (deviceId) {
        orderQuery = orderQuery.or(`customer_email.ilike.${customerEmail},device_id.eq.${deviceId}`);
      } else {
        orderQuery = orderQuery.ilike('customer_email', customerEmail);
      }

      const { data: orderData, error: orderErr } = await orderQuery;

      if (orderErr) throw orderErr;
      setOrders(orderData || []);

      // 2. Fetch User Reviews
      const { data: reviewData, error: reviewErr } = await supabase
        .from('ecommerce_reviews')
        .select('*')
        .eq('user_id', userId);

      if (reviewErr) throw reviewErr;
      setUserReviews(reviewData || []);
    } catch (err) {
      console.error('Error fetching dashboard portal data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Customer Vouchers Integration States
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const fetchVouchersData = async (userId: string, signupDate: string) => {
    setLoadingVouchers(true);
    try {
      const nowStr = new Date().toISOString();
      
      // 1. Fetch active vouchers definition
      const { data: allVouchers, error: vError } = await supabase
        .from('ecommerce_vouchers')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', nowStr);
      if (vError) throw vError;

      // 2. Fetch user's collected vouchers
      const { data: colVouchers, error: cError } = await supabase
        .from('ecommerce_user_vouchers')
        .select('*, ecommerce_vouchers(*)')
        .eq('user_id', userId);
      if (cError) throw cError;

      // Fetch all locks globally to filter out fully claimed vouchers
      const { data: allLocks } = await supabase
        .from('ecommerce_user_vouchers')
        .select('voucher_id, status, expires_at');

      // Filter available/uncollected vouchers
      const signupTime = new Date(signupDate).getTime();
      const nowTime = new Date().getTime();
      const hoursSinceSignup = (nowTime - signupTime) / (1000 * 60 * 60);

      const filteredAvailable = (allVouchers || []).filter(v => {
        // Exclude already collected
        const isCollected = (colVouchers || []).some(cv => cv.voucher_id === v.id);
        if (isCollected) return false;

        // Exclude if fully claimed (active locks + used >= max_uses)
        const activeLocks = (allLocks || []).filter(l => 
          l.voucher_id === v.id && 
          (l.status === 'used' || (l.status === 'collected' && new Date(l.expires_at) > new Date()))
        ).length;
        if (activeLocks >= v.max_uses) return false;

        // Type specific checks
        if (v.type === 'secret') {
          return v.specific_customer_id === userId;
        }
        if (v.type === 'new_user') {
          return hoursSinceSignup <= (v.new_user_timeframe_hours || 48);
        }
        return true;
      });

      setVouchersList(filteredAvailable);
      setUserVouchers(colVouchers || []);
    } catch (err) {
      console.error('Error fetching customer vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleCollectVoucher = async (voucher: any) => {
    if (!user) {
      alert("Please login to collect vouchers.");
      return;
    }
    
    try {
      const now = new Date();
      
      // Enforce lock count check before collection
      const { data: existingLocks, error: lockError } = await supabase
        .from('ecommerce_user_vouchers')
        .select('id, status, expires_at')
        .eq('voucher_id', voucher.id);
        
      if (!lockError && existingLocks) {
        const activeLocks = existingLocks.filter(l => 
          l.status === 'used' || (l.status === 'collected' && new Date(l.expires_at) > now)
        ).length;
        
        if (activeLocks >= voucher.max_uses) {
          throw new Error('This voucher has already reached its maximum redemption limit.');
        }
      }

      let expiresAt: Date;

      if (voucher.type === 'secret') {
        expiresAt = new Date(voucher.end_date);
      } else {
        // 24 hours from now OR voucher end_date, whichever comes first
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const endDate = new Date(voucher.end_date);
        expiresAt = oneDayFromNow < endDate ? oneDayFromNow : endDate;
      }

      const { error } = await supabase
        .from('ecommerce_user_vouchers')
        .insert({
          user_id: user.id,
          voucher_id: voucher.id,
          expires_at: expiresAt.toISOString(),
          status: 'collected'
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already collected this voucher.');
        }
        throw error;
      }

      alert(`Success! Voucher "${voucher.code}" collected to your wallet.`);
      await fetchVouchersData(user.id, user.created_at);
    } catch (err: any) {
      console.error('Error collecting voucher:', err);
      alert(err.message || 'Could not collect voucher. Please try again.');
    }
  };

  const fetchAddresses = async (userId: string) => {
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('ecommerce_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from('ecommerce_delivery_locations')
        .select('*');

      if (error) throw error;
      setAllLocations(data || []);
    } catch (err) {
      console.error('Error fetching delivery locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push('/login');
      return;
    }

    setUser(user);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileError) {
      setProfile(profileData);
    }
    
    // Load orders, reviews, addresses, and delivery locations dynamically
    await Promise.all([
      fetchOrdersAndReviews(user.email || '', user.id),
      fetchAddresses(user.id),
      fetchLocations(),
      fetchVouchersData(user.id, user.created_at)
    ]);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleSyncData = async () => {
    if (!user) return;
    await Promise.all([
      fetchOrdersAndReviews(user.email || '', user.id),
      fetchVouchersData(user.id, user.created_at)
    ]);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { full_name, phone_number, alt_phone_number, province, district, city, area, detailed_address, label, is_default } = addressForm;

    if (!full_name.trim() || !phone_number.trim() || !province || !district || !city || !detailed_address.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Strict 10-digit only-number phone validation matching checkout box
    if (phone_number.replace(/\D/g, '').length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (alt_phone_number && alt_phone_number.replace(/\D/g, '').length !== 10) {
      alert("Please enter a valid 10-digit alternative phone number.");
      return;
    }

    // 1. Enforce Max 5 addresses limit
    if (!editingAddressId && addresses.length >= 5) {
      alert("You can save at most 5 addresses in your Address Book.");
      return;
    }

    // 2. Enforce Max 2 default addresses limit
    if (is_default) {
      const defaultAddresses = addresses.filter(a => a.is_default && a.id !== editingAddressId);
      if (defaultAddresses.length >= 2) {
        alert("You can choose at most 2 locations as your Default Shipping Address. Please uncheck one of your existing default addresses first.");
        return;
      }
    }

    setSavingAddress(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: full_name.trim(),
        email: addressForm.email.trim() || null,
        phone_number: phone_number.replace(/\D/g, ''),
        alt_phone_number: alt_phone_number ? alt_phone_number.replace(/\D/g, '') : null,
        province,
        district,
        city,
        area: area || null,
        detailed_address: detailed_address.trim(),
        label,
        is_default
      };

      let err;
      if (editingAddressId) {
        const { error } = await supabase
          .from('ecommerce_addresses')
          .update(payload)
          .eq('id', editingAddressId);
        err = error;
      } else {
        const { error } = await supabase
          .from('ecommerce_addresses')
          .insert(payload);
        err = error;
      }

      if (err) throw err;

      // Reset
      setAddressForm({
        full_name: '',
        email: '',
        phone_number: '',
        alt_phone_number: '',
        province: '',
        district: '',
        city: '',
        area: '',
        detailed_address: '',
        label: 'Home',
        is_default: false
      });
      setShowAddressForm(false);
      setEditingAddressId(null);
      await fetchAddresses(user.id);
    } catch (err: any) {
      alert("Failed to save address: " + err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleToggleDefault = async (addr: Address) => {
    if (!user) return;

    const nextIsDefault = !addr.is_default;

    if (nextIsDefault) {
      const defaultAddresses = addresses.filter(a => a.is_default && a.id !== addr.id);
      if (defaultAddresses.length >= 2) {
        alert("You can choose at most 2 locations as your Default Shipping Address. Please toggle off one of your existing default addresses first.");
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('ecommerce_addresses')
        .update({ is_default: nextIsDefault })
        .eq('id', addr.id);

      if (error) throw error;
      await fetchAddresses(user.id);
    } catch (err: any) {
      alert("Failed to update default address: " + err.message);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setAddressForm({
      full_name: addr.full_name,
      email: addr.email || '',
      phone_number: addr.phone_number,
      alt_phone_number: addr.alt_phone_number || '',
      province: addr.province,
      district: addr.district,
      city: addr.city,
      area: addr.area || '',
      detailed_address: addr.detailed_address,
      label: addr.label,
      is_default: addr.is_default
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ecommerce_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses(user.id);
    } catch (err: any) {
      alert("Failed to delete address: " + err.message);
    }
  };

  // Derive Reviews lists & counts
  const unreviewedDeliveredProducts: any[] = [];
  const reviewedDeliveredProducts: any[] = [];

  orders.forEach(order => {
    if (order.status.toLowerCase() === 'delivered') {
      order.ecommerce_order_items?.forEach((item: any) => {
        if (item.ecommerce_products) {
          const prodId = item.ecommerce_products.id;
          const matchingReview = userReviews.find(r => r.product_id === prodId);
          
          const productWithMeta = {
            ...item.ecommerce_products,
            order_number: order.order_number,
            purchase_date: order.created_at,
            purchase_price: item.unit_price,
            review: matchingReview
          };

          if (matchingReview) {
            if (!reviewedDeliveredProducts.some(p => p.id === prodId)) {
              reviewedDeliveredProducts.push(productWithMeta);
            }
          } else {
            if (!unreviewedDeliveredProducts.some(p => p.id === prodId)) {
              unreviewedDeliveredProducts.push(productWithMeta);
            }
          }
        }
      });
    }
  });

  const reviewsLeftCount = unreviewedDeliveredProducts.length;

  // Active orders under pending/processing/shipped (exclude delivered/cancelled)
  const activeShipments = orders.filter(o => {
    const status = o.status.toLowerCase();
    return status === 'pending' || status === 'processing' || status === 'shipped';
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'processing': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'delivered': return 'bg-green-50 text-green-600 border border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'processing': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'shipped': return <Truck size={16} className="text-purple-500" />;
      case 'delivered': return <CheckCircle size={16} className="text-green-500" />;
      default: return <AlertTriangle size={16} className="text-red-500" />;
    }
  };

  const handleTrackOrderSearch = (e?: React.FormEvent, customOrderNum?: string) => {
    if (e) e.preventDefault();
    const queryNum = customOrderNum || trackOrderNumber;
    if (!queryNum.trim()) return;

    setTrackingError('');
    setTrackedOrder(null);

    const found = orders.find(o => o.order_number.toLowerCase() === queryNum.trim().toLowerCase());
    if (found) {
      setTrackedOrder(found);
    } else {
      // Fallback direct DB fetch if guest or other email
      setLoadingData(true);
      supabase
        .from('ecommerce_orders')
        .select('*, ecommerce_order_items(*, ecommerce_products(*))')
        .eq('order_number', queryNum.trim())
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) {
            setTrackingError('Order number not found. Please double-check.');
          } else {
            setTrackedOrder(data);
          }
          setLoadingData(false);
        });
    }
  };

  const submitReview = async (productId: string) => {
    if (!newReview.comment.trim()) {
      alert('Please write your comment before submitting.');
      return;
    }

    setSubmittingReviewId(productId);
    try {
      const { error } = await supabase
        .from('ecommerce_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          customer_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
          rating: newReview.rating,
          comment: newReview.comment,
          image_url: newReview.image_url.trim() || null
        });

      if (error) throw error;

      // Reset Form State
      setNewReview({ rating: 5, comment: '', image_url: '' });
      // Sync Core lists
      await fetchOrdersAndReviews(user.email || '', user.id);
      alert('Thank you! Your review has been added.');
    } catch (err) {
      console.error('Error submitting product review:', err);
      alert('Could not submit review. Please try again.');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex-center">
        <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-20 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* 5. PAGE CONTAINER: max-width 1440px, margin auto, padding 24px */}
      <div className="max-w-[1440px] mx-auto px-6 pt-[24px]">
        
        {/* 6. TOP PROFILE HEADER DESIGN */}
        <div 
          style={{
            background: 'white',
            borderRadius: '28px',
            padding: '28px',
            border: '1px solid #EEF2F7',
            marginBottom: '32px'
          }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* LEFT: USER NAME DESIGN & MEMBER SINCE */}
          <div className="space-y-1 shrink-0">
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>
              Hello, {profile?.full_name || 'Premium User'} 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px' }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2025'}
            </p>
          </div>

          {/* RIGHT: STATS BOXES & LOGOUT */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Stat Box 1: Total Orders */}
            <div 
              style={{
                background: '#F9FAFB',
                borderRadius: '18px',
                padding: '18px',
                minWidth: '140px'
              }}
              className="flex-1 lg:flex-initial text-center lg:text-left border border-[#EEF2F7] shadow-sm"
            >
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', lineHeight: '1.2' }}>
                {orders.length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginTop: '4px' }}>
                {orders.length === 1 ? 'Order' : 'Orders'}
              </div>
            </div>

            {/* Stat Box 2: Pending Reviews */}
            <div 
              style={{
                background: '#F9FAFB',
                borderRadius: '18px',
                padding: '18px',
                minWidth: '140px'
              }}
              className="flex-1 lg:flex-initial text-center lg:text-left border border-[#EEF2F7] shadow-sm"
            >
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', lineHeight: '1.2' }}>
                {reviewsLeftCount}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginTop: '4px' }}>
                Pending Reviews
              </div>
            </div>

            {/* Stat Box 3: Saved Addresses */}
            <div 
              style={{
                background: '#F9FAFB',
                borderRadius: '18px',
                padding: '18px',
                minWidth: '140px'
              }}
              className="flex-1 lg:flex-initial text-center lg:text-left border border-[#EEF2F7] shadow-sm"
            >
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', lineHeight: '1.2' }}>
                {addresses.length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginTop: '4px' }}>
                {addresses.length === 1 ? 'Address' : 'Addresses'}
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <button 
              onClick={handleLogout}
              style={{
                height: '42px',
                padding: '0 18px',
                borderRadius: '12px',
                background: '#FEF2F2',
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: 600
              }}
              className="hover:bg-[#FEE2E2] transition-colors cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shadow-sm border border-[#FCA5A5]/20"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* BELOW: SIDEBAR & CONTENT AREA */}
        {/* On mobile: horizontal scroll tabs. On desktop: vertical sidebar grid layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR FOR DESKTOP */}
          <div className="hidden lg:block shrink-0">
            <div 
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '18px',
                border: '1px solid #EEF2F7',
                width: '280px'
              }}
              className="space-y-2 shadow-sm"
            >
              {/* Menu Item: Account Details */}
              <button 
                onClick={() => setActiveTab('profile')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'profile' ? 600 : 500,
                  color: activeTab === 'profile' ? '#EA580C' : '#374151',
                  background: activeTab === 'profile' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <User size={18} className={activeTab === 'profile' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">Account Details</span>
              </button>

              {/* Menu Item: Address Book */}
              <button 
                onClick={() => setActiveTab('addresses')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'addresses' ? 600 : 500,
                  color: activeTab === 'addresses' ? '#EA580C' : '#374151',
                  background: activeTab === 'addresses' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <MapPin size={18} className={activeTab === 'addresses' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">Address Book</span>
              </button>

              {/* Menu Item: Order History */}
              <button 
                onClick={() => {
                  setActiveTab('orders');
                  handleSyncData();
                }}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'orders' ? 600 : 500,
                  color: activeTab === 'orders' ? '#EA580C' : '#374151',
                  background: activeTab === 'orders' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <ShoppingBag size={18} className={activeTab === 'orders' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">Order History</span>
              </button>

              {/* Menu Item: Track Package */}
              <button 
                onClick={() => setActiveTab('track')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'track' ? 600 : 500,
                  color: activeTab === 'track' ? '#EA580C' : '#374151',
                  background: activeTab === 'track' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Truck size={18} className={activeTab === 'track' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">Track Package</span>
                {activeShipments.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EA580C] text-white text-[11px] font-bold">
                    {activeShipments.length}
                  </span>
                )}
              </button>

              {/* Menu Item: My Reviews */}
              <button 
                onClick={() => setActiveTab('reviews')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'reviews' ? 600 : 500,
                  color: activeTab === 'reviews' ? '#EA580C' : '#374151',
                  background: activeTab === 'reviews' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Star size={18} className={activeTab === 'reviews' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">My Reviews</span>
                {reviewsLeftCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                    {reviewsLeftCount}
                  </span>
                )}
              </button>

              {/* Menu Item: My Vouchers */}
              <button 
                onClick={() => setActiveTab('vouchers')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeTab === 'vouchers' ? 600 : 500,
                  color: activeTab === 'vouchers' ? '#EA580C' : '#374151',
                  background: activeTab === 'vouchers' ? '#FFF7ED' : 'transparent',
                  width: '100%',
                  textAlign: 'left'
                }}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Ticket size={18} className={activeTab === 'vouchers' ? 'text-[#EA580C]' : 'text-slate-500'} />
                <span className="flex-1">My Vouchers</span>
              </button>
            </div>
          </div>

          {/* MOBILE TABS SLIDER (Scrollable horizontally) */}
          <div className="lg:hidden w-full overflow-x-auto pb-4 mb-4 flex gap-2 scrollbar-none select-none">
            {/* Tab Item: Account */}
            <button 
              onClick={() => setActiveTab('profile')}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'profile' ? '#FFF7ED' : 'white',
                color: activeTab === 'profile' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'profile' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <User size={14} />
              <span>Account</span>
            </button>

            {/* Tab Item: Addresses */}
            <button 
              onClick={() => setActiveTab('addresses')}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'addresses' ? '#FFF7ED' : 'white',
                color: activeTab === 'addresses' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'addresses' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <MapPin size={14} />
              <span>Address</span>
            </button>

            {/* Tab Item: Orders */}
            <button 
              onClick={() => {
                setActiveTab('orders');
                handleSyncData();
              }}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'orders' ? '#FFF7ED' : 'white',
                color: activeTab === 'orders' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'orders' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag size={14} />
              <span>Orders</span>
            </button>

            {/* Tab Item: Track */}
            <button 
              onClick={() => setActiveTab('track')}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'track' ? '#FFF7ED' : 'white',
                color: activeTab === 'track' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'track' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Truck size={14} />
              <span>Track</span>
              {activeShipments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EA580C] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeShipments.length}
                </span>
              )}
            </button>

            {/* Tab Item: Reviews */}
            <button 
              onClick={() => setActiveTab('reviews')}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'reviews' ? '#FFF7ED' : 'white',
                color: activeTab === 'reviews' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'reviews' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Star size={14} />
              <span>Reviews</span>
              {reviewsLeftCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {reviewsLeftCount}
                </span>
              )}
            </button>

            {/* Tab Item: Vouchers */}
            <button 
              onClick={() => setActiveTab('vouchers')}
              style={{
                height: '40px',
                borderRadius: '999px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'vouchers' ? '#FFF7ED' : 'white',
                color: activeTab === 'vouchers' ? '#EA580C' : '#374151',
                border: `1px solid ${activeTab === 'vouchers' ? '#FDBA74' : '#EEF2F7'}`
              }}
              className="shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Ticket size={14} />
              <span>Vouchers</span>
            </button>
          </div>

          {/* CONTENT AREA: 15. ALL CONTENT PANELS USE SAME STYLE */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-312px)]">
            
            {/* TAB CONTENT: PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <div 
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid #EEF2F7'
                }}
                className="space-y-6 animate-in fade-in duration-200"
              >
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Account Details</h2>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Manage your personal information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Full Name</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }} className="p-4 rounded-xl bg-slate-50 border border-gray-100">
                      {profile?.full_name || 'Not provided'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Email Address</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }} className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                      <span>{user?.email}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ADDRESS BOOK */}
            {activeTab === 'addresses' && (() => {
              const provincesList = Array.from(new Set(allLocations.map(l => l.province.trim()))).sort();
              
              const districtsList = addressForm.province
                ? Array.from(new Set(
                    allLocations
                      .filter(l => l.province.trim().toLowerCase() === addressForm.province.trim().toLowerCase())
                      .map(l => l.district.trim())
                  )).sort()
                : [];
                
              const citiesList = (addressForm.province && addressForm.district)
                ? Array.from(new Set(
                    allLocations
                      .filter(l => 
                        l.province.trim().toLowerCase() === addressForm.province.trim().toLowerCase() &&
                        l.district.trim().toLowerCase() === addressForm.district.trim().toLowerCase()
                      )
                      .map(l => l.city.trim())
                  )).sort()
                : [];

              const areasList = (addressForm.province && addressForm.district && addressForm.city)
                ? Array.from(new Set(
                    allLocations
                      .filter(l => 
                        l.province.trim().toLowerCase() === addressForm.province.trim().toLowerCase() &&
                        l.district.trim().toLowerCase() === addressForm.district.trim().toLowerCase() &&
                        l.city.trim().toLowerCase() === addressForm.city.trim().toLowerCase() &&
                        l.area !== null && l.area.trim() !== ''
                      )
                      .map(l => (l.area as string).trim())
                  )).sort()
                : [];

              const activeRoute = (addressForm.province && addressForm.district && addressForm.city)
                ? allLocations.find(l => 
                    l.province.trim().toLowerCase() === addressForm.province.trim().toLowerCase() && 
                    l.district.trim().toLowerCase() === addressForm.district.trim().toLowerCase() && 
                    l.city.trim().toLowerCase() === addressForm.city.trim().toLowerCase() && 
                    (addressForm.area ? l.area?.trim().toLowerCase() === addressForm.area.toLowerCase() : true)
                  )
                : null;

              return (
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '28px',
                    padding: '28px',
                    border: '1px solid #EEF2F7'
                  }}
                  className="space-y-6 animate-in fade-in duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Address Book</h2>
                      <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Manage up to 5 shipping locations</p>
                    </div>
                    
                    {!showAddressForm && addresses.length < 5 && (
                      <button 
                        onClick={() => {
                          setEditingAddressId(null);
                          setAddressForm({
                            full_name: '',
                            email: '',
                            phone_number: '',
                            alt_phone_number: '',
                            province: '',
                            district: '',
                            city: '',
                            area: '',
                            detailed_address: '',
                            label: 'Home',
                            is_default: false
                          });
                          setShowAddressForm(true);
                        }}
                        style={{
                          height: '44px',
                          padding: '0 18px',
                          borderRadius: '14px',
                          background: '#FF6A00',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                        className="hover:bg-[#E85D00] transition-colors cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                      >
                        <Plus size={16} />
                        <span>Add Address</span>
                      </button>
                    )}
                  </div>

                  {showAddressForm ? (
                    <form onSubmit={handleSaveAddress} className="space-y-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Receiver's Full Name *</label>
                          <input 
                            type="text"
                            required
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#FF6A00] outline-none font-medium text-slate-800 transition-all"
                            placeholder="Enter receiver's full name"
                            value={addressForm.full_name}
                            onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Phone Number *</label>
                          <input 
                            type="tel"
                            required
                            maxLength={10}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#FF6A00] outline-none font-medium text-slate-800 transition-all"
                            placeholder="Mobile number (98XXXXXXXX)"
                            value={addressForm.phone_number}
                            onChange={(e) => setAddressForm({ ...addressForm, phone_number: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Alternative Phone Number (Optional)</label>
                          <input 
                            type="tel"
                            maxLength={10}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#FF6A00] outline-none font-medium text-slate-800 transition-all"
                            placeholder="Alternative mobile number"
                            value={addressForm.alt_phone_number}
                            onChange={(e) => setAddressForm({ ...addressForm, alt_phone_number: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Email Address (Optional)</label>
                          <input 
                            type="email"
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#FF6A00] outline-none font-medium text-slate-800 transition-all"
                            placeholder="Receiver's email address"
                            value={addressForm.email}
                            onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Dropdowns */}
                      <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SearchableSelect 
                            label="Province *"
                            placeholder="Select Province"
                            options={provincesList}
                            value={addressForm.province}
                            onChange={(val) => setAddressForm({ ...addressForm, province: val, district: '', city: '', area: '' })}
                            required
                          />
                          <SearchableSelect 
                            label="District *"
                            placeholder="Select District"
                            options={districtsList}
                            value={addressForm.district}
                            onChange={(val) => setAddressForm({ ...addressForm, district: val, city: '', area: '' })}
                            disabled={!addressForm.province}
                            required
                          />
                          <SearchableSelect 
                            label="City *"
                            placeholder="Select City"
                            options={citiesList}
                            value={addressForm.city}
                            onChange={(val) => setAddressForm({ ...addressForm, city: val, area: '' })}
                            disabled={!addressForm.district}
                            required
                          />
                        </div>

                        {areasList.length > 0 && (
                          <div className="animate-in fade-in duration-200">
                            <SearchableSelect 
                              label="Area / Neighborhood *"
                              placeholder="Select Area"
                              options={areasList}
                              value={addressForm.area || ''}
                              onChange={(val) => setAddressForm({ ...addressForm, area: val })}
                              required
                            />
                          </div>
                        )}

                        {activeRoute && activeRoute.area_covered && (
                          <div className="bg-[#FFF7ED] rounded-xl p-4 border border-[#FFD8A8] flex items-center gap-3 text-orange-800 text-xs font-medium">
                            <Info size={16} className="text-[#EA580C]" />
                            <span><strong>Area Covered Details:</strong> {activeRoute.area_covered}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Detailed Street Address / Landmark *</label>
                        <textarea 
                          required
                          rows={3}
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#FF6A00] outline-none font-medium text-slate-800 transition-all resize-none"
                          placeholder="House No, Street Name, Building Name, landmark near location..."
                          value={addressForm.detailed_address}
                          onChange={(e) => setAddressForm({ ...addressForm, detailed_address: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4 border-t border-gray-100">
                        {/* Label Selector */}
                        <div className="space-y-1.5">
                          <label style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>Address Label</label>
                          <div className="flex gap-4">
                            <button 
                              type="button"
                              onClick={() => setAddressForm({ ...addressForm, label: 'Home' })}
                              style={{
                                flex: 1,
                                height: '40px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                background: addressForm.label === 'Home' ? '#FFF7ED' : '#F9FAFB',
                                color: addressForm.label === 'Home' ? '#EA580C' : '#374151',
                                border: `1px solid ${addressForm.label === 'Home' ? '#FDBA74' : '#E5E7EB'}`
                              }}
                              className="transition-all cursor-pointer shadow-sm"
                            >
                              <Home size={14} />
                              <span>Home</span>
                            </button>

                            <button 
                              type="button"
                              onClick={() => setAddressForm({ ...addressForm, label: 'Office' })}
                              style={{
                                flex: 1,
                                height: '40px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                background: addressForm.label === 'Office' ? '#FFF7ED' : '#F9FAFB',
                                color: addressForm.label === 'Office' ? '#EA580C' : '#374151',
                                border: `1px solid ${addressForm.label === 'Office' ? '#FDBA74' : '#E5E7EB'}`
                              }}
                              className="transition-all cursor-pointer shadow-sm"
                            >
                              <Briefcase size={14} />
                              <span>Office</span>
                            </button>
                          </div>
                        </div>

                        {/* Default Checkbox */}
                        <div className="flex items-center gap-3 pt-4 md:pt-6">
                          <input 
                            type="checkbox"
                            id="is_default"
                            className="w-5 h-5 rounded border-gray-300 text-[#FF6A00] focus:ring-[#FF6A00] cursor-pointer"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          />
                          <label htmlFor="is_default" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                            Set as Default Shipping Address (Max 2 default allowed)
                          </label>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button 
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddressId(null);
                          }}
                          className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={savingAddress}
                          style={{
                            height: '44px',
                            padding: '0 20px',
                            borderRadius: '14px',
                            background: '#FF6A00',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600
                          }}
                          className="hover:bg-[#E85D00] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          {savingAddress ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Address</span>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {loadingAddresses ? (
                        <div className="space-y-4">
                          {[1, 2].map(i => (
                            <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse"></div>
                          ))}
                        </div>
                      ) : addresses.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                            <MapPin size={28} />
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>No addresses found</h3>
                          <p style={{ fontSize: '14px', color: '#6B7280' }} className="max-w-sm mx-auto">
                            Your Address Book is empty. Add a shipping address now to unlock super-fast checkout!
                          </p>
                          <button 
                            onClick={() => setShowAddressForm(true)}
                            style={{
                              height: '44px',
                              padding: '0 18px',
                              borderRadius: '14px',
                              background: '#FF6A00',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 600
                            }}
                            className="hover:bg-[#E85D00] transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
                          >
                            <Plus size={16} />
                            <span>Add Your First Address</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr) => (
                            <div 
                              key={addr.id} 
                              style={{
                                border: '1.5px solid',
                                borderColor: addr.is_default ? '#FF6A00' : '#E5E7EB',
                                borderRadius: '20px',
                                padding: '20px',
                                background: addr.is_default ? '#FFF7ED' : 'white'
                              }}
                              className="transition-all hover:border-[#FF6A00] flex flex-col justify-between gap-4 shadow-sm"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{addr.full_name}</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${addr.label === 'Home' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {addr.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                                    {addr.phone_number} {addr.alt_phone_number && ` | Alt: ${addr.alt_phone_number}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleEditAddress(addr)}
                                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
                                    title="Edit Address"
                                  >
                                    <Settings size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                                    title="Delete Address"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-gray-100">
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="mb-0.5">Shipping Details</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', lineHeight: '1.4' }}>
                                  {addr.detailed_address}, {addr.area ? addr.area + ', ' : ''}{addr.city}, {addr.district}, {addr.province}
                                </div>
                              </div>

                              {/* Toggle switch */}
                              <div className="flex items-center justify-between border-t border-gray-100/50 pt-2">
                                <span className="text-[12px] font-semibold text-slate-500">Default Address</span>
                                <button 
                                  type="button"
                                  onClick={() => handleToggleDefault(addr)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${addr.is_default ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${addr.is_default ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB CONTENT: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div 
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid #EEF2F7'
                }}
                className="space-y-6 animate-in fade-in duration-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Order History</h2>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Showing all orders made from this account</p>
                  </div>
                  <button 
                    onClick={handleSyncData}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-gray-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="Sync order list"
                  >
                    <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  {loadingData ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                        <ShoppingBag size={28} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>No orders found</h3>
                      <p style={{ fontSize: '14px', color: '#6B7280' }} className="max-w-sm mx-auto">
                        It looks like you haven't placed any orders yet. Visit our store to find premium deals!
                      </p>
                      <Link 
                        href="/" 
                        style={{
                          height: '44px',
                          padding: '0 20px',
                          borderRadius: '14px',
                          background: '#FF6A00',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none'
                        }}
                        className="hover:bg-[#E85D00] transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div 
                          key={order.id}
                          style={{
                            border: '1px solid #EEF2F7',
                            borderRadius: '22px',
                            padding: '22px',
                            background: 'white'
                          }}
                          className="shadow-sm hover:shadow-md transition-shadow space-y-4"
                        >
                          {/* Order Header Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 pb-3">
                            <div className="flex items-center gap-3">
                              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                                Order #{order.order_number}
                              </span>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                              Placed on {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </div>
                          </div>

                          {/* Items Display */}
                          <div className="space-y-3 pt-1">
                            {order.ecommerce_order_items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-gray-100 overflow-hidden shrink-0">
                                  {item.ecommerce_products?.images?.[0] ? (
                                    <img src={item.ecommerce_products.images[0]} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <ImageIcon size={20} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow space-y-0.5">
                                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }} className="line-clamp-1">
                                    {item.ecommerce_products?.display_name || 'Premium Item'}
                                  </h4>
                                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                                    Qty: {item.quantity} × Rs {item.unit_price?.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total Amount & Track Row */}
                          <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Grand Total</div>
                              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                                Rs {order.total_amount?.toFixed(2)}
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setTrackOrderNumber(order.order_number);
                                setActiveTab('track');
                                handleTrackOrderSearch(undefined, order.order_number);
                              }}
                              style={{
                                height: '40px',
                                padding: '0 16px',
                                borderRadius: '12px',
                                background: '#111827',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 600
                              }}
                              className="hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Truck size={14} />
                              <span>Track Shipment</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TRACK PACKAGE */}
            {activeTab === 'track' && (
              <div 
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid #EEF2F7'
                }}
                className="space-y-6 animate-in fade-in duration-200"
              >
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Track Shipments</h2>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Track your active orders</p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-6">
                  {/* Search Input Box */}
                  <form onSubmit={(e) => handleTrackOrderSearch(e)} className="flex items-center gap-3">
                    <div className="relative flex-grow">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></span>
                      <input 
                        type="text" 
                        placeholder="Enter Order Number (e.g. ORD-12345)"
                        style={{
                          height: '52px',
                          borderRadius: '16px',
                          border: '1px solid #E5E7EB',
                          padding: '0 16px 0 44px',
                        }}
                        className="w-full focus:border-[#FF6A00] outline-none font-medium text-sm transition-all bg-slate-50"
                        value={trackOrderNumber}
                        onChange={(e) => setTrackOrderNumber(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      style={{
                        height: '52px',
                        padding: '0 20px',
                        borderRadius: '16px',
                        background: '#FF6A00',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      className="hover:bg-[#E85D00] transition-colors cursor-pointer flex items-center justify-center shadow-sm shrink-0"
                    >
                      Track
                    </button>
                  </form>

                  {/* Active Packages lists */}
                  {activeShipments.length > 0 && !trackedOrder && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-3">
                      <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Active Packages under Processing
                      </h3>
                      <div className="divide-y divide-gray-100">
                        {activeShipments.map((shipment) => (
                          <div key={shipment.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{shipment.order_number}</div>
                              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }} className="mt-0.5">
                                Placed on {new Date(shipment.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(shipment.status)}`}>
                                {shipment.status}
                              </span>
                              <button 
                                onClick={() => {
                                  setTrackOrderNumber(shipment.order_number);
                                  handleTrackOrderSearch(undefined, shipment.order_number);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-slate-800 hover:bg-slate-100 transition-colors text-[11px] font-bold shadow-sm"
                              >
                                View Timeline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trackingError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2.5 text-red-700 text-xs font-semibold">
                      <AlertTriangle size={16} />
                      <span>{trackingError}</span>
                    </div>
                  )}

                  {trackedOrder && (
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center gap-4 flex-wrap bg-slate-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Package ID</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{trackedOrder.order_number}</div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Shipment Status</div>
                          <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trackedOrder.status)}`}>
                            {trackedOrder.status}
                          </span>
                        </div>
                      </div>

                      {/* Timeline component */}
                      <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-gray-100">
                        <div className="relative flex justify-between items-center max-w-md mx-auto">
                          {/* Timeline connector lines */}
                          <div className="absolute left-4 right-4 h-1 bg-slate-200 top-1/2 -translate-y-1/2 -z-0"></div>
                          <div 
                            className="absolute left-4 h-1 bg-[#FF6A00] top-1/2 -translate-y-1/2 -z-0 transition-all duration-300"
                            style={{
                              width: 
                                trackedOrder.status.toLowerCase() === 'pending' ? '0%' :
                                trackedOrder.status.toLowerCase() === 'processing' ? '33%' :
                                trackedOrder.status.toLowerCase() === 'shipped' ? '66%' : '100%'
                            }}
                          ></div>

                          {/* Node 1: Confirmed */}
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                ['pending', 'processing', 'shipped', 'delivered'].includes(trackedOrder.status.toLowerCase())
                                  ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              <CheckCircle size={16} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700 }} className="text-gray-800 uppercase tracking-wide">Confirmed</span>
                          </div>

                          {/* Node 2: Packed */}
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                ['processing', 'shipped', 'delivered'].includes(trackedOrder.status.toLowerCase())
                                  ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              <Package size={16} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700 }} className="text-gray-800 uppercase tracking-wide">Packed</span>
                          </div>

                          {/* Node 3: Shipped */}
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                ['shipped', 'delivered'].includes(trackedOrder.status.toLowerCase())
                                  ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              <Truck size={16} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700 }} className="text-gray-800 uppercase tracking-wide">Shipped</span>
                          </div>

                          {/* Node 4: Delivered */}
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                ['delivered'].includes(trackedOrder.status.toLowerCase())
                                  ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-400'
                              }`}
                            >
                              <ShieldCheck size={16} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700 }} className="text-gray-800 uppercase tracking-wide">Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Package contents */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 space-y-3">
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Package Contents</h4>
                        <div className="space-y-2">
                          {trackedOrder.ecommerce_order_items?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100">
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-slate-50">
                                <img src={item.ecommerce_products?.images?.[0]} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }} className="line-clamp-1">
                                  {item.ecommerce_products?.display_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280' }} className="mt-0.5">
                                  Qty: {item.quantity}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MY REVIEWS */}
            {activeTab === 'reviews' && (
              <div 
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid #EEF2F7'
                }}
                className="space-y-6 animate-in fade-in duration-200"
              >
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Product Reviews</h2>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                    Rate and share your experiences on products that have been successfully delivered to you.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-8">
                  {/* Pending Reviews */}
                  <div className="space-y-4">
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" />
                      <span>Pending Reviews ({reviewsLeftCount})</span>
                    </h3>

                    {unreviewedDeliveredProducts.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        No pending reviews! You have reviewed all your delivered products.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {unreviewedDeliveredProducts.map((p) => (
                          <div 
                            key={p.id}
                            style={{
                              border: '1px solid #EEF2F7',
                              borderRadius: '20px',
                              padding: '20px',
                              background: 'white'
                            }}
                            className="space-y-4 shadow-sm"
                          >
                            <div className="flex gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-slate-50">
                                <img src={p.images?.[0]} className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-1">
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }} className="line-clamp-1">
                                  {p.display_name}
                                </h4>
                                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                                  Purchased for Rs {p.purchase_price?.toFixed(2)} (Order: {p.order_number})
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 space-y-4">
                              {/* Star Selector */}
                              <div className="flex gap-1.5 items-center">
                                {[1, 2, 3, 4, 5].map((stars) => (
                                  <button 
                                    key={stars}
                                    type="button"
                                    onClick={() => setNewReview(prev => ({ ...prev, rating: stars }))}
                                    className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                  >
                                    <Star 
                                      size={20} 
                                      fill={stars <= newReview.rating ? "currentColor" : "none"} 
                                    />
                                  </button>
                                ))}
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-2 bg-white px-2 py-0.5 rounded border border-gray-200">
                                  {newReview.rating} Stars
                                </span>
                              </div>

                              {/* Comment textarea */}
                              <textarea 
                                placeholder="What did you like or dislike? How was the quality?"
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-[#FF6A00] outline-none bg-white font-medium text-xs leading-relaxed transition-all resize-none h-20"
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                              />

                              {/* Image Attachment */}
                              <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex flex-col items-center justify-center w-28 h-20 border border-dashed border-slate-300 hover:border-slate-800 rounded-xl cursor-pointer transition-colors bg-white hover:bg-slate-50 shrink-0">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageUpload} 
                                    disabled={uploadingImage}
                                  />
                                  {uploadingImage ? (
                                    <Loader2 className="animate-spin text-slate-400" size={18} />
                                  ) : (
                                    <div className="flex flex-col items-center text-slate-500">
                                      <Camera size={18} />
                                      <span className="text-[9px] font-bold uppercase mt-1">Add Photo</span>
                                    </div>
                                  )}
                                </label>

                                {newReview.image_url.trim() && (
                                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                    <img src={newReview.image_url} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setNewReview(prev => ({ ...prev, image_url: '' }))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors font-bold text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}

                                <button 
                                  onClick={() => submitReview(p.id)}
                                  disabled={submittingReviewId === p.id}
                                  style={{
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: '#FF6A00',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '13px'
                                  }}
                                  className="hover:bg-[#E85D00] transition-colors cursor-pointer px-5 flex items-center justify-center gap-1.5 ml-auto shadow-sm disabled:opacity-50"
                                >
                                  {submittingReviewId === p.id ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" />
                                      <span>Submitting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} />
                                      <span>Submit Review</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submitted Reviews */}
                  {reviewedDeliveredProducts.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Submitted Reviews ({reviewedDeliveredProducts.length})</span>
                      </h3>

                      <div className="space-y-4">
                        {reviewedDeliveredProducts.map((p) => (
                          <div 
                            key={p.id}
                            style={{
                              border: '1px solid #EEF2F7',
                              borderRadius: '20px',
                              padding: '20px',
                              background: 'white'
                            }}
                            className="space-y-4 shadow-sm"
                          >
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-slate-50">
                                <img src={p.images?.[0]} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }} className="line-clamp-1">
                                  {p.display_name}
                                </h4>
                                <div style={{ fontSize: '11px', color: '#6B7280' }} className="mt-0.5">
                                  Reviewed on {new Date(p.review?.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex gap-4 items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex gap-0.5 text-amber-500">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                      key={s} 
                                      size={10} 
                                      fill={s <= (p.review?.rating || 5) ? "currentColor" : "none"} 
                                    />
                                  ))}
                                </div>
                                <p style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563', lineHeight: '1.5' }} className="italic">
                                  &ldquo;{p.review?.comment}&rdquo;
                                </p>
                              </div>

                              {p.review?.image_url && (
                                <a 
                                  href={p.review.image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200 shadow-sm block hover:scale-105 transition-transform"
                                >
                                  <img src={p.review.image_url} className="w-full h-full object-cover" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MY VOUCHERS */}
            {activeTab === 'vouchers' && (
              <div 
                style={{
                  background: 'white',
                  borderRadius: '28px',
                  padding: '28px',
                  border: '1px solid #EEF2F7'
                }}
                className="space-y-6 animate-in fade-in duration-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>My Voucher Wallet</h2>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      Claim exclusive discounts and loyalty rewards
                    </p>
                  </div>
                  <button 
                    onClick={handleSyncData}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-gray-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="Sync collected vouchers"
                  >
                    <RefreshCw size={16} className={loadingVouchers ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-6">
                  {loadingVouchers ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Collected Vouchers */}
                      <div className="space-y-4">
                        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Collected Vouchers
                        </h3>

                        {userVouchers.filter(v => v.status === 'collected' && new Date(v.expires_at) > new Date()).length === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                            <span style={{ fontSize: '36px' }}>🎁</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>
                              No vouchers collected yet
                            </span>
                            <Link 
                              href="/" 
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                background: '#FF6A00',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              className="hover:bg-[#E85D00] transition-colors shadow-sm mt-1"
                            >
                              Start Shopping
                            </Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userVouchers.filter(v => v.status === 'collected' && new Date(v.expires_at) > new Date()).map((col) => {
                              const v = col.ecommerce_vouchers;
                              if (!v) return null;
                              const hoursLeft = Math.max(0, Math.round((new Date(col.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));
                              
                              return (
                                <div 
                                  key={col.id} 
                                  style={{
                                    background: '#FFF7ED',
                                    border: '1px dashed #FDBA74',
                                    borderRadius: '20px',
                                    padding: '18px'
                                  }}
                                  className="relative overflow-hidden flex flex-col justify-between gap-4 shadow-sm"
                                >
                                  <div>
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="px-2 py-0.5 bg-orange-100 text-[#EA580C] text-[10px] font-bold uppercase rounded-md">
                                        Collected Offer
                                      </span>
                                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                        <Clock size={11} /> {hoursLeft}h Left
                                      </span>
                                    </div>

                                    <div className="mt-3">
                                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                                        {v.discount_type === 'percent' ? `${v.discount_value}% Off` : `Rs ${v.discount_value} Off`}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginTop: '2px' }}>
                                        {v.type === 'product_wise' && "Applicable on Specific Product"}
                                        {v.type === 'campaign' && (v.campaign_target === 'shipping' ? "Applicable on Shipping only" : "Whole Store Discount")}
                                        {v.type === 'secret' && "Exclusive Secret Reward"}
                                        {v.type === 'new_user' && "Welcome New Signup Offer"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-orange-100/50 mt-1">
                                    <span className="font-mono font-bold text-sm text-[#111827] tracking-wider select-all">{v.code}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Copy to checkout</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Available Vouchers to collect */}
                      {vouchersList.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Available Vouchers
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vouchersList.map((v) => (
                              <div 
                                key={v.id} 
                                style={{
                                  border: '1px solid #EEF2F7',
                                  borderRadius: '20px',
                                  padding: '20px',
                                  background: 'white'
                                }}
                                className="flex flex-col justify-between gap-4 shadow-sm"
                              >
                                <div>
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md border border-gray-200">
                                      Claimable
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400">
                                      Ends {new Date(v.end_date).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                                      {v.type === 'product_wise' ? (
                                        `Discount of ${v.discount_type === 'percent' ? v.discount_value + '%' : 'Rs ' + v.discount_value} on product`
                                      ) : v.type === 'campaign' ? (
                                        v.campaign_target === 'shipping' 
                                          ? `Rs ${v.discount_value} off on Shipping`
                                          : `Get ${v.discount_type === 'percent' ? v.discount_value + '%' : 'Rs ' + v.discount_value} discount storewide`
                                      ) : v.type === 'new_user' ? (
                                        `Welcome Offer: ${v.discount_type === 'percent' ? v.discount_value + '%' : 'Rs ' + v.discount_value} off`
                                      ) : (
                                        `Exclusive: ${v.discount_type === 'percent' ? v.discount_value + '%' : 'Rs ' + v.discount_value} discount`
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                        Code: <strong className="font-mono text-slate-800 ml-1">{v.code}</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => handleCollectVoucher(v)}
                                  style={{
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: '#111827',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 600
                                  }}
                                  className="hover:bg-slate-800 transition-colors cursor-pointer w-full flex items-center justify-center shadow-sm"
                                >
                                  Collect Voucher
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
