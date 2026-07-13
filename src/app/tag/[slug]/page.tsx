import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import TagClient from './TagClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// Convert slug back to human-readable label
// e.g. "bluetooth-body-scale" → "Bluetooth Body Scale"
const slugToLabel = (slug: string) =>
  slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Convert label to search keywords
// e.g. "Bluetooth Body Scale" → ["bluetooth", "body", "scale"]
const labelToKeywords = (label: string) =>
  label
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2); // skip short words like "in", "a"

// ── 1. Dynamic Metadata (like Daraz: "Buy bluetooth body scale Online at Best Price in Nepal") ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tagLabel = slugToLabel(slug);

  const title = `Buy ${tagLabel} Online at Best Price in Nepal | Bagmati Shop`;
  const description = `Shop ${tagLabel} online in Nepal at the best price. Find a wide variety of ${tagLabel} with fast delivery and cash on delivery available across Nepal at Bagmati Shop.`;

  return {
    title,
    description,
    keywords: [
      tagLabel,
      `buy ${tagLabel} nepal`,
      `${tagLabel} price in nepal`,
      `${tagLabel} online nepal`,
      `best ${tagLabel} nepal`,
      `${tagLabel} shop nepal`,
      'online shopping nepal',
      'cash on delivery nepal',
      'bagmati shop',
    ],
    alternates: {
      canonical: `https://www.bagmati.shop/tag/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.bagmati.shop/tag/${slug}`,
      type: 'website',
      siteName: 'Bagmati Shop',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ── 2. Server Page Component ──
export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tagLabel = slugToLabel(slug);
  const keywords = labelToKeywords(tagLabel);

  if (keywords.length === 0) {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch ALL active products
  const { data: allProducts } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const products = allProducts || [];

  // Fetch sales metrics for popularity sorting
  const { data: orderItems } = await supabase
    .from('ecommerce_order_items')
    .select('product_id, quantity');

  const salesMap: Record<string, number> = {};
  (orderItems || []).forEach((item: any) => {
    salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
  });

  // ── Smart matching: score products by how many keywords they match ──
  // Checks: display_name, category, brand, tags (if any)
  const scored = products
    .map((p: any) => {
      const haystack = [
        p.display_name || '',
        p.category || '',
        p.brand || '',
        p.description || '',
        ...(Array.isArray(p.tags) ? p.tags : []),
      ]
        .join(' ')
        .toLowerCase();

      const matchCount = keywords.filter(kw => haystack.includes(kw)).length;
      return { ...p, _matchCount: matchCount, soldCount: salesMap[p.id] || 0 };
    })
    .filter((p: any) => p._matchCount > 0)          // must match at least 1 keyword
    .sort((a: any, b: any) => {
      // Primary: keyword match score (more matches = more relevant)
      if (b._matchCount !== a._matchCount) return b._matchCount - a._matchCount;
      // Secondary: sales popularity
      return (b.soldCount || 0) - (a.soldCount || 0);
    });

  // If absolutely no products match, still show the page (Google still indexes it)
  // This avoids 404 for valid tag pages with no current inventory

  // JSON-LD: ItemList schema — Google may show individual products in search
  const itemListLd = scored.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': `Buy ${tagLabel} Online at Best Price in Nepal`,
        'description': `Shop ${tagLabel} online in Nepal at Bagmati Shop`,
        'url': `https://www.bagmati.shop/tag/${slug}`,
        'numberOfItems': scored.length,
        'itemListElement': scored.slice(0, 10).map((p: any, i: number) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'url': `https://www.bagmati.shop/products/${p.slug}`,
          'name': p.display_name,
        })),
      }
    : null;

  // JSON-LD: BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',     'item': 'https://www.bagmati.shop' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://www.bagmati.shop/products' },
      { '@type': 'ListItem', 'position': 3, 'name': tagLabel,   'item': `https://www.bagmati.shop/tag/${slug}` },
    ],
  };

  return (
    <>
      {/* BreadcrumbList — Google shows: bagmati.shop › Products › Bluetooth Body Scale */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* ItemList — Google may display individual product links in search results */}
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}

      <TagClient
        initialProducts={scored}
        tagLabel={tagLabel}
        tagSlug={slug}
      />
    </>
  );
}
