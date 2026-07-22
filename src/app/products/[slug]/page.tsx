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

  // SEO-optimised title — matches how people search on Google Nepal
  const title = `Buy ${product.display_name} Online at Best Price in Nepal | Bagmati Shop`;

  // Rich description with Nepal-specific keywords
  const brandPart = product.brand && product.brand !== 'No Brand' ? `Genuine ${product.brand} product. ` : '';
  const catPart   = product.category ? `Shop ${product.category} at Bagmati Shop. ` : '';
  const fallback  = `${brandPart}${catPart}Fast delivery across Nepal. Cash on delivery available.`;
  const rawDesc   = product.description?.replace(/<[^>]+>/g, '').trim();
  const description = rawDesc && rawDesc.length > 40
    ? `${rawDesc.slice(0, 120)} — Buy online at best price in Nepal with fast delivery.`
    : fallback;

  const imageUrl = product.images?.[0] || 'https://www.bagmati.shop/logo.png';

  return {
    title,
    description,
    keywords: [
      product.display_name,
      `buy ${product.display_name} nepal`,
      `${product.display_name} price in nepal`,
      `${product.display_name} online nepal`,
      product.brand && product.brand !== 'No Brand' ? product.brand : '',
      product.category || '',
      'online shopping nepal',
      'cash on delivery nepal',
      'bagmati shop',
    ].filter(Boolean),
    alternates: {
      canonical: `https://www.bagmati.shop/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.bagmati.shop/products/${slug}`,
      siteName: 'Bagmati Shop',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.display_name,
        },
      ],
      type: 'website',
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

  // Ensure valid absolute HTTPS image URLs for Googlebot & Merchant Center
  const rawImages: string[] = Array.isArray(product.images) ? product.images : [];
  const sanitizedImages = rawImages
    .filter((img) => typeof img === 'string' && img.trim() !== '')
    .map((img) => (img.startsWith('http') ? img : `https://www.bagmati.shop${img.startsWith('/') ? '' : '/'}${img}`));
  const productImages = sanitizedImages.length > 0 ? sanitizedImages : ['https://www.bagmati.shop/logo.png'];

  // JSON-LD Structured Product Data Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.display_name,
    'image': productImages,
    'description': product.description?.replace(/<[^>]+>/g, '').trim() || `Buy ${product.display_name} online at best price in Nepal at Bagmati Shop. Fast delivery with cash on delivery available.`,
    'sku': product.id,
    'mpn': product.inventory_id || product.id,
    'brand': {
      '@type': 'Brand',
      'name': product.brand && product.brand !== 'No Brand' ? product.brand : storeName,
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://www.bagmati.shop/products/${product.slug}`,
      'priceCurrency': 'NPR',
      'price': currentPrice,
      'priceValidUntil': '2035-01-01',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'shippingRate': {
          '@type': 'MonetaryAmount',
          'value': '100',
          'currency': 'NPR',
        },
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'NP',
        },
        'deliveryTime': {
          '@type': 'ShippingDeliveryTime',
          'handlingTime': {
            '@type': 'QuantitativeValue',
            'minValue': 1,
            'maxValue': 2,
            'unitCode': 'DAY',
          },
          'transitTime': {
            '@type': 'QuantitativeValue',
            'minValue': 2,
            'maxValue': 5,
            'unitCode': 'DAY',
          },
        },
      },
      'hasMerchantReturnPolicy': {
        '@type': 'MerchantReturnPolicy',
        'applicableCountry': 'NP',
        'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
        'merchantReturnDays': 7,
        'returnMethod': 'https://schema.org/ReturnByMail',
        'returnFees': 'https://schema.org/FreeReturn',
      },
      'seller': {
        '@type': 'Organization',
        'name': storeName,
        'url': 'https://www.bagmati.shop',
      },
      'areaServed': {
        '@type': 'Country',
        'name': 'Nepal',
      },
    },
    'aggregateRating': product.reviews_count > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': product.rating || 5,
      'reviewCount': product.reviews_count,
      'bestRating': 5,
      'worstRating': 1,
    } : undefined,
  };

  // BreadcrumbList schema — Google shows: bagmati.shop › Products › Product Name
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',     'item': 'https://www.bagmati.shop' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://www.bagmati.shop/products' },
      { '@type': 'ListItem', 'position': 3, 'name': product.display_name, 'item': `https://www.bagmati.shop/products/${product.slug}` },
    ],
  };

  return (
    <>
      {/* Product JSON-LD — enables Google Rich Snippets (price, rating, availability) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* BreadcrumbList JSON-LD — shows navigation path in Google results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
