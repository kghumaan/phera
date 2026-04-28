import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Pricing — Indian Wedding Coordination Plans | Phera' },
  description:
    'Transparent pricing for Indian wedding coordination. Start free with the platform, add managed coordination when you need it. Plans for couples and planners.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    type: 'website',
    title: 'Pricing — Indian Wedding Coordination Plans | Phera',
    description:
      'Transparent pricing for Indian wedding coordination. Start free with the platform, add managed coordination when you need it. Plans for couples and planners.',
    url: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
