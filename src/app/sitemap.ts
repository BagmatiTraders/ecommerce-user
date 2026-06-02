import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const slugify = (str: string) => str.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bagmati.shop';
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch active products
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('slug, updated_at, brand')
    .eq('status', 'active');

  const productList = products || [];

  // Generate dynamic product URLs
  const productUrls = productList.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updated_at || Date.now()),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Generate dynamic brand URLs (extract unique brand names)
  const uniqueBrands = Array.from(
    new Set(
      productList
        .map((p) => p.brand)
        .filter((brand): brand is string => !!brand && brand !== 'No Brand')
    )
  );

  const brandUrls = uniqueBrands.map((brand) => ({
    url: `${baseUrl}/brand/${slugify(brand)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Static URLs
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/flash-sales`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...productUrls, ...brandUrls];
}
