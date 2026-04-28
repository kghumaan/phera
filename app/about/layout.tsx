import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'About — Modern Indian Wedding Coordination | Phera' },
  description:
    'Phera was built by a couple who planned their own Indian wedding. Now we help other couples and planners run shaadi logistics end-to-end.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    type: 'website',
    title: 'About — Modern Indian Wedding Coordination | Phera',
    description:
      'Phera was built by a couple who planned their own Indian wedding. Now we help other couples and planners run shaadi logistics end-to-end.',
    url: '/about',
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

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
