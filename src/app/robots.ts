import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/checkout',
        '/account',
        '/admin',
        '/login',
        '/signup',
        '/auth',
      ],
    },
    sitemap: 'https://bagmati.shop/sitemap.xml',
  };
}
