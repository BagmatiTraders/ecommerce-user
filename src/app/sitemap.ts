import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const slugify = (str: string) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

// Canonical base URL — always www
const BASE_URL = 'https://www.bagmati.shop';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static Public Pages ────────────────────────────────────────────────────
  // Pages that should ALWAYS be indexed (never blocked by robots.txt)
  const staticUrls: MetadataRoute.Sitemap = [
    // Core pages
    { url: BASE_URL,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/products`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/flash-sales`,     lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${BASE_URL}/top-selling`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/search`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE_URL}/vendor`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/track`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    // Policy / info pages
    { url: `${BASE_URL}/privacy-policy`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/shipping-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/returns-refunds`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // ─── Fetch Products & Categories in parallel ─────────────────────────────
    const [{ data: products, error: productError }, { data: categories }] = await Promise.all([
      supabase
        .from('ecommerce_products')
        .select('slug, updated_at, brand')
        .eq('status', 'active'),
      supabase
        .from('ecommerce_categories')
        .select('id, name'),
    ]);

    if (productError || !products) {
      // DB unreachable — still serve static URLs so sitemap never breaks
      return staticUrls;
    }

    // Dynamic product pages: /products/[slug]
    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updated_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Dynamic brand pages: /brand/[slug]
    const uniqueBrands = Array.from(
      new Set(
        products
          .map((p) => p.brand)
          .filter((brand): brand is string => !!brand && brand !== 'No Brand')
      )
    );
    const brandUrls: MetadataRoute.Sitemap = uniqueBrands.map((brand) => ({
      url: `${BASE_URL}/brand/${slugify(brand)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // Category filter pages: /products?category=[name]
    // Each shows a different filtered product list — Google indexes these separately
    const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${BASE_URL}/products?category=${encodeURIComponent(cat.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [
      ...staticUrls,
      ...productUrls,
      ...brandUrls,
      ...categoryUrls,
    ];
  } catch {
    // Fallback: always return static URLs even if DB is down
    return staticUrls;
  }
}
