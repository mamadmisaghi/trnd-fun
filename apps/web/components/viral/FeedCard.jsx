import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import PlatformIcon from "@/components/viral/PlatformIcon";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import { StatusBadge } from "@/components/viral/StatusBadge";
import { PLATFORMS } from "@/data";

export default function FeedCard({ signal, index = 0 }) {
  const pair = signal.pairRecommendations?.[0];

  return (
    <Link
      to={`/signal/${signal.id}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/35 hover:bg-elevated/70 transition-colors animate-flare-fade"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 text-xs text-secondarytext">
          <PlatformIcon platform={signal.platform} size={13} className="text-primary" />
          <span>{PLATFORMS[signal.platform]?.name}</span>
          <span className="text-mutedtext truncate">· {signal.age} ago</span>
        </div>
        <StatusBadge status={signal.status} className="shrink-0" />
      </div>

      <div className="p-3.5">
        <div className="flex gap-3.5">
          <div className="w-[86px] h-[86px] shrink-0 rounded-md overflow-hidden bg-elevated border border-border">
            {signal.thumb ? <Image src={signal.thumb} alt="" className="w-full h-full" /> : <div className="w-full h-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-heading font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{signal.title}</div>
            <div className="text-xs text-mutedtext mt-1.5 truncate">{signal.creator}</div>
            <p className="mt-2 text-xs leading-relaxed text-mutedtext line-clamp-2">{signal.narrative}</p>
          </div>
        </div>

        {pair && (
          <div className="mt-3.5 rounded-md border border-border bg-deep p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <PairAssetLogo symbol={pair.symbol} size={34} className="border-primary/25" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono-nums text-sm font-semibold text-foreground">{pair.symbol}</span>
                  <span className="truncate text-xs text-mutedtext">{pair.name}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pair.score}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-nums text-base font-semibold text-primary">{pair.score}%</div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-mutedtext">AI match</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-px bg-border border border-border mt-3.5">
          <Metric label="Viral score" value={signal.viralScore} accent />
          <Metric label="Velocity" value={`+${signal.velocity}%`} />
          <Metric label="Views" value={signal.views} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-mutedtext"><span className="font-mono-nums text-secondarytext">{signal.engagement}</span> engagements</span>
          <span className="inline-flex items-center gap-1 font-semibold text-foreground group-hover:text-primary transition-colors">Open <ArrowUpRight size={12} /></span>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, accent = false }) {
  return (
    <div className="bg-deep px-2.5 py-2.5 min-w-0">
      <div className={`font-mono-nums text-base font-semibold leading-none ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] tracking-[0.08em] uppercase text-mutedtext mt-1.5 truncate">{label}</div>
    </div>
  );
}
