import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Features — RSVPs, Travel, Multi-Event Coordination | Phera' },
  description:
    'Phera handles RSVPs, multi-day events, guest travel, room blocks, and the wedding-day timeline. Built for Indian weddings and destination celebrations.',
  alternates: {
    canonical: '/features',
  },
  openGraph: {
    type: 'website',
    title: 'Features — RSVPs, Travel, Multi-Event Coordination | Phera',
    description:
      'Phera handles RSVPs, multi-day events, guest travel, room blocks, and the wedding-day timeline. Built for Indian weddings and destination celebrations.',
    url: '/features',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
