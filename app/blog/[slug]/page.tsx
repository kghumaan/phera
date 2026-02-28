import { Container, Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { BACKGROUNDS } from '@/lib/constants/images';
import MDXComponents from '@/components/blog/MDXComponents';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/shared/AppFooter';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Phera Blog`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      siteName: 'Phera',
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Phera',
      url: 'https://phera.io',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://phera.io/blog/${slug}`,
    },
  };

  return (
    <OptimizedBackground src={BACKGROUNDS.PERIWINKLE_PINK_SUNSET} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 18 }, pb: 10 }}>
        <Container maxWidth="md">
          {/* Back link */}
          <Link href="/blog" className="no-underline">
            <Button
              startIcon={<ArrowBack />}
              sx={{
                color: '#4a4a4a',
                textTransform: 'none',
                mb: 3,
                borderRadius: 1,
                '&:hover': { color: '#DE3F5E', bgcolor: 'transparent' },
              }}
            >
              Back to blog
            </Button>
          </Link>

          {/* Title and meta */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              fontStyle: 'italic',
              fontSize: { xs: '2rem', md: '2.75rem' },
              color: '#1a1a1a',
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            {post.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
            <Typography
              component="time"
              variant="body2"
              sx={{ color: '#888' }}
            >
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#888' }}
            >
              ·
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#888' }}
            >
              {post.readingTime}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, mb: 5, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Typography
                key={tag}
                component="span"
                sx={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#DE3F5E',
                  bgcolor: '#FDE8EC',
                  px: 1,
                  py: 0.25,
                  borderRadius: 8,
                }}
              >
                {tag}
              </Typography>
            ))}
          </Box>

          {/* Featured Image */}
          {post.image && (
            <Box
              sx={{
                width: '100%',
                height: { xs: 240, sm: 360, md: 480 },
                borderRadius: 4,
                overflow: 'hidden',
                mb: 6,
                border: '1px solid #eee',
                bgcolor: '#F0E6E8',
              }}
            >
              <Box
                component="img"
                src={post.image}
                alt={post.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          {/* MDX Content */}
          <Box
            component="article"
            sx={{
              maxWidth: 720,
            }}
          >
            <MDXRemote source={post.content} components={MDXComponents} />
          </Box>

          {/* CTA */}
          <Box
            sx={{
              maxWidth: 720,
              mt: 8,
              p: { xs: 4, md: 5 },
              bgcolor: '#fff',
              borderRadius: 3,
              textAlign: 'center',
              border: '1px solid #eee',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'var(--font-instrument-serif)',
                fontStyle: 'italic',
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: '#1a1a1a',
                mb: 1.5,
              }}
            >
              Planning an Indian wedding?
            </Typography>
            <Typography
              sx={{
                color: '#4a4a4a',
                fontSize: '1rem',
                mb: 3,
              }}
            >
              Phera is the wedding planning platform built for multi-day Indian celebrations.
            </Typography>
            <Link href="/auth/signup" className="no-underline">
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#DE3F5E',
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: 24,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': { bgcolor: '#C8365A' },
                }}
              >
                Get started for free
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
