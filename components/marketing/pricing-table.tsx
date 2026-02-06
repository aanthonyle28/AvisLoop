"use client";

import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import {
  InteractiveCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  recommended?: boolean;
}

const tiers: Tier[] = [
  {
    name: "Free Trial",
    price: "$0",
    period: "25 sends",
    description: "Try before you commit",
    features: [
      "25 free campaign touches",
      "All features included",
      "Multi-touch campaigns",
      "Email + SMS support",
      "No credit card required",
    ],
    cta: "Start Free Trial",
    href: "/auth/sign-up",
  },
  {
    name: "Basic",
    price: "$49",
    period: "/month",
    description: "For small businesses",
    features: [
      "200 campaign touches per month",
      "Unlimited customers",
      "Custom message templates",
      "Campaign analytics",
      "Email support",
    ],
    cta: "Get Started",
    href: "/auth/sign-up",
    recommended: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing businesses",
    features: [
      "500 campaign touches per month",
      "Unlimited customers",
      "Everything in Basic",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Upgrade to Pro",
    href: "/auth/sign-up",
  },
];

export function PricingTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {tiers.map((tier) => (
        <InteractiveCard
          key={tier.name}
          className={cn(
            "relative flex flex-col",
            tier.recommended && "border-primary shadow-lg"
          )}
        >
          {tier.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                RECOMMENDED
              </span>
            </div>
          )}

          <CardHeader className={cn(tier.recommended && "pt-8")}>
            <CardTitle className="text-xl">{tier.name}</CardTitle>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-muted-foreground ml-1">{tier.period}</span>
            </div>

            {/* Features list */}
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <Button
              asChild
              variant={tier.recommended ? "default" : "outline"}
              className="w-full"
            >
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </CardFooter>
        </InteractiveCard>
      ))}
    </div>
  );
}
