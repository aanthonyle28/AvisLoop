import { FadeIn } from "@/components/ui/fade-in";
import { GeometricMarker } from "@/components/ui/geometric-marker";

export function SocialProofStrip() {
  const industries = ["Dentists", "Salons", "Contractors", "Gyms", "Restaurants", "Clinics"];
  const colors: Array<"lime" | "coral" | "primary"> = ["lime", "coral", "primary"];

  return (
    <section className="border-y border-border/30 py-12 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center space-y-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by 500+ businesses
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {industries.map((industry, i) => (
                <span
                  key={industry}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground motion-safe:transition-colors hover:text-foreground hover:border-border"
                >
                  <GeometricMarker variant="circle" color={colors[i % 3]} size="sm" />
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
