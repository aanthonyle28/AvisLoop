import { cn } from "@/lib/utils";
import { GeometricMarker } from "@/components/ui/geometric-marker";

interface FeatureSectionProps {
  id?: string;
  badge?: string;
  title: string;
  description: string;
  features: string[];
  stats?: { value: string; label: string }[];
  imageSide: "left" | "right";
  imageSlot?: React.ReactNode;
  className?: string;
}

export function FeatureSection({
  id,
  badge,
  title,
  description,
  features,
  stats,
  imageSide,
  imageSlot,
  className,
}: FeatureSectionProps) {
  const content = (
    <div className="space-y-6">
      {badge && (
        <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground border border-border rounded-full">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-balance">{title}</h2>
      <p className="text-lg text-muted-foreground">{description}</p>

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <GeometricMarker variant="circle" color="lime" className="mt-1.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {stats && stats.length > 0 && (
        <div className="flex gap-8 pt-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const image = (
    <div className="relative aspect-[4/3] rounded-2xl bg-muted/30 border border-border/50 overflow-hidden">
      {imageSlot || (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Screenshot placeholder</span>
        </div>
      )}
    </div>
  );

  return (
    <section id={id} className={cn("py-20 md:py-28", id && "scroll-mt-20", className)}>
      <div className="container mx-auto max-w-6xl px-4">
        <div
          className={cn(
            "grid md:grid-cols-2 gap-12 items-center",
            imageSide === "left" && "md:grid-flow-dense"
          )}
        >
          {imageSide === "left" ? (
            <>
              <div className="md:col-start-1">{image}</div>
              <div className="md:col-start-2">{content}</div>
            </>
          ) : (
            <>
              {content}
              {image}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const featureData = [
  {
    badge: "Simple",
    title: "Send review requests in seconds",
    description:
      "No complicated campaigns or multi-step workflows. Select a contact, preview your message, click send. Done.",
    features: [
      "One-click sending from your dashboard",
      "Personalized messages for each contact",
      "Smart cooldowns prevent over-sending",
    ],
    stats: [{ value: "<30s", label: "Average time to send" }],
    imageSide: "right" as const,
  },
  {
    badge: "Organized",
    title: "Keep all your contacts in one place",
    description:
      "Import your customer list or add contacts one by one. Search, filter, and manage with ease.",
    features: [
      "CSV import for bulk uploads",
      "Search and filter instantly",
      "Archive inactive contacts",
    ],
    stats: [{ value: "500+", label: "Contacts supported" }],
    imageSide: "left" as const,
  },
  {
    badge: "Trackable",
    title: "See who opened, clicked, and reviewed",
    description:
      "Full visibility into every message you send. Know exactly what's working.",
    features: [
      "Real-time delivery status",
      "Open and click tracking",
      "Complete message history",
    ],
    stats: [{ value: "85%", label: "Average open rate" }],
    imageSide: "right" as const,
  },
];

export function Features() {
  return (
    <>
      {featureData.map((feature, i) => (
        <FeatureSection
          key={i}
          id={i === 0 ? "features" : undefined}
          {...feature}
          className={cn(i % 2 === 1 && "bg-muted/30")}
        />
      ))}
    </>
  );
}
