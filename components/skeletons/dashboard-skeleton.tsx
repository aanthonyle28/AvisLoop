import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Welcome header skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stat cards row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#E3E3E3] rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-9 w-32 mb-1" />
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* Quick Send + When to Send skeleton */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Quick Send panel */}
        <div className="flex-1 bg-white border border-[#E3E3E3] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* When to Send panel */}
        <div className="w-full md:w-64 md:shrink-0 bg-white border border-[#E3E3E3] rounded-lg p-5">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>

      {/* Recent Activity skeleton */}
      <div className="bg-white border border-[#E3E3E3] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-12" />
                </th>
                <th className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-12" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={i < 4 ? 'border-b border-[#F3F4F6]' : ''}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
