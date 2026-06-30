import VendorMarketplaceClient from './VendorMarketplaceClient'

interface Props {
  params: Promise<{ weddingSlug: string }>
}

export default async function VendorMarketplacePage({ params }: Props) {
  const { weddingSlug } = await params
  return <VendorMarketplaceClient weddingSlug={weddingSlug} />
}
