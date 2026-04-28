import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Contact Phera — Indian Wedding Coordination' },
  description:
    'Get in touch with Phera. We help couples and planners run Indian weddings, destination weddings, and NRI celebrations.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    type: 'website',
    title: 'Contact Phera — Indian Wedding Coordination',
    description:
      'Get in touch with Phera. We help couples and planners run Indian weddings, destination weddings, and NRI celebrations.',
    url: '/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
