import { Mail, Users, FileText, BarChart3 } from "lucide-react";

const features = [
  {
    name: "One-Click Sending",
    description: "Send review requests in seconds. No complicated campaigns or workflows.",
    icon: Mail,
  },
  {
    name: "Contact Management",
    description: "Keep track of all your customers. Import from CSV or add manually.",
    icon: Users,
  },
  {
    name: "Email Templates",
    description: "Customize your message to match your brand voice and style.",
    icon: FileText,
  },
  {
    name: "Track Everything",
    description: "See delivery status, opens, and history for every message sent.",
    icon: BarChart3,
  },
];

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need to get more reviews
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple tools that help busy business owners request reviews without the hassle.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="bg-background rounded-lg p-6 shadow-sm border border-border/40"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
