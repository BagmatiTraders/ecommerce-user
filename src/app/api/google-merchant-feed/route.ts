import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.bagmati.shop';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: products, error } = await supabase
      .from('ecommerce_products')
      .select('*')
      .eq('status', 'active');

    if (error || !products) {
      return new NextResponse('Failed to load products', { status: 500 });
    }

    const itemsXml = products
      .map((p) => {
        const price = p.special_price || p.regular_price || p.price || 0;
        const rawImages: string[] = Array.isArray(p.images) ? p.images : [];
        const validImages = rawImages
          .filter((img) => typeof img === 'string' && img.trim() !== '')
          .map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`));
        const mainImage = validImages[0] || `${BASE_URL}/logo.png`;
        const additionalImages = validImages.slice(1, 10);

        const cleanTitle = (p.display_name || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const cleanDescription = (p.description || `Buy ${p.display_name} online in Nepal at best price.`)
          .replace(/<[^>]+>/g, '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .trim();

        const brand = (p.brand && p.brand !== 'No Brand' ? p.brand : 'Bagmati Shop')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        const additionalImageTags = additionalImages
          .map((img) => `<g:additional_image_link>${img}</g:additional_image_link>`)
          .join('\n        ');

        return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${cleanTitle}</g:title>
      <g:description>${cleanDescription.slice(0, 5000)}</g:description>
      <g:link>${BASE_URL}/products/${p.slug}</g:link>
      <g:image_link>${mainImage}</g:image_link>
      ${additionalImageTags}
      <g:condition>new</g:condition>
      <g:availability>${(p.stock_quantity ?? 10) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${price} NPR</g:price>
      <g:brand>${brand}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>NP</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>100 NPR</g:price>
      </g:shipping>
    </item>`;
      })
      .join('');

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bagmati Shop Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Google Merchant Center Product Feed for Bagmati Shop Nepal</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
