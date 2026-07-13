'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/utils/analytics';
import { sendMetaCapiEvent } from '@/app/actions/metaCapi';
import { 
  ArrowLeft,
  ArrowRight,
  Package,
  AlertCircle,
  Tag,
  RefreshCw,
  Search,
  Clock,
  Info,
  Ticket,
  Check,
  Truck
} from 'lucide-react';
import Link from 'next/link';

// --- Custom Premium Searchable Dropdown ---
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  disabled = false,
  required = false,
  triggerLabel
}: { 
  options: { id: string | number, name: string, triggerLabel?: string }[], 
  value: string | number, 
  onChange: (val: string) => void, 
  placeholder: string,
  label: string,
  disabled?: boolean,
  required?: boolean,
  triggerLabel?: (opt: { id: string | number, name: string }) => string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => String(opt.id) === String(value));

  // What to show in the closed trigger box (short label if provided, else full name)
  const displayInTrigger = selectedOption
    ? (triggerLabel ? triggerLabel(selectedOption) : selectedOption.name)
    : placeholder;

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
    <div className="space-y-2 relative text-left" ref={dropdownRef}>
      <label className="block text-[14px] font-[500] text-[#374151] mb-[8px] select-none">{label} {required && '*'}</label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full cursor-pointer transition-all duration-200"
        style={{
          height: '52px',
          borderRadius: '14px',
          border: isOpen ? '1.5px solid #FF6A00' : '1.5px solid #E5E7EB',
          padding: '0 14px',
          fontSize: '15px',
          background: 'white',
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <span 
          className={selectedOption ? 'text-[#111827] font-[500]' : 'text-gray-400'}
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            display: 'block'
          }}
        >
          {displayInTrigger}
        </span>
        <Search size={16} className="text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#EEF2F7] overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input 
              autoFocus
              type="text" 
              placeholder="Type to search..."
              className="w-full h-[40px] px-3 bg-gray-50 rounded-lg text-sm font-medium outline-none border border-gray-100 focus:border-[#FF6A00] transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(String(opt.id));
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors flex items-start justify-between group ${String(opt.id) === String(value) ? 'bg-orange-50/50' : ''}`}
                >
                  <span className={`text-[14px] font-[500] flex-1 mr-3 whitespace-normal break-words leading-snug ${String(opt.id) === String(value) ? 'text-[#FF6A00]' : 'text-[#374151]'}`}>
                    {opt.name}
                  </span>
                  {String(opt.id) === String(value) && <Check size={14} className="text-[#FF6A00] stroke-[3] shrink-0 mt-0.5" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-400 text-xs font-semibold">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DeliveryLocation {
  id: string;
  province: string;
  district: string;
  city: string;
  area?: string;
  area_covered?: string;
  delivery_charge: number;
  delivery_time: string;
}

export default function CheckoutPage() {
  const { items, getTotal, validatePrices } = useCart();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    altPhone: '',
    deliveryAddress: ''
  });
  
  // Delivery Location State
  const [allLocations, setAllLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLoc, setSelectedLoc] = useState({
    province: '',
    district: '',
    city: '',
    area: ''
  });
  const [activeRoute, setActiveRoute] = useState<DeliveryLocation | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Address Book Integration States
  const [defaultAddresses, setDefaultAddresses] = useState<any[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(null);

  // Voucher coupon Integration States
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [collectedVouchers, setCollectedVouchers] = useState<any[]>([]);
  const [loadingCollectedVouchers, setLoadingCollectedVouchers] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (items.length === 0 && isMounted) {
      router.push('/');
    }
    if (isMounted) {
      fetchDeliveryLocations();
      loadAuthenticatedUser();
      validatePrices(supabase);
      if (items.length > 0) {
        trackEvent('checkout_start');

        // Trigger Meta Pixel & CAPI InitiateCheckout
        const triggerInitiateCheckout = async () => {
          const eventId = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

          // 1. Client-side Pixel InitiateCheckout
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
              content_ids: items.map(i => i.id),
              content_type: 'product',
              value: totalValue,
              currency: 'NPR',
              num_items: items.reduce((sum, i) => sum + i.quantity, 0)
            }, { eventID: eventId });
          }

          // 2. Server-side Conversions API InitiateCheckout
          try {
            const { data: { user } } = await supabase.auth.getUser();
            await sendMetaCapiEvent({
              eventName: 'InitiateCheckout',
              eventId: eventId,
              customData: {
                content_ids: items.map(i => i.id),
                content_type: 'product',
                value: totalValue,
                currency: 'NPR',
                num_items: items.reduce((sum, i) => sum + i.quantity, 0)
              },
              userData: user ? {
                email: user.email || undefined,
                phone: user.phone || undefined
              } : undefined
            });
          } catch (err) {
            console.warn('Meta CAPI InitiateCheckout tracking error:', err);
          }
        };
        triggerInitiateCheckout();
      }
    }
  }, [items, isMounted]);

  const loadAuthenticatedUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || prev.fullName
      }));

      // Fetch default shipping addresses (up to 2)
      setLoadingDefaults(true);
      try {
        const { data: addrs } = await supabase
          .from('ecommerce_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .limit(2);
        if (addrs) {
          setDefaultAddresses(addrs);
          
          // Auto select first default address if available
          if (addrs.length > 0) {
            const first = addrs[0];
            setActiveAddressId(first.id);
            setFormData(prev => ({
              ...prev,
              fullName: first.full_name,
              email: first.email || prev.email,
              phone: first.phone_number,
              altPhone: first.alt_phone_number || '',
              deliveryAddress: first.detailed_address
            }));
            setSelectedLoc({
              province: first.province,
              district: first.district,
              city: first.city,
              area: first.area || ''
            });
          }
        }
      } catch (err) {
        console.error('Error loading default addresses:', err);
      } finally {
        setLoadingDefaults(false);
      }

      // Fetch user's collected active vouchers
      setLoadingCollectedVouchers(true);
      try {
        const now = new Date().toISOString();
        const { data: userVouchersData } = await supabase
          .from('ecommerce_user_vouchers')
          .select('*, ecommerce_vouchers(*)')
          .eq('user_id', user.id)
          .eq('status', 'collected')
          .gt('expires_at', now);
          
        if (userVouchersData) {
          const list = userVouchersData
            .filter((uv: any) => uv.ecommerce_vouchers !== null)
            .map((uv: any) => ({
              ...uv.ecommerce_vouchers,
              userVoucherId: uv.id,
              expires_at: uv.expires_at
            }));
          setCollectedVouchers(list);
        }
      } catch (err) {
        console.error('Error fetching collected vouchers:', err);
      } finally {
        setLoadingCollectedVouchers(false);
      }
    }
  };

  const fetchDeliveryLocations = async () => {
    setLoadingLocations(true);
    const { data } = await supabase
      .from('ecommerce_delivery_locations')
      .select('*');
    
    if (data) setAllLocations(data);
    setLoadingLocations(false);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setApplyingVoucher(true);
    setVoucherError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setVoucherError("Please login to use vouchers.");
        setApplyingVoucher(false);
        return;
      }

      const now = new Date().toISOString();

      // Find active voucher with the code
      const { data: voucher, error: vError } = await supabase
        .from('ecommerce_vouchers')
        .select('*')
        .eq('code', voucherCode.trim())
        .eq('is_active', true)
        .gt('end_date', now)
        .maybeSingle();

      if (vError || !voucher) {
        setVoucherError("Invalid or expired voucher code.");
        setApplyingVoucher(false);
        return;
      }

      // Check if user has collected it and it is still valid
      const { data: userVoucher, error: uvError } = await supabase
        .from('ecommerce_user_vouchers')
        .select('*')
        .eq('user_id', user.id)
        .eq('voucher_id', voucher.id)
        .eq('status', 'collected')
        .gt('expires_at', now)
        .maybeSingle();

      if (uvError || !userVoucher) {
        setVoucherError("You haven't collected this voucher or it has expired.");
        setApplyingVoucher(false);
        return;
      }

      // Voucher rules check
      if (voucher.type === 'product_wise') {
        const hasProduct = items.some(item => item.id === voucher.specific_product_id);
        if (!hasProduct) {
          setVoucherError("This voucher is only applicable for a specific product not in your cart.");
          setApplyingVoucher(false);
          return;
        }
      }

      // Success
      setAppliedVoucher({
        ...voucher,
        userVoucherId: userVoucher.id
      });
      setVoucherError('');
    } catch (err) {
      console.error(err);
      setVoucherError("Error applying voucher. Please try again.");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleSelectCollectedVoucher = (voucher: any) => {
    setVoucherError('');
    if (appliedVoucher?.id === voucher.id) {
      setAppliedVoucher(null);
      setVoucherCode('');
      return;
    }

    if (voucher.type === 'product_wise') {
      const hasProduct = items.some(item => item.id === voucher.specific_product_id);
      if (!hasProduct) {
        setVoucherError("This voucher is only applicable for a specific product not in your cart.");
        return;
      }
    }

    setAppliedVoucher(voucher);
    setVoucherCode(voucher.code);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setActiveAddressId(null);
  };

  // --- Strict Deduplication Logic (Case Insensitive) ---
  const getUniqueItems = (itemsList: string[]) => {
    const seen = new Set();
    return itemsList
      .map(item => item.trim())
      .filter(item => {
        const lower = item.toLowerCase();
        if (seen.has(lower) || item === '') return false;
        seen.add(lower);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  };

  const provinces = getUniqueItems(allLocations.map(l => l.province))
    .map(name => ({ id: name, name }));
  
  const districts = getUniqueItems(allLocations
    .filter(l => l.province.trim().toLowerCase() === selectedLoc.province.toLowerCase())
    .map(l => l.district))
    .map(name => ({ id: name, name }));
    
  const cities = getUniqueItems(allLocations
    .filter(l => 
      l.province.trim().toLowerCase() === selectedLoc.province.toLowerCase() && 
      l.district.trim().toLowerCase() === selectedLoc.district.toLowerCase()
    )
    .map(l => l.city))
    .map(name => ({ id: name, name }));
    
  const areas = getUniqueItems(allLocations
    .filter(l => 
      l.province.trim().toLowerCase() === selectedLoc.province.toLowerCase() && 
      l.district.trim().toLowerCase() === selectedLoc.district.toLowerCase() &&
      l.city.trim().toLowerCase() === selectedLoc.city.toLowerCase() &&
      l.area && l.area.trim() !== ''
    )
    .map(l => l.area!))
    .map(name => ({ id: name, name }));

  useEffect(() => {
    if (selectedLoc.province && selectedLoc.district && selectedLoc.city) {
      // Find all matches for this city (case-insensitive)
      const cityMatches = allLocations.filter(l => 
        l.province.trim().toLowerCase() === selectedLoc.province.toLowerCase() && 
        l.district.trim().toLowerCase() === selectedLoc.district.toLowerCase() && 
        l.city.trim().toLowerCase() === selectedLoc.city.toLowerCase()
      );

      let match: DeliveryLocation | null = null;

      if (cityMatches.length > 0) {
        // Find the match with the highest delivery charge in this city
        const highestChargeMatch = cityMatches.reduce((max, item) => 
          item.delivery_charge > max.delivery_charge ? item : max, 
          cityMatches[0]
        );

        const hasMultipleEntries = cityMatches.length > 1;

        if (selectedLoc.area && selectedLoc.area !== 'None of Above' && selectedLoc.area !== 'None of Above / Different Address') {
          // Find the exact match for this area
          const areaMatch = cityMatches.find(l => 
            l.area?.trim().toLowerCase() === selectedLoc.area.toLowerCase()
          );

          if (areaMatch) {
            if (hasMultipleEntries) {
              // If city name has multiple entries, use the high shipping fee amount
              match = {
                ...areaMatch,
                delivery_charge: highestChargeMatch.delivery_charge
              };
            } else {
              match = areaMatch;
            }
          } else {
            // Fall back to highest charge match if no specific area match
            match = highestChargeMatch;
          }
        } else {
          // If "None of Above", "None of Above / Different Address", or area not selected yet
          match = highestChargeMatch;
        }
      }

      setActiveRoute(match);
    } else {
      setActiveRoute(null);
    }
  }, [selectedLoc, allLocations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.phone.replace(/\D/g, '').length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!selectedLoc.province || !selectedLoc.district || !selectedLoc.city) {
      alert("Please select your Province, District, and City.");
      return;
    }

    const cityHasAreas = allLocations.some(l => 
      l.province.trim().toLowerCase() === selectedLoc.province.toLowerCase() && 
      l.district.trim().toLowerCase() === selectedLoc.district.toLowerCase() && 
      l.city.trim().toLowerCase() === selectedLoc.city.toLowerCase() && 
      l.area && l.area.trim() !== ''
    );

    if (cityHasAreas && !selectedLoc.area) {
      alert("Please select an Area / Neighborhood.");
      return;
    }

    if ((selectedLoc.area === 'None of Above' || selectedLoc.area === 'None of Above / Different Address') && !formData.deliveryAddress.trim()) {
      alert("Since you selected '" + selectedLoc.area + "', please enter your exact Detailed Address (House No, Street, Landmark) so we can locate you.");
      return;
    }

    if (!activeRoute) {
      alert("Please select a valid delivery route completely.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save completed checkout information to localStorage
      localStorage.setItem('checkout_data', JSON.stringify({
        formData,
        selectedLoc,
        activeRoute,
        appliedVoucher
      }));

      // Trigger Meta Pixel & CAPI AddPaymentInfo (deduplicated)
      const triggerAddPaymentInfo = async () => {
        const eventId = `payment_info_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // 1. Client-side Pixel AddPaymentInfo
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'AddPaymentInfo', {
            content_ids: items.map(i => i.id),
            content_type: 'product',
            value: totalValue,
            currency: 'NPR'
          }, { eventID: eventId });
        }

        // 2. Server-side CAPI AddPaymentInfo
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await sendMetaCapiEvent({
            eventName: 'AddPaymentInfo',
            eventId: eventId,
            customData: {
              content_ids: items.map(i => i.id),
              content_type: 'product',
              value: totalValue,
              currency: 'NPR'
            },
            userData: {
              email: formData.email || user?.email || undefined,
              phone: formData.phone || user?.phone || undefined,
              fullName: formData.fullName || undefined
            }
          });
        } catch (e) {
          console.warn('Meta CAPI AddPaymentInfo error:', e);
        }
      };
      triggerAddPaymentInfo();

      // Redirect directly to the Choose Payment Method subpage
      router.push('/checkout/payment');
    } catch (error: any) {
      alert('Error saving checkout details: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingFee = activeRoute?.delivery_charge || 0;

  // Calculate discounts based on applied voucher
  let productDiscount = 0;
  let shippingDiscount = 0;

  if (appliedVoucher) {
    if (appliedVoucher.type === 'product_wise') {
      const targetItem = items.find(i => i.id === appliedVoucher.specific_product_id);
      if (targetItem) {
        const targetSubtotal = targetItem.price * targetItem.quantity;
        if (appliedVoucher.discount_type === 'percent') {
          productDiscount = (targetSubtotal * appliedVoucher.discount_value) / 100;
        } else {
          productDiscount = Math.min(targetSubtotal, appliedVoucher.discount_value);
        }
      }
    } else if (appliedVoucher.type === 'campaign' && appliedVoucher.campaign_target === 'shipping') {
      if (appliedVoucher.discount_type === 'percent') {
        shippingDiscount = (shippingFee * appliedVoucher.discount_value) / 100;
      } else {
        shippingDiscount = Math.min(shippingFee, appliedVoucher.discount_value);
      }
    } else {
      if (appliedVoucher.discount_type === 'percent') {
        productDiscount = (getTotal() * appliedVoucher.discount_value) / 100;
      } else {
        productDiscount = Math.min(getTotal(), appliedVoucher.discount_value);
      }
    }
  }

  const finalSubtotal = Math.max(0, getTotal() - productDiscount);
  const finalShippingFee = Math.max(0, shippingFee - shippingDiscount);
  const grandTotal = finalSubtotal + finalShippingFee;

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <RefreshCw className="animate-spin text-gray-300" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-36 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* 3. PAGE CONTAINER: Max 1440px, margin auto, padding 24px, mt-20 to fix huge gap like product page */}
      <div className="container max-w-[1440px] mx-auto px-6 mt-[20px] pb-12">
        
        {/* Checkout Header Design & Spacing */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-gray-100/60 mb-8 text-left">
          {/* 5. HEADER TITLE STYLE */}
          <h1 
            className="text-[26px] md:text-[34px] font-[700] text-[#111827] tracking-[-0.3px] leading-[1.2]"
          >
            Checkout
          </h1>
          {/* 6. SUB HEADER STYLE */}
          <div 
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: '#6B7280'
            }}
            className="flex items-center gap-1.5"
          >
            <span>🔒 Secure Checkout</span>
            <span>·</span>
            <span>{items.length} Item{items.length !== 1 ? 's' : ''} in Bag</span>
          </div>
        </div>

        {/* 2. Layout Ratio - Left Contact/Shipping 65% | Right Order Summary 35% */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-8 items-start">
          
          {/* 7. MAIN LEFT SECTION DESIGN - lightweight cards with 20px gap */}
          <div className="flex flex-col gap-[20px]">
            
            <form onSubmit={handleSubmit} id="checkout-form" className="flex flex-col gap-[20px]">
              
              {/* 10. SAVED ADDRESS SECTION (Only shown if user has saved default addresses) */}
              {defaultAddresses.length > 0 && (
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '22px',
                    padding: '24px',
                    border: '1px solid #EEF2F7'
                  }}
                  className="shadow-sm"
                >
                  <h2 
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '18px'
                    }}
                    className="text-left"
                  >
                    Saved Addresses
                  </h2>
                  
                  {/* Selectable Address Card Design Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {defaultAddresses.map((addr) => {
                      const isActive = activeAddressId === addr.id;
                      return (
                        <div 
                          key={addr.id}
                          onClick={() => {
                            setActiveAddressId(addr.id);
                            setFormData({
                              fullName: addr.full_name,
                              email: addr.email || '',
                              phone: addr.phone_number,
                              altPhone: addr.alt_phone_number || '',
                              deliveryAddress: addr.detailed_address
                            });
                            setSelectedLoc({
                              province: addr.province,
                              district: addr.district,
                              city: addr.city,
                              area: addr.area || ''
                            });
                          }}
                          className="transition-all duration-200 text-left cursor-pointer select-none"
                          style={{
                            border: isActive ? '1.5px solid #FF6A00' : '1.5px solid #E5E7EB',
                            borderRadius: '18px',
                            padding: '18px',
                            background: isActive ? '#FFF7ED' : 'white',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.borderColor = '#FF6A00';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.borderColor = '#E5E7EB';
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            {/* 13. ADDRESS LABEL DESIGN */}
                            <span 
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                background: isActive ? 'rgba(255,106,0,0.08)' : '#F3F4F6',
                                padding: '5px 10px',
                                borderRadius: '999px',
                                display: 'inline-block',
                                color: isActive ? '#FF6A00' : '#4B5563'
                              }}
                            >
                              {addr.label}
                            </span>
                            {isActive ? (
                              <span className="text-[#FF6A00] font-bold text-xs flex items-center gap-1">
                                <Check size={12} strokeWidth={3} /> Selected
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Use Address</span>
                            )}
                          </div>
                          
                          <div className="font-bold text-gray-900 text-sm mb-1">{addr.full_name}</div>
                          <div className="text-xs text-gray-500 mb-2 font-[500]">{addr.phone_number}</div>
                          <div className="text-xs text-gray-700 font-semibold line-clamp-2 leading-relaxed">
                            {addr.detailed_address}, {addr.area ? addr.area + ', ' : ''}{addr.city}, {addr.district}, {addr.province}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 8. SECTION CARD DESIGN: Contact Information */}
              <div 
                style={{
                  background: 'white',
                  borderRadius: '22px',
                  padding: '24px',
                  border: '1px solid #EEF2F7'
                }}
                className="shadow-sm"
              >
                {/* 9. SECTION TITLE DESIGN */}
                <h2 
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '18px'
                  }}
                  className="text-left"
                >
                  Contact Information
                </h2>
                
                {/* 18. FORM LAYOUT & 14. INPUT DESIGN */}
                <div className="flex flex-col gap-5">
                  {/* Row 1: Full Name */}
                  <div className="text-left">
                    {/* 17. LABEL DESIGN */}
                    <label className="block text-[14px] font-[500] text-[#374151] mb-[8px]">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter your full name"
                      className="w-full px-[16px] outline-none transition-all duration-200"
                      style={{
                        height: '52px',
                        borderRadius: '14px',
                        border: '1px solid #E5E7EB',
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#111827',
                        background: 'white'
                      }}
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF6A00';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,106,0,0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Row 2: Email & Phone Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="text-left">
                      <label className="block text-[14px] font-[500] text-[#374151] mb-[8px]">Email (Optional)</label>
                      <input 
                        type="email" 
                        placeholder="your@email.com"
                        className="w-full px-[16px] outline-none transition-all duration-200"
                        style={{
                          height: '52px',
                          borderRadius: '14px',
                          border: '1px solid #E5E7EB',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#111827',
                          background: 'white'
                        }}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#FF6A00';
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,106,0,0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-[14px] font-[500] text-[#374151] mb-[8px]">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        maxLength={10} 
                        placeholder="98XXXXXXXX"
                        className="w-full px-[16px] outline-none transition-all duration-200"
                        style={{
                          height: '52px',
                          borderRadius: '14px',
                          border: '1px solid #E5E7EB',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: '#111827',
                          background: 'white'
                        }}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#FF6A00';
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,106,0,0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Alternative Phone */}
                  <div className="text-left">
                    <label className="block text-[14px] font-[500] text-[#374151] mb-[8px]">Alternative Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      placeholder="Alternative mobile number"
                      className="w-full px-[16px] outline-none transition-all duration-200"
                      style={{
                        height: '52px',
                        borderRadius: '14px',
                        border: '1px solid #E5E7EB',
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#111827',
                        background: 'white'
                      }}
                      value={formData.altPhone}
                      onChange={(e) => handleInputChange('altPhone', e.target.value)}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF6A00';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255,106,0,0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 8. SECTION CARD DESIGN: Delivery Information */}
              <div 
                style={{
                  background: 'white',
                  borderRadius: '22px',
                  padding: '24px',
                  border: '1px solid #EEF2F7'
                }}
                className="shadow-sm"
              >
                <h2 
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '18px'
                  }}
                  className="text-left"
                >
                  Delivery Information
                </h2>
                
                <div className="flex flex-col gap-5">
                  
                  {/* Row 4: Province & District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SearchableSelect 
                      label="Province"
                      placeholder="Select Province"
                      options={provinces}
                      value={selectedLoc.province}
                      onChange={(val) => {
                        setSelectedLoc({ province: val, district: '', city: '', area: '' });
                        setActiveAddressId(null);
                      }}
                      required
                    />
                    <SearchableSelect 
                      label="District"
                      placeholder="Select District"
                      disabled={!selectedLoc.province}
                      options={districts}
                      value={selectedLoc.district}
                      onChange={(val) => {
                        setSelectedLoc({ ...selectedLoc, district: val, city: '', area: '' });
                        setActiveAddressId(null);
                      }}
                      required
                    />
                  </div>

                  {/* Row 5: City / Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SearchableSelect 
                      label="City"
                      placeholder="Select City"
                      disabled={!selectedLoc.district}
                      options={cities}
                      value={selectedLoc.city}
                      onChange={(val) => {
                        setSelectedLoc({ ...selectedLoc, city: val, area: '' });
                        setActiveAddressId(null);
                      }}
                      required
                    />
                    
                    <SearchableSelect 
                      label="Area / Neighborhood"
                      placeholder="Select Area"
                      disabled={!selectedLoc.city}
                      options={[
                        ...areas,
                        { id: 'None of Above / Different Address', name: '📍 None of Above / Different Address' }
                      ]}
                      value={selectedLoc.area}
                      onChange={(val) => {
                        setSelectedLoc({ ...selectedLoc, area: val });
                        setActiveAddressId(null);
                      }}
                      required
                      triggerLabel={(opt) => {
                        // For areas with long comma-separated names, show only the first part
                        const name = opt.name.replace(/^📍 /, '');
                        if (name === 'None of Above / Different Address') return '📍 Different Address';
                        const parts = name.split(',');
                        if (parts.length > 2) return parts.slice(0, 2).join(',').trim() + '...';
                        return name;
                      }}
                    />
                  </div>

                  {/* Active Route Delivery Badge */}
                  {activeRoute && (
                    <div 
                      className="rounded-[18px] p-6 flex flex-col md:flex-row justify-between items-center gap-4 animate-in zoom-in-95 duration-300 text-left w-full border border-orange-100"
                      style={{
                        background: '#FFF7ED'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center text-[#FF6A00] shadow-sm shrink-0">
                          <Clock size={22} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">Estimated Delivery</div>
                          <div className="text-base font-bold text-gray-900">{activeRoute.delivery_time || 'Standard Time'}</div>
                          {activeRoute.area_covered && (
                            <div className="text-xs font-[500] text-gray-500 mt-0.5 flex items-center gap-1">
                              <Info size={12} className="text-[#FF6A00]" /> {activeRoute.area_covered}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right self-stretch md:self-auto flex md:flex-col justify-between md:justify-start items-center md:items-end">
                        <div className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">Shipping Fee</div>
                        <div className="text-2xl font-black text-gray-900 mt-0.5">Rs. {activeRoute.delivery_charge}</div>
                      </div>
                    </div>
                  )}

                  {/* Row 6: Detailed Address Textarea */}
                  <div className="text-left">
                    <label className="block text-[14px] font-[500] text-[#374151] mb-[8px]">
                      Detailed Address (House No, Street, Landmark) {selectedLoc.area === 'None of Above / Different Address' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                      required={selectedLoc.area === 'None of Above / Different Address'} 
                      rows={3} 
                      placeholder="Enter your exact detailed address"
                      className="w-full px-[16px] py-[14px] rounded-[16px] border border-[#E5E7EB] text-[15px] font-[500] text-[#111827] bg-white outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-[#FF6A00]/12 transition-all duration-200 resize-none"
                      style={{
                        minHeight: '120px',
                        lineHeight: '1.7'
                      }}
                      value={formData.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* 24. RIGHT SIDE ORDER SUMMARY (35% on desktop) */}
          <div className="lg:col-span-1">
            
            {/* 25. ORDER SUMMARY CARD */}
            <div 
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #EEF2F7',
                position: 'sticky',
                top: '100px'
              }}
              className="shadow-sm"
            >
              {/* 26. ORDER SUMMARY TITLE */}
              <h2 
                className="text-lg md:text-[22px] font-[700] text-[#111827] mb-[20px] text-left"
              >
                Order Summary
              </h2>
              
              {/* 27. PRODUCT ITEM DESIGN */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center py-2 border-b border-gray-50 last:border-0 text-left">
                    {/* PRODUCT IMAGE STYLE */}
                    <div 
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '14px',
                        background: '#FAFAFA',
                        padding: '8px'
                      }}
                      className="flex items-center justify-center shrink-0 border border-gray-100"
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.display_name} 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <span className="text-[10px] text-gray-300">No Image</span>
                      )}
                    </div>
                    
                    {/* PRODUCT NAME STYLE */}
                    <div className="flex-1 min-w-0">
                      <h4 
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          color: '#111827'
                        }}
                        className="line-clamp-2"
                      >
                        {item.display_name}
                      </h4>
                      {item.selected_variation && (
                        <div className="text-[11px] text-[#FF6A00] font-semibold mt-1">
                          Variation : {item.selected_variation}
                        </div>
                      )}
                      <div className="text-[12px] text-[#6B7280] font-medium mt-1">
                        Qty {item.quantity} × Rs. {item.price}
                      </div>
                    </div>
                    
                    {/* PRODUCT PRICE STYLE */}
                    <div 
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#111827'
                      }}
                      className="shrink-0"
                    >
                      Rs. {item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* 30. PROMO COUPON SECTION */}
              <div className="py-5 border-t border-gray-100 space-y-4 text-left">
                <label className="text-[12px] font-[600] text-gray-500 ml-1">Promotional Coupon</label>
                
                {/* 31. BEST PROMO DESIGN LAYOUT */}
                <div className="flex gap-2 w-full">
                  <input 
                    type="text" 
                    placeholder="Enter Promo Code" 
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    disabled={appliedVoucher !== null || applyingVoucher}
                    className="flex-1 min-w-0 outline-none text-[14px] font-semibold tracking-wider text-[#111827] uppercase disabled:opacity-60 bg-white"
                    style={{
                      height: '46px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      padding: '0 14px'
                    }}
                  />
                  {appliedVoucher ? (
                    <button 
                      type="button"
                      onClick={() => {
                        setAppliedVoucher(null);
                        setVoucherCode('');
                      }}
                      style={{
                        height: '46px',
                        padding: '0 18px',
                        borderRadius: '12px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      className="cursor-pointer border-none"
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher || !voucherCode.trim()}
                      style={{
                        height: '46px',
                        padding: '0 18px',
                        borderRadius: '12px',
                        background: '#111827',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      className="cursor-pointer border-none hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    >
                      {applyingVoucher ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
                
                {voucherError && (
                  <div className="text-[12px] font-medium text-red-500 ml-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle size={12} /> {voucherError}
                  </div>
                )}
                
                {/* 32. COLLECTED VOUCHER UI FOR ACTIVE APPLIED VOUCHER */}
                {appliedVoucher && (
                  <div 
                    style={{
                      background: '#FFF7ED',
                      border: '1px dashed #FDBA74',
                      borderRadius: '14px',
                      padding: '14px'
                    }}
                    className="flex items-center justify-between text-left animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div>
                      {/* Voucher Text */}
                      <div 
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#EA580C'
                        }}
                      >
                        Voucher Applied: "{appliedVoucher.code}"
                      </div>
                      <div className="text-xs text-orange-600/80 font-medium mt-1">
                        {appliedVoucher.discount_type === 'percent' ? `${appliedVoucher.discount_value}% Off` : `Rs ${appliedVoucher.discount_value} Off`} discount applied!
                      </div>
                    </div>
                    <Check className="text-[#EA580C] stroke-[3]" size={16} />
                  </div>
                )}

                {/* Collected Vouchers Wallet Grid (tap to apply) */}
                {collectedVouchers.length > 0 && !appliedVoucher && (
                  <div className="pt-3 space-y-2.5">
                    <div className="flex items-center justify-between ml-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Your Vouchers</span>
                      <span className="text-[9px] font-bold text-[#EA580C] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-full">Tap to apply</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                      {collectedVouchers.map((v) => {
                        return (
                          <div
                            key={v.id}
                            onClick={() => handleSelectCollectedVoucher(v)}
                            className="cursor-pointer flex items-center justify-between transition-all duration-200 hover:scale-[1.01]"
                            style={{
                              background: '#FFF7ED',
                              border: '1px dashed #FDBA74',
                              borderRadius: '14px',
                              padding: '14px'
                            }}
                          >
                            <div>
                              <div 
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#EA580C'
                                }}
                              >
                                {v.code}
                              </div>
                              <div className="text-[11px] text-orange-600/80 mt-1 font-medium">
                                {v.discount_type === 'percent' ? `${v.discount_value}% Off` : `Rs. ${v.discount_value} Off`} • {
                                  v.type === 'product_wise' ? 'Specific Product' :
                                  v.type === 'campaign' && v.campaign_target === 'shipping' ? 'Free Shipping' : 'Storewide'
                                }
                              </div>
                            </div>
                            <Ticket className="text-[#EA580C]/50" size={16} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Totals Breakdown */}
              <div className="space-y-4 pt-5 border-t border-gray-100 text-left">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">Items Subtotal</span>
                  <span className="text-gray-900 text-sm font-bold">Rs. {getTotal()}</span>
                </div>

                {productDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-green-600">
                    <span className="uppercase tracking-widest text-[10px] flex items-center gap-1">
                      <Tag size={10} /> Coupon Discount
                    </span>
                    <span className="text-sm font-bold">-Rs. {productDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">Shipping Fee</span>
                  <span className={shippingFee > 0 ? 'text-gray-900 text-sm font-bold' : 'text-green-500 font-bold text-sm'}>
                    {shippingFee > 0 ? `Rs. ${shippingFee}` : 'Select Location'}
                  </span>
                </div>

                {shippingDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-green-600">
                    <span className="uppercase tracking-widest text-[10px] flex items-center gap-1">
                      <Truck size={10} /> Shipping Discount
                    </span>
                    <span className="text-sm font-bold">-Rs. {shippingDiscount}</span>
                  </div>
                )}

                {/* 33. TOTAL SECTION DESIGN */}
                <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm md:text-lg font-[600]">
                    Total Amount
                  </span>
                  <span className="text-[20px] md:text-[34px] font-[800] text-[#111827] leading-none">
                    Rs. {grandTotal}
                  </span>
                </div>
              </div>

              {/* Proceed to Payment Button Design */}
              <button 
                type="submit" 
                form="checkout-form"
                disabled={isSubmitting || loadingLocations}
                className="cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-lg shadow-[#FFA41C]/15"
                style={{
                  height: '58px',
                  width: '100%',
                  background: '#FFA41C',
                  color: '#111111',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: '1px solid #FF8F00'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FA8900';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFA41C';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin text-[#111111]" size={20} />
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* 38. TRUST SECTION BELOW BUTTON */}
              <div 
                className="mt-5 text-center flex flex-col items-center justify-center gap-0.5 select-none"
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: '1.8'
                }}
              >
                <div>🔒 Secure Checkout</div>
                <div>🚚 Fast Delivery</div>
                <div>↩ Easy Returns</div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MOBILE STICKY ORDER BAR with "Proceed to Payment →" */}
      <div 
        className="block lg:hidden fixed bottom-0 left-0 right-0 h-[74px] bg-white border-t border-[#E5E7EB] px-4 py-3 z-50 animate-in slide-in-from-bottom duration-300"
        style={{
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <div className="flex items-center justify-between h-full max-w-md mx-auto">
          <div className="text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grand Total</div>
            <div className="text-[20px] font-extrabold text-[#111827] leading-none mt-1">Rs. {grandTotal}</div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || loadingLocations}
            className="h-12 px-4 md:px-5 rounded-xl bg-[#FFA41C] border border-[#FF8F00] text-[#111111] font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FA8900] shadow-sm shadow-[#FFA41C]/10 shrink-0"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin text-[#111111]" size={16} />
            ) : (
              <>
                <span>Proceed to Payment</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

    </main>
  );
}
