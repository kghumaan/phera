import { Container, Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { BACKGROUNDS } from '@/lib/constants/images';
import MDXComponents from '@/components/blog/MDXComponents';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { notFound } from 'next/navigation';
import AppFooter from '@/components/shared/AppFooter';
import FAQSection from '@/components/landing/FAQSection';
import { FAQ_ITEMS } from '@/lib/landing/faq-content';
import { COLORS, FONTS } from '@/lib/theme/tokens';
import '@/app/landing-design.css';

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

  const ogImage = post.image || '/images/couple/imessage-optimized.jpg';

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
      url: `/blog/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
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

  const SITE_ORIGIN = 'https://www.phera.io';
  const FALLBACK_IMAGE = '/images/couple/imessage-optimized.jpg';
  const imagePath = post.image || FALLBACK_IMAGE;
  const absoluteImage = imagePath.startsWith('http') ? imagePath : `${SITE_ORIGIN}${imagePath}`;
  // Posts ship a date-only string (YYYY-MM-DD); promote to full ISO 8601 with UTC timezone for schema validity.
  const datePublishedIso = new Date(`${post.date}T00:00:00Z`).toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: absoluteImage,
    datePublished: datePublishedIso,
    dateModified: datePublishedIso,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: `${SITE_ORIGIN}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Phera',
      url: SITE_ORIGIN,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_ORIGIN}/blog/${slug}`,
    },
  };

  return (
    <OptimizedBackground src={BACKGROUNDS.PERIWINKLE_PINK_SUNSET} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Same FAQPage schema as the landing page — both render FAQ_ITEMS. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          }),
        }}
      />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 18 }, pb: 10 }}>
        <Container maxWidth="md">
          {/* Back link */}
          <Link href="/blog" className="no-underline">
            <Button
              startIcon={<ArrowBack />}
              sx={{
                color: COLORS.text.muted,
                textTransform: 'none',
                mb: 3,
                borderRadius: 1,
                '&:hover': { color: COLORS.brand.primary, bgcolor: 'transparent' },
              }}
            >
              Back to blog
            </Button>
          </Link>

          {/* Title and meta */}
          <Typography
            variant="h1"
            sx={{
              fontFamily: FONTS.display,
              fontStyle: 'italic',
              fontSize: { xs: '2rem', md: '2.75rem' },
              color: COLORS.text.strong,
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

          <Box sx={{ display: 'flex', gap: 0.5, mb: 5, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Box
                key={tag}
                component="span"
                sx={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '0.625rem',
                  lineHeight: 1.4,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.brand.primary,
                  bgcolor: '#FDE8EC',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                }}
              >
                {tag}
              </Box>
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
            <MDXRemote
              source={post.content}
              components={MDXComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
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
                fontFamily: FONTS.display,
                fontStyle: 'italic',
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: COLORS.text.strong,
                mb: 1.5,
              }}
            >
              Planning an Indian wedding?
            </Typography>
            <Typography
              sx={{
                color: COLORS.text.muted,
                fontSize: '1rem',
                mb: 3,
              }}
            >
              Phera is the wedding planning platform built for multi-day Indian celebrations.
            </Typography>
            <Link href="/auth/login" className="no-underline">
              <Button
                variant="contained"
                sx={{
                  bgcolor: COLORS.brand.primary,
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: 24,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': { bgcolor: COLORS.brand.primaryHover },
                }}
              >
                Get started for free
              </Button>
            </Link>
          </Box>
        </Container>

        {/* Landing-page FAQ, full-bleed under every article. Wrapped in
            `phera-landing` so the scoped rules in landing-design.css apply. */}
        <Box className="phera-landing" sx={{ mt: 10 }}>
          <FAQSection />
        </Box>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
