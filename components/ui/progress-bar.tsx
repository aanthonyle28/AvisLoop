'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Start progress animation on pathname change
    setIsVisible(true)
    setProgress(0)

    // Animate to 80% over 500ms
    const startTimer = setTimeout(() => {
      setProgress(80)
    }, 50)

    // Complete animation to 100% after pathname settles (simulate route load)
    const completeTimer = setTimeout(() => {
      setProgress(100)
    }, 600)

    // Fade out after completion
    const fadeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 800)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(completeTimer)
      clearTimeout(fadeTimer)
    }
  }, [pathname])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-primary transition-all duration-500 ease-out"
      style={{
        width: `${progress}%`,
        opacity: isVisible ? 1 : 0,
        transition: 'width 500ms ease-out, opacity 200ms ease-in-out',
      }}
    />
  )
}
