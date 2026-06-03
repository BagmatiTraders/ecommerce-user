import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const slugify = (str: string) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

// Static URLs — always use www.bagmati.shop consistently
const BASE_URL = 'https://www.bagmati.shop';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static URLs (always included even if DB fails)
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/flash-sales`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch active products
    const { data: products, error } = await supabase
      .from('ecommerce_products')
      .select('slug, updated_at, brand')
      .eq('status', 'active');

    if (error || !products) {
      // If DB is unreachable, still return static URLs so sitemap doesn't break
      return staticUrls;
    }

    // Generate dynamic product URLs
    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updated_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Generate dynamic brand URLs (unique brands only)
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

    return [...staticUrls, ...productUrls, ...brandUrls];
  } catch {
    // Fallback: return static URLs only
    return staticUrls;
  }
}
