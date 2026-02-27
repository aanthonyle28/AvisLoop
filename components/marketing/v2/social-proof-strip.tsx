const stats = [
  { value: '3x', label: 'more reviews in 90 days' },
  { value: '4.8+', label: 'average client rating' },
  { value: '47%', label: 'review response rate' },
  { value: '10s', label: 'per job entry' },
];

export function SocialProofStrip() {
  return (
    <section className="py-10 border-y border-border/30">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
