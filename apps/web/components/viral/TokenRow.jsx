import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, Globe2 } from "lucide-react";
import PlatformIcon from "@/components/viral/PlatformIcon";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import Sparkline from "@/components/viral/Sparkline";
import SafeImage from "@/components/ui/safe-image";
import { pairAssets } from "@/data";

// Compact token row for Explore / lists.
export default function TokenRow({ token, index = 0 }) {
  const positive = token.change24h >= 0;
  const pairSymbol = token.pairAsset || "ETH";
  const pair = pairAssets.find((asset) => asset.symbol === pairSymbol);
  return (
    <Link
      to={token.href || `/token/${token.id}`}
      className="group market-token-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors animate-flare-fade"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <span className="hidden xl:block font-mono-nums text-xs text-mutedtext">{index + 1}</span>
      <div className="flex items-center gap-3 min-w-0">
        <SafeImage src={token.image} alt="" className="w-9 h-9 rounded-md shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-heading font-semibold text-foreground truncate">{token.name}</span>
            <span className="font-mono-nums text-xs text-mutedtext">${token.ticker}</span>
          </div>
          <div className="text-[10px] text-mutedtext mt-0.5 truncate">{token.fromSignal ? `Event ${token.launchId || token.signalId}` : `${token.category} project`}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <PairAssetLogo symbol={pairSymbol} size={28} />
        <span className="min-w-0"><span className="font-mono text-sm text-primary block">{pairSymbol}</span><span className="text-[10px] text-mutedtext truncate block">{pair?.name}</span></span>
      </div>
      <div className={`hidden xl:inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-[9px] font-semibold tracking-[0.08em] ${token.fromSignal ? "border-primary/30 bg-primary/[0.04] text-primary" : "border-border-strong text-secondarytext"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${token.fromSignal ? "bg-primary" : "border border-secondarytext"}`} />{token.fromSignal ? "VIRAL ORIGIN" : "MANUAL LAUNCH"}
      </div>
      <div className="hidden xl:block font-mono-nums text-sm text-foreground tabular">{token.marketCap}</div>
      <div className="hidden xl:block font-mono-nums text-sm text-secondarytext tabular">{token.volume24h}</div>
      <div className={`hidden xl:block font-mono-nums text-sm tabular font-medium ${positive ? "text-primary" : "text-destructive"}`}>
        {positive ? "+" : ""}{token.change24h}%
      </div>
      <div className="hidden xl:block font-mono-nums text-xs text-secondarytext">{token.holders >= 1000 ? `${(token.holders / 1000).toFixed(1)}K` : token.holders}</div>
      <div className="hidden xl:flex items-center gap-2.5 text-mutedtext">
        {token.fromSignal ? (
          <PlatformIcon platform={token.signalPlatform || "x"} size={16} title={token.signalPlatform || "Source platform"} className="transition-colors group-hover:text-foreground" />
        ) : (
          <>
            <Globe2 size={15} aria-label="Website" className="transition-colors group-hover:text-foreground" />
            <PlatformIcon platform="x" size={14} title="X" className="transition-colors group-hover:text-foreground" />
            <PlatformIcon platform="telegram" size={15} title="Telegram" className="transition-colors group-hover:text-foreground" />
          </>
        )}
      </div>
      <div className="hidden xl:block">
        <Sparkline data={token.sparkline} width={100} height={28} color={positive ? "#A8FF00" : "#FF4D4D"} />
      </div>
      <ArrowUpRight size={15} className="hidden xl:block text-mutedtext group-hover:text-primary transition-colors justify-self-end" />
    </Link>
  );
}
