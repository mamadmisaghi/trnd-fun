import React from "react";
import { cn } from "@/lib/utils";
import { STATUSES } from "@/data";

export function StatusBadge({ status, className = "" }) {
  const s = STATUSES[status];
  if (!s) return null;
  const isLive = status === "HEATING" || status === "VIRAL" || status === "LAUNCHED" || status === "RESERVED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-heading font-semibold tracking-[0.14em] uppercase rounded-sm border",
        className
      )}
      style={{
        color: s.color,
        borderColor: status === "NEW" ? "#283129" : `${s.color}33`,
        background: status === "NEW" ? "transparent" : `${s.color}0d`,
      }}
    >
      {isLive && <span className="w-1 h-1 rounded-full animate-flare-pulse" style={{ background: s.color }} />}
      {s.label}
    </span>
  );
}

export function LiveDot({ className = "", label = "LIVE" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-heading font-semibold tracking-[0.16em] text-primary", className)}>
      <span className="relative flex w-1.5 h-1.5">
        <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
      </span>
      {label}
    </span>
  );
}
