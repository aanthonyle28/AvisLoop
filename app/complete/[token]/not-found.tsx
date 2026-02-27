import { XCircle } from '@phosphor-icons/react/dist/ssr'

/**
 * Custom not-found page for invalid or regenerated job completion form tokens.
 * Renders when /complete/[token] cannot resolve the token to a business.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-xl border p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle size={32} className="text-destructive" weight="fill" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
          <p className="text-muted-foreground">
            This job completion form link is invalid or has been regenerated.
            Please ask your manager for the updated link.
          </p>
        </div>
      </div>
    </div>
  )
}
