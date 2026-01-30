import Link from 'next/link'

export function AuthSplitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: Form content */}
      <div className="flex flex-col">
        {/* Logo header */}
        <div className="p-6">
          <Link href="/" className="text-xl font-bold">
            AvisLoop
          </Link>
        </div>
        {/* Centered form area */}
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6 lg:px-16">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Right: Styled panel (hidden on mobile) */}
      <div className="relative hidden lg:block bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="flex h-full items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary/20">A</div>
            <p className="text-muted-foreground text-sm">Product Preview</p>
          </div>
        </div>
      </div>
    </div>
  )
}
