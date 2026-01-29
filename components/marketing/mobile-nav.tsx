"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border/30 bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto max-w-6xl flex flex-col gap-1 px-4 py-3">
            <Button variant="ghost" size="sm" asChild className="justify-start" onClick={() => setOpen(false)}>
              <Link href="/#features">Features</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="justify-start" onClick={() => setOpen(false)}>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="justify-start" onClick={() => setOpen(false)}>
              <Link href="/#faq">FAQ</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
