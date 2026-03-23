import type { Metadata } from 'next';
import { PricingContent } from './_components/pricing-content';

export const metadata: Metadata = {
  title: 'Pricing — AvisLoop',
  description:
    'Simple, transparent pricing for managed web design. Starter $149/mo, Growth $249/mo, Pro $349/mo. No contracts, cancel anytime.',
  openGraph: {
    title: 'Pricing — AvisLoop',
    description:
      'Managed website design starting at $149/mo. No contracts, cancel anytime.',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
