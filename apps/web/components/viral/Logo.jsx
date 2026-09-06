import React from "react";
import { cn } from "@/lib/utils";

export function ViralMark({ className = "", size = 30, monochrome = false, onLight = false }) {
  const foreground = onLight ? "#080808" : "#FFFFFF";
  const signal = monochrome ? foreground : onLight ? "#080808" : "#A8FF00";

  return (
    <svg width={size} height={size} viewBox="0 0 72 64" fill="none" className={className} aria-hidden="true">
      <path d="M5 8H21L39 36L34.5 43L17 15H11.5L30.5 46L26 53L5 18Z" fill={foreground} />
      <path d="M28 52L50 8H57L35 52Z" fill={signal} />
      <path d="M39 52L61 8H68L46 52Z" fill={signal} />
      <path d="M50 52L67.5 17H72L54.5 52Z" fill={signal} />
    </svg>
  );
}

export default function Logo({ mark = true, wordmark = true, className = "", size = 28, onLight = false, compact = false }) {
  return (
    <div className={cn("flex items-center select-none", compact ? "gap-2" : "gap-3", className)}>
      {mark && <ViralMark size={size} onLight={onLight} />}
      {wordmark && (
        <span
          className="font-heading font-semibold uppercase leading-none whitespace-nowrap"
          style={{ fontSize: size * 0.5, letterSpacing: "0.15em", color: onLight ? "#080808" : "#FFFFFF" }}
        >
          VIRAL <span style={{ color: onLight ? "#080808" : "#A8FF00" }}>TERMINAL</span>
        </span>
      )}
    </div>
  );
}
