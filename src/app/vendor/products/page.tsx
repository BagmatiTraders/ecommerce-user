'use client';

import ProductManagementPage from '@/app/admin/products/page';

export default function VendorProductsPage() {
  // In a real app, this would be fetched from the logged-in vendor's session/profile
  const VENDOR_CATEGORY = 'Electronics'; 
  
  return <ProductManagementPage isVendor={true} vendorCategory={VENDOR_CATEGORY} />;
}
