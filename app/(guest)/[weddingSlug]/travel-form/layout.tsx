import type { Metadata } from 'next';
import { COLORS, RADII } from '@/lib/theme/tokens';

export async function generateMetadata({ params }: { params: Promise<{ weddingSlug: string }> }): Promise<Metadata> {
  const { weddingSlug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io";

  return {
    title: "Travel Form - Sim & KV's Wedding",
    description: "Reserve a spot on a 35 person bus to/from Bangkok and Hua Hin",

    // Open Graph tags for WhatsApp/iMessage preview
    openGraph: {
      title: "Travel Form",
      description: "Reserve a spot on a 35 person bus to/from Bangkok and Hua Hin",
      type: "website",
      url: `${siteUrl}/${weddingSlug}/travel-form`,
      siteName: "Phera",
      images: [
        {
          url: `${siteUrl}/images/couple/imessage-optimized.jpg`,
          width: 1200,
          height: 630,
          alt: "Travel Form - Reserve your shuttle",
          type: "image/jpeg",
        },
      ],
      locale: "en_US",
    },

    // Twitter Card tags
    twitter: {
      card: "summary_large_image",
      title: "Travel Form",
      description: "Reserve a spot on a 35 person bus to/from Bangkok and Hua Hin",
      images: [`${siteUrl}/images/couple/imessage-optimized.jpg`],
    },
  };
}

export default function TravelFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
