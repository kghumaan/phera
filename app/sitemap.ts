import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = 'https://www.phera.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all blog posts to get their slugs and dates
  const posts = getAllPosts();

  const blogPosts = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticPages = [
    '',
    '/about',
    '/blog',
    '/contact',
    '/privacy',
    '/demo',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticPages, ...blogPosts];
}
