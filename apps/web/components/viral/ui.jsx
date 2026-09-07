import React from "react";
import { cn } from "@/lib/utils";

export function Metric({ label, value, sub, className = "", mono = true }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-heading font-medium tracking-[0.14em] uppercase text-mutedtext">{label}</span>
      <span className={cn("text-sm text-foreground leading-none", mono && "font-mono-nums tabular")}>{value}</span>
      {sub && <span className="text-[11px] text-mutedtext">{sub}</span>}
    </div>
  );
}

export function MetricChange({ value, className = "" }) {
  const positive = value >= 0;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 font-mono-nums tabular text-xs font-medium", className)}
      style={{ color: positive ? "#9CFF2E" : "#FF5E5E" }}
    >
      {positive ? "+" : ""}
      {typeof value === "number" ? value.toFixed(1) : value}%
    </span>
  );
}

export function FilterChip({ active, children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-secondarytext border-border-strong hover:text-foreground hover:border-mutedtext",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Divider({ className = "", vertical = false }) {
  return <div className={cn(vertical ? "w-px h-full" : "h-px w-full", "bg-border", className)} />;
}

export function SectionLabel({ children, className = "" }) {
  return (
    <span className={cn("text-[10px] font-heading font-semibold tracking-[0.18em] uppercase text-mutedtext", className)}>
      {children}
    </span>
  );
}

export function Panel({ children, className = "", hover = false }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg",
        hover && "transition-colors duration-200 hover:border-border-strong",
        className
      )}
    >
      {children}
    </div>
  );
}