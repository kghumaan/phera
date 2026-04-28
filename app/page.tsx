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
  },
};

export default function Page() {
  return <HomePageClient />;
}
