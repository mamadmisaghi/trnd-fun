import React from "react";
import { Link } from "@/lib/navigation";
import { Crown, Trophy, Medal, ArrowUpRight } from "lucide-react";
import { tokens } from "@/data";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const RANK_ICONS = [Crown, Trophy, Medal];

export default function TrendingNow() {
  const list = [...tokens].sort((a, b) => b.marketCapNum - a.marketCapNum).slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-heading font-semibold text-sm text-foreground">Recently launched</span>
        <Link
          to="/explore"
          className="flex items-center gap-1 text-[11px] text-secondarytext hover:text-foreground transition-colors"
        >
          See all <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col">
        {list.map((t, i) => {
          const RankIcon = RANK_ICONS[i];
          return (
            <Link
              key={t.id}
              to={`/token/${t.id}`}
              className="group flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0 hover:bg-elevated/50 transition-colors"
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                {RankIcon ? (
                  <RankIcon size={14} className={cn(i === 0 ? "text-primary" : "text-secondarytext")} />
                ) : (
                  <span className="font-mono-nums text-xs text-mutedtext">{i + 1}</span>
                )}
              </div>
              <div className="w-8 h-8 rounded-md overflow-hidden bg-elevated border border-border shrink-0">
                <Image src={t.image} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-medium text-foreground truncate">{t.name}</span>
                <span className="font-mono-nums text-[11px] text-mutedtext">
                  ${t.ticker} · {t.age} ago
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono-nums tabular text-[13px] text-foreground">{t.marketCap}</span>
                <span className="font-mono-nums text-[10px] text-mutedtext">Vol {t.volume24h}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}