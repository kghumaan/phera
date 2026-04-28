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
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
