import Link from 'next/link'
import { format } from 'date-fns'
import { AvatarInitials } from './avatar-initials'
import {
  ClockCountdown,
  CheckCircle,
  Sparkle,
  XCircle,
  Star,
  ArrowRight,
  ListBullets,
} from '@phosphor-icons/react/dist/ssr'

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
  pending: {
    bgColor: 'bg-status-pending-bg',
    textColor: 'text-status-pending-text',
    icon: ClockCountdown,
    label: 'Pending',
  },
  sent: {
    bgColor: 'bg-status-delivered-bg',
    textColor: 'text-status-delivered-text',
    icon: CheckCircle,
    label: 'Sent',
  },
  delivered: {
    bgColor: 'bg-status-delivered-bg',
    textColor: 'text-status-delivered-text',
    icon: CheckCircle,
    label: 'Delivered',
  },
  opened: {
    bgColor: 'bg-status-clicked-bg',
    textColor: 'text-status-clicked-text',
    icon: Sparkle,
    label: 'Clicked',
  },
  failed: {
    bgColor: 'bg-status-failed-bg',
    textColor: 'text-status-failed-text',
    icon: XCircle,
    label: 'Failed',
  },
  bounced: {
    bgColor: 'bg-status-failed-bg',
    textColor: 'text-status-failed-text',
    icon: XCircle,
    label: 'Failed',
  },
  complained: {
    bgColor: 'bg-status-failed-bg',
    textColor: 'text-status-failed-text',
    icon: XCircle,
    label: 'Failed',
  },
  reviewed: {
    bgColor: 'bg-status-reviewed-bg',
    textColor: 'text-status-reviewed-text',
    icon: Star,
    label: 'Reviewed',
  },
} as const

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <Icon size={12} weight="bold" />
      {config.label}
    </span>
  )
}

export function RecentActivityTable({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white border border-[#E3E3E3] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <ListBullets size={18} weight="bold" className="text-foreground" />
            <h3 className="font-semibold text-base">Recent Activity</h3>
          </div>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View All
            <ArrowRight size={14} weight="bold" />
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
        <div className="flex items-center gap-2">
          <ListBullets size={18} weight="bold" className="text-foreground" />
          <h3 className="font-semibold text-base">Recent Activity</h3>
        </div>
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          View All
          <ArrowRight size={14} weight="bold" />
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
                    <StatusBadge status={activity.status} />
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
