import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg border text-card-foreground", {
  variants: {
    variant: {
      default: "bg-card border-border",
      amber:
        "bg-amber-50/60 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30",
      blue: "bg-blue-50/60 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-900/30",
      green:
        "bg-green-50/60 border-green-200/50 dark:bg-green-950/20 dark:border-green-900/30",
      red: "bg-red-50/60 border-red-200/50 dark:bg-red-950/20 dark:border-red-900/30",
      ghost: "bg-transparent border-transparent",
      subtle: "bg-muted border-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const InteractiveCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="interactive-card"
      className={cn(
        cardVariants({ variant }),
        "relative group transition-all duration-200 cursor-pointer hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRight
        size={14}
        weight="bold"
        className="absolute bottom-3 right-3 text-muted-foreground/30 transition-colors duration-200 group-hover:text-muted-foreground/70"
      />
    </div>
  ),
);
InteractiveCard.displayName = "InteractiveCard";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  InteractiveCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
