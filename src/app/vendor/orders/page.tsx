'use client';

import OrdersPage from '@/app/admin/orders/page';

export default function VendorOrdersPage() {
  // In a real app, this would be fetched from the logged-in vendor's session/profile
  const VENDOR_CATEGORY = 'Electronics'; 
  
  return <OrdersPage isVendor={true} vendorCategory={VENDOR_CATEGORY} />;
}
