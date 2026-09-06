import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowRight, ArrowUpRight, Crown } from "lucide-react";
import ProjectMetrics from "@/components/viral/ProjectMetrics";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import { LiveDot } from "@/components/viral/StatusBadge";
import Button from "@/components/viral/Button";
import { Image } from "@/components/ui/image";
import { tokens } from "@/data";
import { Magnetic } from "@/components/vengeance/magnetic";

const recentOrder = ["couch", "printer", "chair", "deepscan"];
const recentLaunches = recentOrder
  .map((id) => tokens.find((token) => token.id === id))
  .filter(Boolean);

const stages = ["SCAN", "SCORE", "MATCH", "LAUNCH"];

export default function Hero() {
  return (
    <section className="relative border-b border-border overflow-hidden bg-background">
      <div className="absolute inset-0 hero-terminal-grid" />
      <div className="absolute inset-0 hero-terminal-shade" />

      <div className="relative max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-7 xl:gap-8 items-stretch">
          <div className="min-w-0 flex flex-col">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <LiveDot label="DETECTING" />
              <span className="font-mono text-[11px] text-mutedtext">social intelligence · Robinhood Chain</span>
            </div>

            <h1 className="mt-5 font-heading font-semibold text-foreground leading-[0.97] tracking-[-0.055em] text-[clamp(2.5rem,4.2vw,4.65rem)] max-w-4xl">
              The internet moves first.
              <br />
              <span className="text-primary">ViralTerminal</span> moves with it.
            </h1>

            <p className="mt-4 text-base text-secondarytext max-w-3xl leading-relaxed">
              Detect emerging moments across X, TikTok, Instagram and YouTube. ViralTerminal scores their momentum, explains why they are moving, matches each narrative to the relevant real-world asset, and turns the moment into an onchain market.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <Magnetic className="inline-flex"><Button as={Link} to="/live" size="lg" className="group sm:min-w-52">
                Open Live Analyzer
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </Button></Magnetic>
              <Button as={Link} to="/explore" size="lg" variant="outline" className="sm:min-w-40">
                Explore markets
              </Button>
              <Link to="/create" className="sm:ml-2 inline-flex items-center justify-center gap-1.5 text-sm text-secondarytext hover:text-primary transition-colors py-2">
                Manual launch <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
              {stages.map((stage, index) => (
                <React.Fragment key={stage}>
                  <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.16em] text-secondarytext whitespace-nowrap">{stage}</span>
                  {index < stages.length - 1 && <span className="h-px min-w-5 sm:min-w-9 bg-border-strong" />}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <ProjectMetrics />
            </div>
          </div>

          <RecentlyLaunched />
        </div>
      </div>
    </section>
  );
}

function RecentlyLaunched() {
  return (
    <aside className="border border-border-strong bg-card/95 rounded-lg overflow-hidden min-h-[438px] flex flex-col">
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-flare-pulse" />
            <h2 className="text-sm font-semibold tracking-[-0.02em]">Recently launched</h2>
          </div>
          <p className="text-xs text-mutedtext mt-1">Markets created from live events</p>
        </div>
        <Link to="/explore" className="shrink-0 inline-flex items-center gap-1 text-xs text-secondarytext hover:text-primary transition-colors">
          See all <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1">
        {recentLaunches.map((token, index) => (
          <Link key={token.id} to={`/token/${token.id}`} className="grid grid-cols-[20px_38px_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-3 hover:bg-elevated/70 transition-colors group">
            <div className="flex justify-center">
              {index === 0 ? <Crown size={15} className="text-primary" /> : <span className="font-mono text-xs text-mutedtext">{index + 1}</span>}
            </div>
            <div className="w-9 h-9 rounded-md overflow-hidden bg-elevated border border-border">
              <Image src={token.image} alt="" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{token.name}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-mutedtext min-w-0">
                <PairAssetLogo symbol={token.pairAsset} size={16} className="rounded-full border-0 bg-transparent" />
                <span className="font-mono truncate">${token.ticker}/{token.pairAsset}</span>
                <span>·</span>
                <span className="whitespace-nowrap">{token.age} ago</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono-nums text-[13px] font-semibold">{token.marketCap}</div>
              <div className="text-[10px] text-mutedtext mt-1">Vol {token.volume24h}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border bg-deep/60 flex items-center justify-between text-[10px] tracking-[0.12em] text-mutedtext">
        <span>LIVE MARKET FEED</span>
        <span className="text-primary">ONCHAIN</span>
      </div>
    </aside>
  );
}
