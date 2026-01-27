import { Mail, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  hasFilters: boolean
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          No messages found
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Try adjusting your search or filters to find what you&apos;re looking for
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Mail className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        No messages sent yet
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Send your first review request to see your message history here
      </p>
      <Button asChild>
        <Link href="/dashboard/send">Send a message</Link>
      </Button>
    </div>
  )
}
