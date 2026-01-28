import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GeometricMarker } from "@/components/ui/geometric-marker";
import { Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Image placeholder component for hero section
function ImagePlaceholder({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted/50 border-2 border-dashed border-border rounded-lg",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">Your photo here</span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Trusted by 500+ local businesses
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-foreground">
              Get More Reviews.
              <br />
              Automatically.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Send review requests in under 30 seconds. No complex campaigns,
              no forgotten follow-ups. Just simple requests that actually get sent.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="text-base px-8 bg-foreground text-background hover:bg-foreground/90"
                asChild
              >
                <Link href="/auth/sign-up">Get Started Free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base border-border/60 hover:bg-muted/50"
                asChild
              >
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="mt-6 text-sm text-muted-foreground">
              25 free sends &bull; 2-min setup &bull; Cancel anytime
            </p>
          </div>

          {/* Right: Product Mockup */}
          <div className="relative lg:pl-8">
            {/* Main dashboard card */}
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 p-6 motion-safe:transform motion-safe:rotate-1 motion-safe:hover:rotate-0 motion-safe:transition-transform motion-safe:duration-500">
              {/* Browser dots */}
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>

              {/* Mock interface */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div className="font-semibold">Send Review Request</div>
                  <div className="text-xs text-muted-foreground">AvisLoop</div>
                </div>

                {/* Image placeholder area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <ImagePlaceholder
                    alt="Happy customer using AvisLoop"
                    className="w-full h-full"
                  />
                </div>

                {/* Send button mock */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-foreground text-background rounded-lg py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Request
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat card - top right */}
            <div className="absolute -top-4 -right-4 md:right-0 rounded-xl border border-border/50 bg-card shadow-lg p-4 motion-safe:transform motion-safe:-rotate-3 motion-safe:hover:rotate-0 motion-safe:transition-transform motion-safe:duration-300">
              <div className="flex items-center gap-3">
                <GeometricMarker variant="triangle" color="lime" size="md" />
                <div>
                  <div className="text-2xl font-bold text-lime">+47%</div>
                  <div className="text-xs text-muted-foreground">More reviews</div>
                </div>
              </div>
            </div>

            {/* Floating review card - bottom left */}
            <div className="absolute -bottom-4 -left-4 md:left-0 rounded-xl border border-border/50 bg-card shadow-lg p-4 motion-safe:transform motion-safe:rotate-2 motion-safe:hover:rotate-0 motion-safe:transition-transform motion-safe:duration-300">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="text-sm font-medium">&quot;Excellent service!&quot;</div>
              <div className="text-xs text-muted-foreground mt-1">— Sarah M.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
