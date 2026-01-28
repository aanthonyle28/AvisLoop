import { GeometricMarker } from "@/components/ui/geometric-marker";

const stats = [
  {
    value: "10K+",
    label: "Reviews requested",
    markerColor: "lime" as const,
  },
  {
    value: "85%",
    label: "Average open rate",
    markerColor: "coral" as const,
  },
  {
    value: "500+",
    label: "Happy businesses",
    markerColor: "lime" as const,
  },
  {
    value: "<30s",
    label: "Time to send",
    markerColor: "coral" as const,
  },
];

export function StatsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Results that matter
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GeometricMarker variant="triangle" color={stat.markerColor} size="md" />
                <span className="text-4xl md:text-5xl font-bold">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
