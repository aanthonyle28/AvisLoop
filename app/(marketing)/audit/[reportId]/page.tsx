import { notFound } from 'next/navigation'

/*
 * Shareable audit report page — /audit/[reportId]
 *
 * DISABLED: Feature not ready for production.
 * To re-enable, restore from git: git checkout HEAD~N -- app/(marketing)/audit/[reportId]/page.tsx
 * Original commit: ec37b2b
 */

type Props = {
  params: Promise<{ reportId: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function ReportPage(_props: Props) {
  notFound()
}
