import type { Metadata } from 'next';
import { PricingContent } from './_components/pricing-content';

export const metadata: Metadata = {
  title: 'Pricing — AvisLoop',
  description:
    'Simple, transparent pricing for managed web design. Basic $199/mo, Advanced $299/mo. No setup fees, no contracts, cancel anytime.',
  openGraph: {
    title: 'Pricing — AvisLoop',
    description:
      'Managed website design starting at $199/mo. No setup fees, no contracts, cancel anytime.',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
