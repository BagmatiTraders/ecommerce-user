import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: product } = await supabase
    .from('ecommerce_products')
    .select('display_name, description, images, category, brand')
    .eq('slug', slug)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found | Bagmati Shop',
      description: 'The requested product could not be found.',
    };
  }

  const title = `${product.display_name} | Bagmati Shop`;
  const description = product.description?.slice(0, 160) || `Buy ${product.display_name} online at Bagmati Shop. Premium quality and fast delivery.`;
  const imageUrl = product.images?.[0] || '/logo.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://bagmati.shop/products/${slug}`,
      siteName: 'Bagmati Shop',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.display_name,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// 2. Server Page Component
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch product detail
  const { data: product, error } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch Settings, Reviews, Recommendations, and Flash Sales in parallel to minimize roundtrips
  const now = new Date().toISOString();
  
  const [
    settingsRes,
    reviewsRes,
    recsRes,
    flashRes
  ] = await Promise.all([
    supabase.from('app_settings').select('*'),
    supabase
      .from('ecommerce_reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('ecommerce_products')
      .select('*')
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(5),
    supabase
      .from('store_flash_sales')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .lt('start_time', now)
      .gt('end_time', now)
  ]);

  // Extract settings values
  let whatsappPhone = '';
  let storeName = 'Bagmati Shop';
  let currency = 'Rs';

  const settingsList = settingsRes.data || [];
  const waSetting = settingsList.find(s => s.key === 'whatsapp_settings');
  if (waSetting?.value?.phone_number) {
    whatsappPhone = waSetting.value.phone_number;
  }

  const storeSetting = settingsList.find(s => s.key === 'store_settings');
  if (storeSetting?.value?.store_name) {
    storeName = storeSetting.value.store_name;
  }
  if (storeSetting?.value?.currency) {
    currency = storeSetting.value.currency;
  }

  const reviews = reviewsRes.data || [];
  const recommended = recsRes.data || [];
  const flashSales = flashRes.data || [];

  // Determine current price for JSON-LD Offers
  const currentPrice = product.special_price || product.regular_price;

  // JSON-LD Structured Product Data Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.display_name,
    'image': product.images || [],
    'description': product.description || `Buy ${product.display_name} at Bagmati Shop.`,
    'sku': product.id,
    'mpn': product.inventory_id || product.id,
    'brand': {
      '@type': 'Brand',
      'name': product.brand && product.brand !== 'No Brand' ? product.brand : storeName,
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://bagmati.shop/products/${product.slug}`,
      'priceCurrency': currency === 'Rs' ? 'NPR' : currency,
      'price': currentPrice,
      'priceValidUntil': '2035-01-01',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    'aggregateRating': product.reviews_count > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': product.rating || 5,
      'reviewCount': product.reviews_count,
    } : undefined,
  };

  return (
    <>
      {/* Insert JSON-LD Structured Data in document head for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Render the Client UI with pre-fetched data props */}
      <ProductClient
        initialProduct={product}
        initialReviews={reviews}
        initialRecommended={recommended}
        initialFlashSales={flashSales}
        initialWhatsappPhone={whatsappPhone}
        initialStoreName={storeName}
        initialCurrency={currency}
      />
    </>
  );
}
