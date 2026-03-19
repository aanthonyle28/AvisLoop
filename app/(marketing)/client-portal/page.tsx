import type { Metadata } from 'next';
import { PortalContent } from './_components/portal-content';

export const metadata: Metadata = {
  title: 'Client Portal — AvisLoop',
  description:
    'Access your web design project portal to submit revision requests and track progress.',
};

export default function ClientPortalPage() {
  return <PortalContent />;
}
