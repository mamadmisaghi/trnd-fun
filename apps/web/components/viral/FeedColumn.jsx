import React from "react";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { PLATFORMS } from "@/data";
import { LiveDot } from "@/components/viral/StatusBadge";
import FeedCard from "@/components/viral/FeedCard";

export default function FeedColumn({ platform, signals, index = 0 }) {
  const p = PLATFORMS[platform];
  const count = signals.length;

  return (
    <div
      className="h-[700px] sm:h-[760px] bg-deep border border-border rounded-lg overflow-hidden flex flex-col animate-flare-fade"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Column header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={platform} size={16} className="text-primary" />
            <span className="font-heading font-semibold text-foreground text-sm">{p.name}</span>
          </div>
          <LiveDot label="" />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="font-mono-nums text-3xl font-semibold text-foreground leading-none">{count}</div>
            <div className="text-[10px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext mt-1.5">
              {count > 0 ? "Active feeds" : "No active feed"}
            </div>
          </div>
          <span className="font-mono-nums text-[10px] text-mutedtext">LIVE</span>
        </div>
      </div>

      {/* Feed cards */}
      <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto terminal-feed-scroll">
        {count === 0 ? (
          <div className="text-xs text-mutedtext text-center py-10">No signals detected</div>
        ) : (
          signals.map((s, i) => <FeedCard key={s.id} signal={s} index={i} />)
        )}
      </div>
    </div>
  );
}
