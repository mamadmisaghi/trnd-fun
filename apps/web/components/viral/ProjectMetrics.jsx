"use client";

import React, { useEffect, useMemo, useState } from "react";
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
    { label: "Total TRND burn", value: "38.6M", detail: "TRND bought & burned" },
    { label: "Creator fees paid", value: "$7.36M", detail: "Claimed by creators" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {metrics.map((m, index) => (
        <div
          key={m.label}
          className="bg-card/95 border border-border rounded-md px-3.5 py-3 min-h-[78px] flex flex-col hover:border-border-strong transition-colors animate-metric-reveal"
          style={{ animationDelay: `${180 + index * 65}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-semibold tracking-[0.13em] uppercase text-mutedtext truncate pr-2">{m.label}</span>
            <Info size={12} className="text-mutedtext/60 shrink-0" />
          </div>
          <CountUp value={m.value} delay={260 + index * 70} />
          <span className="text-[10px] text-mutedtext mt-auto pt-1">{m.detail}</span>
        </div>
      ))}
    </div>
  );
}

function CountUp({ value, delay = 0, duration = 1250 }) {
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setCurrent(parsed.target); return undefined; }
    let frame;
    let startedAt;
    const timer = window.setTimeout(() => {
      const tick = (time) => {
        if (!startedAt) startedAt = time;
        const progress = Math.min(1, (time - startedAt) / duration);
        setCurrent(parsed.target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);
    return () => { window.clearTimeout(timer); if (frame) window.cancelAnimationFrame(frame); };
  }, [delay, duration, parsed.target]);

  const number = current.toLocaleString("en-US", { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals, useGrouping: parsed.grouped });
  return <span aria-label={String(value)} className="font-mono-nums tabular text-xl text-foreground leading-none mt-1.5">{parsed.prefix}{number}{parsed.suffix}</span>;
}

function parseDisplayValue(value) {
  const display = String(value);
  const match = display.match(/[\d,.]+/);
  if (!match) return { target: 0, prefix: "", suffix: display, decimals: 0, grouped: false };
  const numeric = match[0];
  const decimalPart = numeric.replaceAll(",", "").split(".")[1] || "";
  return { target: Number(numeric.replaceAll(",", "")), prefix: display.slice(0, match.index), suffix: display.slice((match.index || 0) + numeric.length), decimals: decimalPart.length, grouped: numeric.includes(",") };
}
