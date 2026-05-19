'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useCart } from '@/lib/store/useCart';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  RefreshCw,
  Clock,
  Info,
  Tag,
  Truck,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Check,
  AlertCircle,
  CreditCard,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon?: string;
  description?: string;
  is_active: boolean;
}

export default function ChoosePaymentPage() {
  const { items, getTotal, clearCart } = useCart();
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('cod');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Validate cart items
      if (items.length === 0 && !isSuccess && !isProcessing) {
        router.push('/');
        return;
      }

      // Read shipping data from localStorage
      const saved = localStorage.getItem('checkout_data');
      if (!saved && !isSuccess && !isProcessing) {
        router.push('/checkout');
        return;
      }
      try {
        if (saved) {
          setCheckoutData(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to parse checkout details:', err);
        router.push('/checkout');
      }

      fetchPaymentMethods();
    }
  }, [items, isSuccess, isProcessing, isMounted]);

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'payment_methods')
        .maybeSingle();

      if (data && Array.isArray(data.value)) {
        const active = data.value.filter((m: any) => m.is_active);
        setPaymentMethods(active);
        if (active.length > 0) {
          // Default to cod if present, otherwise first active
          const hasCod = active.find((m: any) => m.code === 'cod');
          setSelectedMethodId(hasCod ? hasCod.id : active[0].id);
        }
      } else {
        // Fallback static list containing Cash on Delivery
        const fallback = [
          {
            id: 'cod',
            name: 'Cash on Delivery',
            code: 'cod',
            icon: '💵',
            description: 'Pay with cash upon delivery of your items.',
            is_active: true
          }
        ];
        setPaymentMethods(fallback);
        setSelectedMethodId('cod');
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
      // Hard fallback
      setPaymentMethods([
        {
          id: 'cod',
          name: 'Cash on Delivery',
          code: 'cod',
          icon: '💵',
          description: 'Pay with cash upon delivery of your items.',
          is_active: true
        }
      ]);
      setSelectedMethodId('cod');
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!checkoutData) return;
    const chosenMethod = paymentMethods.find(m => m.id === selectedMethodId);
    if (!chosenMethod) {
      alert("Please select a valid payment method.");
      return;
    }

    setIsSubmitting(true);

    const generatedOrderNumber = 'ECO-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const deviceId = localStorage.getItem('ecommerce_device_id') || Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ecommerce_device_id', deviceId);

    const { formData, selectedLoc, activeRoute, appliedVoucher } = checkoutData;

    // Build compound shipping address including selected payment method for admin dashboard visibility
    const fullShippingAddress = `${selectedLoc.province}, ${selectedLoc.district}, ${selectedLoc.city}${selectedLoc.area ? ', ' + selectedLoc.area : ''} | ${formData.deliveryAddress} | Payment: ${chosenMethod.name}`;
    
    // Embed chosen payment method in logistic details object
    const logisticWithPayment = {
      ...activeRoute,
      chosen_payment_method: chosenMethod.code,
      chosen_payment_name: chosenMethod.name
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error: orderError } = await supabase
        .from('ecommerce_orders')
        .insert({
          order_number: generatedOrderNumber,
          customer_name: formData.fullName,
          customer_email: (formData.email.trim() || user?.email || '').toLowerCase(),
          customer_phone: formData.altPhone ? `${formData.phone} / ${formData.altPhone}` : formData.phone,
          shipping_address: fullShippingAddress,
          logistic_selection: JSON.stringify(logisticWithPayment),
          shipping_fee: activeRoute.delivery_charge,
          total_amount: grandTotal,
          device_id: deviceId,
          applied_voucher_id: appliedVoucher ? appliedVoucher.id : null,
          discount_amount: totalDiscount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        selected_variation: item.selected_variation || null,
        inventory_id: item.inventory_id || null
      }));

      const { error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update flash sale stock counts
      const nowStr = new Date().toISOString();
      const productIds = items.map(item => item.id);
      
      const { data: flashSales } = await supabase
        .from('store_flash_sales')
        .select('id, product_id, sold_qty, total_stock, variation_name')
        .in('product_id', productIds)
        .eq('is_active', true)
        .lt('start_time', nowStr)
        .gt('end_time', nowStr);
        
      if (flashSales && flashSales.length > 0) {
        for (const fs of flashSales) {
           const cartItem = items.find(i => 
             i.id === fs.product_id && 
             (!fs.variation_name || fs.variation_name === i.selected_variation)
           );
           if (cartItem) {
             const newSoldQty = Math.min(fs.sold_qty + cartItem.quantity, fs.total_stock);
             await supabase
                .from('store_flash_sales')
                .update({ sold_qty: newSoldQty })
                .eq('id', fs.id);
           }
        }
      }

      // If voucher was applied, mark user's collected voucher as used
      if (appliedVoucher) {
        await supabase
          .from('ecommerce_user_vouchers')
          .update({
            status: 'used',
            used_at: new Date().toISOString()
          })
          .eq('id', appliedVoucher.userVoucherId);

        const { data: vDef } = await supabase
          .from('ecommerce_vouchers')
          .select('used_count')
          .eq('id', appliedVoucher.id)
          .single();

        if (vDef) {
          await supabase
            .from('ecommerce_vouchers')
            .update({
              used_count: (vDef.used_count || 0) + 1
            })
            .eq('id', appliedVoucher.id);
        }
      }

      // Cleanup local state and cart first
      localStorage.removeItem('checkout_data');
      setOrderNumber(generatedOrderNumber);
      clearCart();
      
      // Beautiful verification loading flow (1.5 seconds)
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 1500);

    } catch (error: any) {
      alert('Order Placement Failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || (!checkoutData && !isSuccess && !isProcessing)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <RefreshCw className="animate-spin text-gray-300" size={32} />
      </div>
    );
  }

  // Fallbacks if data is already cleared from localStorage but we have it in state
  const formData = checkoutData?.formData || { fullName: '', phone: '', deliveryAddress: '' };
  const activeRoute = checkoutData?.activeRoute || null;
  const appliedVoucher = checkoutData?.appliedVoucher || null;
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
  const totalDiscount = productDiscount + shippingDiscount;

  // 1-2 SECONDS SECURE VERIFICATION LOADING STATE
  if (isProcessing) {
    return (
      <main 
        className="min-h-screen bg-[#FAFAFA] flex items-center justify-center select-none" 
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="text-center p-8 space-y-6 max-w-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* Spinning active ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-[#FF6A00] animate-spin" />
            {/* Pulsing inner lock badge */}
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6A00] animate-pulse">
              <ShieldCheck size={28} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#111827]">Verifying Order...</h2>
            <p className="text-sm font-[500] text-[#6B7280] leading-relaxed">
              🔒 Securing transaction details and preparing your order validation. Please do not close or refresh this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // PREMIUM ORDER SUCCESS PAGE DESIGN
  if (isSuccess) {
    const chosenMethod = paymentMethods.find(m => m.id === selectedMethodId) || { name: 'Cash on Delivery' };
    const deliveryCity = checkoutData?.selectedLoc?.city || 'Kathmandu';
    const deliveryTime = activeRoute?.delivery_time || '2–4 Days';

    return (
      <main 
        className="min-h-screen bg-[#FAFAFA] select-none" 
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Header />
        
        <div className="flex items-center justify-center py-20 px-4 min-h-[calc(100vh-80px)] relative">
          {/* Soft background glow circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-green-200/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="w-full max-w-[520px] relative z-10">
            {/* SUCCESS CARD */}
          <div 
            style={{
              background: 'white',
              borderRadius: '28px',
              padding: '40px',
              border: '1px solid #EEF2F7',
              boxShadow: '0 12px 40px rgba(0,0,0,0.03)'
            }}
            className="text-center animate-in zoom-in-95 fade-in duration-300"
          >
            {/* SUCCESS ICON DESIGN (✅ Green circle with checkmark) */}
            <div 
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '999px',
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
              className="animate-in zoom-in-50 duration-500"
            >
              <CheckCircle2 size={46} style={{ color: '#15803D' }} />
            </div>

            {/* SUCCESS TITLE STYLE */}
            <h1 
              style={{
                fontSize: '34px',
                fontWeight: 700,
                color: '#111827',
                marginTop: '24px',
                letterSpacing: '-0.5px'
              }}
            >
              Order Confirmed!
            </h1>

            {/* SUBTEXT STYLE */}
            <p 
              style={{
                fontSize: '15px',
                color: '#6B7280',
                lineHeight: '1.7',
                marginTop: '12px'
              }}
            >
              Thank you for your purchase. Your order has been successfully placed.
            </p>

            {/* IMPORTANT ORDER INFO CARD (Increases trust MASSIVELY) */}
            <div 
              style={{
                background: '#F9FAFB',
                border: '1.5px solid #EEF2F7',
                borderRadius: '20px',
                padding: '24px',
                margin: '28px 0',
                textAlign: 'left'
              }}
              className="flex flex-col gap-4"
            >
              {/* Order ID */}
              <div className="flex justify-between items-center text-sm border-b border-gray-100/80 pb-3.5">
                <span className="text-[#6B7280] font-semibold flex items-center gap-2 select-none">
                  <Tag size={16} className="text-[#9CA3AF]" />
                  Order ID
                </span>
                <span className="text-[#111827] font-extrabold font-mono text-[14px] bg-[#EEF2F7] px-2.5 py-1 rounded-lg">
                  #{orderNumber}
                </span>
              </div>

              {/* Estimated Delivery */}
              <div className="flex justify-between items-center text-sm border-b border-gray-100/80 pb-3.5">
                <span className="text-[#6B7280] font-semibold flex items-center gap-2 select-none">
                  <Clock size={16} className="text-[#9CA3AF]" />
                  Estimated Delivery
                </span>
                <span className="text-[#111827] font-bold">
                  {deliveryTime}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex justify-between items-center text-sm border-b border-gray-100/80 pb-3.5">
                <span className="text-[#6B7280] font-semibold flex items-center gap-2 select-none">
                  <CreditCard size={16} className="text-[#9CA3AF]" />
                  Payment Method
                </span>
                <span className="text-[#111827] font-bold">
                  {chosenMethod.name}
                </span>
              </div>

              {/* Shipping Address */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280] font-semibold flex items-center gap-2 select-none">
                  <MapPin size={16} className="text-[#9CA3AF]" />
                  Shipping Address
                </span>
                <span className="text-[#111827] font-bold truncate max-w-[200px]" title={deliveryCity}>
                  {deliveryCity}
                </span>
              </div>
            </div>

            {/* BUTTONS LAYOUT */}
            <div className="flex flex-col gap-3">
              {/* PRIMARY BUTTON: Track Order */}
              <Link 
                href={`/track?id=${orderNumber}`}
                style={{
                  height: '54px',
                  background: '#FFA41C',
                  border: '1px solid #FF8F00',
                  color: '#111111',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(255, 164, 28, 0.15)'
                }}
                className="cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:bg-[#FA8900]"
              >
                Track Order
              </Link>

              {/* SECONDARY BUTTON: Continue Shopping */}
              <Link 
                href="/"
                style={{
                  height: '54px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
                className="cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:bg-gray-100"
              >
                Continue Shopping
              </Link>
            </div>
            
            <div className="text-[12px] text-gray-400 mt-6 font-[500] flex items-center justify-center gap-1.5 select-none">
              <ShieldCheck size={14} className="text-green-500" />
              <span>Your order is backed by our full customer guarantee</span>
            </div>

          </div>
        </div>
      </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-36 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* 3. PAGE CONTAINER: Max 1440px, margin auto, padding 24px, mt-20 */}
      <div className="container max-w-[1440px] mx-auto px-6 mt-[20px] pb-12">
        
        {/* Header Navigation & Back to Shipping Step */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-gray-100/60 mb-8 text-left">
          {/* Payment Page Header */}
          <h1 
            style={{
              fontSize: '34px',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.3px',
              lineHeight: '1.2'
            }}
          >
            Choose Payment Method
          </h1>
          {/* Subtext */}
          <div 
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: '#6B7280'
            }}
            className="flex items-center gap-1.5"
          >
            <span>🔒 All transactions are secure and encrypted</span>
          </div>
        </div>

        {/* 65% left, 35% right desktop grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-8 items-start">
          
          {/* LEFT PAYMENT AREA */}
          <div className="flex flex-col gap-[20px]">
            
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
                Payment Methods Available
              </h2>
              
              <div className="flex flex-col gap-4">
                {loadingMethods ? (
                  <div className="py-12 text-center text-gray-400 font-semibold flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="animate-spin text-[#FF6A00]" size={24} />
                    <span>Loading payment options...</span>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-semibold">
                    No payment methods configured in your admin settings.
                  </div>
                ) : (
                  paymentMethods.map((m) => {
                    const isSelected = selectedMethodId === m.id;
                    return (
                      <div 
                        key={m.id}
                        onClick={() => setSelectedMethodId(m.id)}
                        className="flex items-center justify-between text-left select-none transition-all duration-200"
                        style={{
                          height: '72px',
                          border: isSelected ? '1.5px solid #FF6A00' : '1.5px solid #E5E7EB',
                          borderRadius: '18px',
                          padding: '18px',
                          background: isSelected ? '#FFF7ED' : 'white',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#FF6A00';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl shrink-0" role="img" aria-label="payment-icon">
                            {m.icon || '💳'}
                          </span>
                          <div>
                            <div className="text-base font-bold text-[#111827]">{m.name}</div>
                            {m.description && (
                              <div className="text-xs text-gray-500 font-medium mt-0.5">{m.description}</div>
                            )}
                          </div>
                        </div>
                        {/* Selector indicator */}
                        <div className="w-5 h-5 rounded-full border-[3px] border-[#FF6A00] flex items-center justify-center bg-white shadow-sm shrink-0">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]"></div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Shipping Destination Summary Review card */}
            <div 
              style={{
                background: 'white',
                borderRadius: '22px',
                padding: '24px',
                border: '1px solid #EEF2F7'
              }}
              className="shadow-sm text-left"
            >
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Deliver To</h3>
              <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                {formData.fullName} ({formData.phone})<br />
                {checkoutData?.selectedLoc?.city || 'Kathmandu'}, {checkoutData?.selectedLoc?.district || ''}, {checkoutData?.selectedLoc?.province || ''}<br />
                <span className="text-gray-500 text-xs font-medium italic">{formData.deliveryAddress}</span>
              </p>
            </div>

          </div>

          {/* RIGHT ORDER SUMMARY */}
          <div className="lg:col-span-1">
            
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
              <h2 
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '20px'
                }}
                className="text-left"
              >
                Order Summary
              </h2>
              
              {/* Product list */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center py-2 border-b border-gray-50 last:border-0 text-left">
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
                      <div className="text-[12px] text-[#6B7280] font-medium mt-1">
                        Qty {item.quantity} × Rs. {item.price}
                      </div>
                    </div>
                    
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

              {/* Items Breakdown */}
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
                  <span className="text-gray-900 text-sm font-bold">
                    Rs. {shippingFee}
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

                {/* Total amount */}
                <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                  <span 
                    style={{
                      fontSize: '18px',
                      fontWeight: 600
                    }}
                  >
                    Total Amount
                  </span>
                  <span 
                    style={{
                      fontSize: '34px',
                      fontWeight: 800,
                      lineHeight: 1,
                      color: '#111827'
                    }}
                  >
                    Rs. {grandTotal}
                  </span>
                </div>
              </div>

              {/* Final Confirm Order CTA Button */}
              <button 
                onClick={handleConfirmOrder}
                disabled={isSubmitting || loadingMethods || !selectedMethodId}
                className="cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-lg shadow-[#FFA41C]/15 w-full text-[#111111] font-bold"
                style={{
                  height: '58px',
                  background: '#FFA41C',
                  borderRadius: '16px',
                  fontSize: '16px',
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
                    <span>Confirm Order</span>
                  </>
                )}
              </button>

              {/* Trust Section */}
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

      {/* Mobile Sticky bottom fixed bar with final Confirm Order */}
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
            onClick={handleConfirmOrder}
            disabled={isSubmitting || loadingMethods || !selectedMethodId}
            className="h-12 px-6 rounded-xl bg-[#FFA41C] border border-[#FF8F00] text-[#111111] font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#FA8900] shadow-sm shadow-[#FFA41C]/10"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin text-[#111111]" size={16} />
            ) : (
              <>
                <span>Confirm Order</span>
              </>
            )}
          </button>
        </div>
      </div>

    </main>
  );
}
