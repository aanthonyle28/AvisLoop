import Link from 'next/link'
import { format } from 'date-fns'
import { AvatarInitials } from './avatar-initials'

interface RecentActivityProps {
  activities: Array<{
    id: string
    contact_name: string
    contact_email: string
    subject: string
    status: string
    created_at: string
  }>
}

const STATUS_CONFIG = {
  pending: { color: 'bg-status-warning', label: 'Pending' },
  sent: { color: 'bg-status-info', label: 'Sent' },
  delivered: { color: 'bg-status-success', label: 'Delivered' },
  opened: { color: 'bg-status-info', label: 'Clicked' },
  failed: { color: 'bg-status-error', label: 'Failed' },
  bounced: { color: 'bg-status-error', label: 'Failed' },
  complained: { color: 'bg-status-error', label: 'Failed' },
  reviewed: { color: 'bg-status-reviewed', label: 'Reviewed' },
} as const

export function RecentActivityTable({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white border border-[#E3E3E3] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-semibold text-base">Recent activity</h3>
          <Link href="/history" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="px-5 py-12 text-center text-muted-foreground">
          <p>No sends yet — send your first review request!</p>
          <Link href="/send" className="text-primary hover:underline mt-2 inline-block">
            Send a review request
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="font-semibold text-base">Recent activity</h3>
        <Link href="/history" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subject
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => {
              const statusConfig = STATUS_CONFIG[activity.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
              const isLast = index === activities.length - 1

              return (
                <tr
                  key={activity.id}
                  className={isLast ? '' : 'border-b border-[#F3F4F6]'}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={activity.contact_name} size="sm" />
                      <div>
                        <div className="font-medium text-sm">{activity.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{activity.contact_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm max-w-[200px] truncate">
                      {activity.subject}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      <span className="text-sm">{statusConfig.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
