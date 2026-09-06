import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
  secondary: "bg-secondary text-foreground hover:bg-graphite border border-border-strong",
  ghost: "bg-transparent text-secondarytext hover:text-foreground hover:bg-secondary border border-transparent",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30",
  outline: "bg-transparent text-foreground border border-border-strong hover:border-primary/50 hover:text-primary",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
  icon: "h-9 w-9",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  as: As = "button",
  ...props
}) {
  return (
    <As
      className={cn(
        "inline-flex items-center justify-center gap-2 font-heading font-medium tracking-wide rounded-md transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </As>
  );
}