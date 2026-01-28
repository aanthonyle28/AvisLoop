import { cn } from "@/lib/utils";

interface GeometricMarkerProps {
  variant: "triangle" | "circle";
  color?: "lime" | "coral" | "primary";
  size?: "sm" | "md";
  className?: string;
}

export function GeometricMarker({
  variant,
  color = "lime",
  size = "sm",
  className,
}: GeometricMarkerProps) {
  const colorClasses = {
    lime: "bg-lime text-lime-foreground",
    coral: "bg-coral text-coral-foreground",
    primary: "bg-primary text-primary-foreground",
  };

  const sizeClasses = {
    sm: variant === "triangle" ? "w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px]" : "w-2 h-2",
    md: variant === "triangle" ? "w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px]" : "w-3 h-3",
  };

  if (variant === "triangle") {
    return (
      <span
        className={cn(
          "inline-block border-l-transparent border-r-transparent",
          color === "lime" && "border-b-lime",
          color === "coral" && "border-b-coral",
          color === "primary" && "border-b-primary",
          sizeClasses[size],
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-block rounded-full",
        colorClasses[color],
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  );
}
