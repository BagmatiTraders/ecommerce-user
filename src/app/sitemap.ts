import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const slugify = (str: string) =>
  str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

// Generate tag slugs from a product display name
// e.g. "Bluetooth Body Weight Scale" → ["bluetooth-body-weight-scale", "bluetooth-body", "body-weight-scale", ...]
const extractTagSlugs = (name: string): string[] => {
  const words = name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2); // skip tiny words

  const tags = new Set<string>();

  // Full name as tag
  tags.add(slugify(name));

  // All consecutive bigrams (2-word combos)
  for (let i = 0; i < words.length - 1; i++) {
    tags.add(`${words[i]}-${words[i + 1]}`);
  }

  // All consecutive trigrams (3-word combos) for longer names
  for (let i = 0; i < words.length - 2; i++) {
    tags.add(`${words[i]}-${words[i + 1]}-${words[i + 2]}`);
  }

  return Array.from(tags);
};

// Canonical base URL — always www
const BASE_URL = 'https://www.bagmati.shop';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static Public Pages ────────────────────────────────────────────────────
  const staticUrls: MetadataRoute.Sitemap = [
    // Core pages
    { url: BASE_URL,                          lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/products`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/flash-sales`,         lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${BASE_URL}/top-selling`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/search`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE_URL}/vendor`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/track`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    // Policy / info pages
    { url: `${BASE_URL}/privacy-policy`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/shipping-policy`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/returns-refunds`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    // High-value Nepal keyword tag pages (static — always included)
    { url: `${BASE_URL}/tag/online-shopping-nepal`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/tag/buy-online-nepal`,           lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/tag/cash-on-delivery-nepal`,     lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/tag/best-price-nepal`,           lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/tag/fast-delivery-nepal`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // ─── Fetch Products & Categories in parallel ─────────────────────────────
    const [{ data: products, error: productError }, { data: categories }] = await Promise.all([
      supabase
        .from('ecommerce_products')
        .select('slug, updated_at, brand, display_name, category')
        .eq('status', 'active'),
      supabase
        .from('ecommerce_categories')
        .select('id, name'),
    ]);

    if (productError || !products) {
      return staticUrls;
    }

    // ── Dynamic product pages: /products/[slug] ──────────────────────────────
    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updated_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // ── Dynamic brand pages: /brand/[slug] ───────────────────────────────────
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
      priority: 0.7,
    }));

    // ── Category filter pages: /products?category=[name] ─────────────────────
    const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${BASE_URL}/products?category=${encodeURIComponent(cat.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    // ── Category tag pages: /tag/[category-slug] ─────────────────────────────
    // These are Daraz-style landing pages for each category
    const categoryTagUrls: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${BASE_URL}/tag/${slugify(cat.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // ── Brand tag pages: /tag/[brand-slug] ───────────────────────────────────
    const brandTagUrls: MetadataRoute.Sitemap = uniqueBrands.map((brand) => ({
      url: `${BASE_URL}/tag/${slugify(brand)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // ── Product name tag pages: /tag/[product-name-slug] ─────────────────────
    // Extract keyword tags from every product name (bigrams & trigrams)
    const allTagSlugs = new Set<string>();
    products.forEach((p) => {
      if (p.display_name) {
        extractTagSlugs(p.display_name).forEach(tag => allTagSlugs.add(tag));
      }
      if (p.category) allTagSlugs.add(slugify(p.category));
    });

    // Limit to 500 tag pages to keep sitemap manageable
    const productTagUrls: MetadataRoute.Sitemap = Array.from(allTagSlugs)
      .slice(0, 500)
      .map((tag) => ({
        url: `${BASE_URL}/tag/${tag}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

    return [
      ...staticUrls,
      ...productUrls,
      ...brandUrls,
      ...categoryUrls,
      ...categoryTagUrls,
      ...brandTagUrls,
      ...productTagUrls,
    ];
  } catch {
    // Fallback: always return static URLs even if DB is down
    return staticUrls;
  }
}
