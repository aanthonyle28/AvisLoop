interface AvatarInitialsProps {
  name: string
  size?: "sm" | "md"  // sm=32px, md=40px
}

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)

  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  } else {
    // Single name: use first two letters
    const single = parts[0]
    return (single.length >= 2 ? single.slice(0, 2) : single[0]).toUpperCase()
  }
}

function getColorForName(name: string): string {
  // Simple hash: sum of char codes mod 8
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }
  return COLORS[hash % COLORS.length]
}

export function AvatarInitials({ name, size = "md" }: AvatarInitialsProps) {
  const initials = getInitials(name)
  const colorClass = getColorForName(name)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClass}
        rounded-full
        flex
        items-center
        justify-center
        font-medium
      `}
    >
      {initials}
    </div>
  )
}
