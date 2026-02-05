'use client'

import { ShieldCheck, ArrowSquareOut } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DnsRecordItem {
  label: string
  description: string
  setupInstructions: string
  docLink: string
}

const DNS_RECORDS: DnsRecordItem[] = [
  {
    label: 'SPF Record',
    description: 'Authorizes Resend to send email on your behalf',
    setupInstructions: 'Add SPF record to your domain DNS settings to authorize Resend as an email sender.',
    docLink: 'https://resend.com/docs/dashboard/domains/introduction',
  },
  {
    label: 'DKIM Signature',
    description: 'Cryptographically signs emails to prevent spoofing',
    setupInstructions: 'Configure DKIM signing to add cryptographic verification to your outgoing emails.',
    docLink: 'https://resend.com/docs/dashboard/domains/introduction',
  },
  {
    label: 'DMARC Policy',
    description: 'Sets policy for unauthenticated email handling',
    setupInstructions: 'Set up DMARC policy to specify how receiving servers should handle unauthenticated emails.',
    docLink: 'https://resend.com/docs/dashboard/domains/introduction',
  },
]

export function EmailAuthChecklist() {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="border border-border rounded-lg p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium mb-1">Email Authentication Setup</p>
            <p className="text-muted-foreground">
              Resend handles email authentication automatically through their platform.
              Configure these DNS records in your Resend dashboard to improve deliverability
              and prevent your emails from being marked as spam.
            </p>
          </div>
        </div>
      </div>

      {/* DNS Record Items */}
      <div className="space-y-3">
        {DNS_RECORDS.map((record) => (
          <div
            key={record.label}
            className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm">{record.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    Setup in Resend
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {record.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.setupInstructions}
                </p>
              </div>
              <a
                href={record.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <span className="hidden sm:inline">Docs</span>
                <ArrowSquareOut className="size-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Open Resend Dashboard button */}
      <div className="pt-2">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a
            href="https://resend.com/domains"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Open Resend Dashboard
            <ArrowSquareOut className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
