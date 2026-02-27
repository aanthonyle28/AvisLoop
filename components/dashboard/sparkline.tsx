'use client'

interface SparklineProps {
  data: number[]       // ordered values, oldest first
  color: string        // CSS color string (hex or hsl var) for stroke
  height?: number      // default 36
  className?: string   // additional classes for the SVG
}

export function Sparkline({ data, color, height = 36, className }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg
        viewBox="0 0 100 36"
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
        className={className}
        aria-hidden="true"
      >
        <line
          x1="4" y1="18" x2="96" y2="18"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="text-muted-foreground/25"
        />
      </svg>
    )
  }

  const w = 100
  const h = 36
  const pad = 2
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polylinePoints = pts.join(' ')

  // Gradient fill path: trace polyline then close to bottom
  const firstX = pts[0].split(',')[0]
  const lastX = pts[pts.length - 1].split(',')[0]
  const fillPath = `M ${pts.join(' L ')} L ${lastX},${h} L ${firstX},${h} Z`

  // Generate stable gradientId from color (strip non-alphanumeric)
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
