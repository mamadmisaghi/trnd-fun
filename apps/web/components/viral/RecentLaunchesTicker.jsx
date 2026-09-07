import React from "react";
import { Link } from "@/lib/navigation";
import { tokens } from "@/data";
import Sparkline from "@/components/viral/Sparkline";
import { Image } from "@/components/ui/image";

export default function RecentLaunchesTicker() {
  const items = [...tokens, ...tokens];

  return (
    <section className="border-y border-border bg-deep overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 border-b border-border">
        <span className="text-[10px] font-heading font-semibold tracking-[0.18em] uppercase text-mutedtext">Recently launched</span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono-nums text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-flare-pulse" /> on Robinhood Chain
        </span>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 animate-flare-ticker whitespace-nowrap py-3 px-3">
          {items.map((t, i) => (
            <Link
              key={`${t.id}-${i}`}
              to={`/token/${t.id}`}
              className="shrink-0 flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 hover:border-border-strong transition-colors"
            >
              <div className="w-9 h-9 rounded-md overflow-hidden bg-elevated border border-border shrink-0">
                <Image src={t.image} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col min-w-0 w-28">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-semibold text-sm text-foreground">${t.ticker}</span>
                  <span className="font-mono-nums text-[11px] text-mutedtext">{t.age} ago</span>
                </div>
                <span className="text-[11px] text-secondarytext truncate">{t.name}</span>
              </div>
              <div className="w-20 shrink-0">
                <Sparkline
                  data={t.sparkline}
                  width={80}
                  height={28}
                  color={t.change24h >= 0 ? "#9CFF2E" : "#FF5E5E"}
                />
              </div>
              <span
                className="font-mono-nums text-xs font-medium shrink-0"
                style={{ color: t.change24h >= 0 ? "#9CFF2E" : "#FF5E5E" }}
              >
                {t.change24h >= 0 ? "+" : ""}
                {t.change24h.toFixed(1)}%
              </span>
              <span className="text-border-strong shrink-0">|</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}