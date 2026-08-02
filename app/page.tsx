import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: { absolute: 'Phera | Indian Wedding Planning & Coordination Platform' },
  description:
    'Plan your Indian wedding with Phera. Manage RSVPs, coordinate guest travel, and run timelines — built for destination weddings and NRI couples.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Phera | Indian Wedding Planning & Coordination Platform',
    description:
      'Plan your Indian wedding with Phera. Manage RSVPs, coordinate guest travel, and run timelines — built for destination weddings and NRI couples.',
    url: '/',
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

export default function Page() {
  return <HomePageClient />;
}
