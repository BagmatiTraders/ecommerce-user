import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import BrandClient from './BrandClient';

interface Props {
  params: Promise<{ slug: string }>;
}

const slugify = (str: string) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

const getBrandDetails = async (slug: string) => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch active products to identify the brand name
  const { data: activeProds } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active');

  const prods = activeProds || [];
  
  // Find products matching the brand slug
  const brandProducts = prods.filter((p: any) => p.brand && p.brand !== 'No Brand' && slugify(p.brand) === slug);
  
  // Resolve capitalized brand name
  let brandName = '';
  if (brandProducts.length > 0) {
    brandName = brandProducts[0].brand || '';
  } else {
    // Fallback guess from slug
    brandName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return { brandName, products: brandProducts };
};

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { brandName, products } = await getBrandDetails(slug);
  const count = products.length;

  const title = `Buy ${brandName} Products Online at Best Price in Nepal | Bagmati Shop`;
  const description = `Shop ${count > 0 ? count + ' genuine' : 'genuine'} ${brandName} products in Nepal at the best price. Fast delivery across Nepal with cash on delivery available at Bagmati Shop.`;

  return {
    title,
    description,
    keywords: [
      brandName,
      `buy ${brandName} nepal`,
      `${brandName} price in nepal`,
      `${brandName} products online`,
      'online shopping nepal',
      'bagmati shop',
    ],
    alternates: {
      canonical: `https://www.bagmati.shop/brand/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.bagmati.shop/brand/${slug}`,
      type: 'website',
    },
  };
}

// 2. Server Page Component
export default async function BrandStorePage({ params }: Props) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { brandName, products: brandProducts } = await getBrandDetails(slug);

  // Fetch sales metrics on server to sort by popularity
  const { data: orderItems } = await supabase
    .from('ecommerce_order_items')
    .select('product_id, quantity');
      
  const salesMap: Record<string, number> = {};
  if (orderItems) {
    orderItems.forEach((item: any) => {
      salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
    });
  }

  const products = brandProducts.map((p: any) => ({
    ...p,
    soldCount: salesMap[p.id] || 0
  }));

  // Sort by sales popularity
  products.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.bagmati.shop' },
      { '@type': 'ListItem', 'position': 2, 'name': `${brandName} Store`, 'item': `https://www.bagmati.shop/brand/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BrandClient 
        initialProducts={products}
        initialBrandName={brandName}
      />
    </>
  );
}
