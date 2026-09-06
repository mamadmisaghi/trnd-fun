import React from "react";
import { Info } from "lucide-react";
import { pairCatalog } from "@/data";

export default function ProjectMetrics() {
  const metrics = [
    { label: "Events scanned / 24H", value: "1,284", detail: "Across all sources" },
    { label: "Viral events", value: "312", detail: "Scored above 70" },
    { label: "Markets launched", value: "247", detail: "Signal-originated" },
    { label: "Launch volume", value: "$48.2M", detail: "Tracked markets" },
    { label: "Active o1 pairs", value: pairCatalog.activeCount, detail: "Current sync" },
    { label: "Source coverage", value: "4", detail: "X · TikTok · IG · YT" },
    { label: "Total VIRAL burn", value: "38.6M", detail: "VIRAL bought & burned" },
    { label: "Creator fees paid", value: "$7.36M", detail: "Claimed by creators" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-card/95 border border-border rounded-md px-3.5 py-3 min-h-[78px] flex flex-col hover:border-border-strong transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-semibold tracking-[0.13em] uppercase text-mutedtext truncate pr-2">{m.label}</span>
            <Info size={12} className="text-mutedtext/60 shrink-0" />
          </div>
          <span className="font-mono-nums tabular text-xl text-foreground leading-none mt-1.5">{m.value}</span>
          <span className="text-[10px] text-mutedtext mt-auto pt-1">{m.detail}</span>
        </div>
      ))}
    </div>
  );
}
