import { Container, Box, Typography } from '@mui/material';
import Link from 'next/link';
import { Metadata } from 'next';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { BACKGROUNDS } from '@/lib/constants/images';
import { getAllPosts } from '@/lib/blog';
import AppFooter from '@/components/shared/AppFooter';
import { FONTS } from '@/lib/theme/tokens';

export const metadata: Metadata = {
  title: 'Indian Wedding Planning Blog | Phera',
  description:
    'Expert tips and guides for planning Indian weddings. RSVP management, destination wedding logistics, multi-day celebration planning, guest coordination, and more.',
  keywords: [
    'indian wedding planning',
    'destination wedding india',
    'indian wedding rsvp',
    'multi-day wedding planning',
    'indian wedding website',
    'wedding guest management',
    'indian wedding logistics',
    'south asian wedding planning',
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Indian Wedding Planning Blog | Phera',
    description:
      'Expert tips and guides for planning Indian weddings. RSVP management, destination wedding logistics, and more.',
    type: 'website',
    siteName: 'Phera',
    url: '/blog',
    images: [
      {
        url: '/images/couple/imessage-optimized.jpg',
        width: 1200,
        height: 630,
        alt: 'Phera - Indian Wedding Platform',
        type: 'image/jpeg',
      },
    ],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <OptimizedBackground src={BACKGROUNDS.PERIWINKLE_PINK_SUNSET} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 20 }, pb: 10 }}>
        <Container maxWidth="lg">
          {/* Header - left aligned */}
          <Box sx={{ mb: { xs: 5, md: 8 } }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: FONTS.display,
                fontStyle: 'italic',
                fontSize: { xs: '2.25rem', md: '3rem' },
                color: '#1a1a1a',
                mb: 1.5,
              }}
            >
              The Phera Blog
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: '#4a4a4a',
                maxWidth: 560,
              }}
            >
              Honest thoughts on planning Indian weddings, and how to make the process a little less chaotic.
            </Typography>
          </Box>

          {/* Post Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="no-underline"
              >
                <Box
                  component="article"
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)',
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eee',
                  }}
                >
                  {/* Image */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      bgcolor: '#F0E6E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    role="img"
                    aria-label={`Blog post: ${post.title}`}
                  >
                    {post.image ? (
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
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: FONTS.display,
                          fontStyle: 'italic',
                          fontSize: '1.5rem',
                          color: '#DE3F5E',
                          opacity: 0.6,
                        }}
                      >
                        Phera
                      </Typography>
                    )}
                  </Box>

                  {/* Content */}
                  <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                      {post.tags.slice(0, 2).map((tag) => (
                        <Typography
                          key={tag}
                          component="span"
                          sx={{
                            fontSize: '0.3rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#DE3F5E',
                            bgcolor: '#FDE8EC',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          {tag}
                        </Typography>
                      ))}
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: '#1a1a1a',
                        mb: 1,
                        lineHeight: 1.3,
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        mb: 2,
                        flexGrow: 1,
                      }}
                    >
                      {post.description}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component="time"
                        variant="caption"
                        sx={{
                          color: '#888',
                        }}
                      >
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#888',
                        }}
                      >
                        {post.readingTime}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Link>
            ))}
          </Box>
        </Container>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
