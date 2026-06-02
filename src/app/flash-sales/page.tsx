import { Metadata } from 'next';
import FlashSalesClient from './FlashSalesClient';

export const metadata: Metadata = {
  title: 'Hot Deals & Flash Sales | Bagmati Shop',
  description: 'Grab heavily discounted prices on premium gadgets, electronics, fashion, and home essentials at Bagmati Shop. Limited stock deals available for a limited time.',
  openGraph: {
    title: 'Hot Deals & Flash Sales | Bagmati Shop',
    description: 'Grab heavily discounted prices on premium gadgets, electronics, fashion, and home essentials at Bagmati Shop. Limited stock deals available for a limited time.',
    url: 'https://bagmati.shop/flash-sales',
    type: 'website',
  },
};

export default function FlashSalesPage() {
  return <FlashSalesClient />;
}
