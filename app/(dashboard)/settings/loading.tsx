import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky header area */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <Skeleton className="h-9 w-32 mb-1" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Body content */}
      <div className="p-6 space-y-8">
        {/* Tabs bar */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Content card */}
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
            <Skeleton className="h-10 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
