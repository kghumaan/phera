import type { Metadata } from 'next'
import VendorJoinClient from './VendorJoinClient'

export const metadata: Metadata = {
  title: 'List Your Business | Phera Vendor Directory',
  description:
    'Join the Phera vendor directory and get discovered by NRI couples planning destination weddings across India and abroad.',
}

export default function VendorJoinPage() {
  return <VendorJoinClient />
}
