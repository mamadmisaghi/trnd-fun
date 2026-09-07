import React from "react";
import { cn } from "@/lib/utils";

export function ViralMark({ className = "", size = 30, monochrome = false, onLight = false }) {
  return (
    <span aria-hidden="true" className={cn("trnd-mark inline-block shrink-0", className)} style={{ width: size, height: size, filter: monochrome ? "grayscale(1)" : undefined, mixBlendMode: onLight ? "multiply" : "screen" }} />
  );
}

export default function Logo({ mark = true, wordmark = true, className = "", size = 28, onLight = false, compact = false }) {
  return (
    <div className={cn("flex items-center select-none", compact ? "gap-2" : "gap-3", className)}>
      {mark && !wordmark && <ViralMark size={size} onLight={onLight} />}
      {wordmark && (
        <span
          role="img" aria-label="TRND.fun" className="trnd-wordmark inline-block shrink-0"
          style={{ width: size * 3.4, height: size, mixBlendMode: onLight ? "multiply" : "screen" }}
        >
        </span>
      )}
    </div>
  );
}
