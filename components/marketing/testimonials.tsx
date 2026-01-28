const testimonials = [
  {
    quote: "Our Google reviews tripled in 3 months. This thing actually works.",
    author: "Dr. Sarah Chen",
    role: "Dental Care Plus",
  },
  {
    quote: "Finally something that doesn't require a PhD to use.",
    author: "Mike Rodriguez",
    role: "AutoFix Pro",
  },
  {
    quote: "My team actually uses this because it's so simple.",
    author: "Lisa Thompson",
    role: "Bloom Salon",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="space-y-4">
              <p className="text-lg font-medium leading-relaxed">
                &quot;{t.quote}&quot;
              </p>
              <footer className="text-sm text-muted-foreground">
                <cite className="not-italic font-medium text-foreground">{t.author}</cite>
                <span className="mx-2">&middot;</span>
                <span>{t.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
