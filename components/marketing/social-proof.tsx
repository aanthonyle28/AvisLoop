const brands = [
  "Dental Care Plus",
  "AutoFix Pro",
  "Bloom Salon",
  "Peak Fitness",
  "Green Thumb",
  "Swift Plumbing",
  "Bright Smiles",
  "Home Repair Co",
];

export function SocialProof() {
  return (
    <section className="py-12 border-y border-border/30">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Loved by brands
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
