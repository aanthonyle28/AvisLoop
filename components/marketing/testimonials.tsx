const testimonials = [
  {
    quote: "I complete jobs on my phone between calls. AvisLoop handles the rest. Went from 12 to 47 Google reviews in two months.",
    author: "Mike Rodriguez",
    role: "Rodriguez HVAC, Phoenix AZ",
  },
  {
    quote: "The review funnel is genius. Bad experiences go to private feedback, good ones to Google. My rating went from 4.1 to 4.8.",
    author: "Sarah Chen",
    role: "Premier Plumbing Solutions",
  },
  {
    quote: "Finally something that doesn't require me to remember to follow up. System just runs. I just do my job.",
    author: "James Thompson",
    role: "Thompson Electric",
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
