"use client";
import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, BarChart3, CircleDollarSign, PieChart, Trophy } from "lucide-react";
import { portfolio } from "@/data";
import { MetricChange, SectionLabel } from "@/components/viral/ui";
import Button from "@/components/viral/Button";
import LineChart from "@/components/viral/LineChart";
import SafeImage from "@/components/ui/safe-image";

const portfolioSeries = [18, 21, 20, 24, 26, 25, 30, 28, 33, 35, 31, 36, 40, 39, 45, 48, 47, 53, 57, 55, 62];
const holdingMeta = {
  CHAIR: { avg: "$0.0142", pnl: "+$1,822" },
  COUCH: { avg: "$0.0012", pnl: "+$3,755" },
  GLITCH: { avg: "$0.0142", pnl: "+$248" },
  DESK: { avg: "$0.0084", pnl: "+$540" },
};

export default function Portfolio() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight mb-6">Portfolio</h1>

      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono-nums text-xs text-mutedtext">{portfolio.wallet}</span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <SectionLabel className="block">Total Value</SectionLabel>
            <div className="font-mono-nums text-4xl font-semibold text-foreground mt-1">{portfolio.totalValue}</div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <SectionLabel className="block">24H Change</SectionLabel>
              <MetricChange value={portfolio.change24h} className="text-lg mt-1" />
            </div>
            <Button as={Link} to="/explore" variant="outline">Explore markets <ArrowUpRight size={14} /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={BarChart3} label="Unrealized P&L" value="+$11,892" note="+32.8%" />
        <KpiCard icon={PieChart} label="Active positions" value="4" note="Across 4 markets" />
        <KpiCard icon={CircleDollarSign} label="Total fees earned" value="$1,243" note="+18.6%" />
        <KpiCard icon={Trophy} label="Best performer" value="$COUCH" note="+312.5%" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_280px_340px] gap-4 items-stretch">
        {/* Holdings */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><SectionLabel>Holdings</SectionLabel></div>
          <div className="hidden md:grid grid-cols-[minmax(210px,1.4fr)_100px_90px_105px_105px] gap-3 px-4 py-2.5 border-b border-border bg-deep/45 text-[9px] uppercase tracking-[0.1em] text-mutedtext"><span>Token / Project</span><span>Tokens</span><span>Avg cost</span><span>Current value</span><span>P&L</span></div>
          {portfolio.holdings.map((h) => (
            <Link key={h.ticker} to={`/token/${h.ticker.toLowerCase()}`} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(210px,1.4fr)_100px_90px_105px_105px] items-center gap-3 px-4 py-4 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0"><SafeImage src={h.image} alt="" className="w-10 h-10 rounded-md shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-heading font-semibold text-foreground">${h.ticker}</span>
                  <span className="text-xs text-mutedtext truncate">{h.name}</span>
                </div>
                <span className="font-mono-nums text-[11px] text-mutedtext">{h.amount} tokens</span>
              </div></div>
              <ArrowUpRight size={14} className="md:hidden text-mutedtext" />
              <span className="hidden md:block font-mono-nums text-xs">{h.amount}</span><span className="hidden md:block font-mono-nums text-xs">{holdingMeta[h.ticker].avg}</span><span className="hidden md:block font-mono-nums text-xs">{h.value}</span><span className="hidden md:block"><MetricChange value={h.change} className="text-xs" /><span className="block text-[10px] font-mono text-primary mt-1">{holdingMeta[h.ticker].pnl}</span></span>
            </Link>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
            <div className="px-4 py-3 border-b border-border"><SectionLabel>Recent Launches</SectionLabel></div>
            {portfolio.recentLaunches.map((l) => (
              <div key={l.ticker} className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0">
                <div>
                  <span className="text-sm text-foreground font-medium">${l.ticker}</span>
                  <span className="text-xs text-mutedtext ml-2">{l.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-primary font-medium block">{l.status}</span>
                  <span className="font-mono-nums text-[10px] text-mutedtext">{l.time}</span>
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-4"><div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between"><SectionLabel>Portfolio performance</SectionLabel><span className="text-[9px] text-mutedtext">ALL TIME</span></div><div className="font-mono-nums text-3xl text-primary font-semibold mt-4">+32.8%</div><div className="font-mono-nums text-sm text-primary mt-1">+$11,892</div><div className="mt-4"><LineChart data={portfolioSeries} height={150} color="#9CFF2E" /></div></div><div className="bg-card border border-border rounded-lg p-4"><SectionLabel>Portfolio allocation</SectionLabel><div className="flex items-center gap-5 mt-5"><div className="w-28 h-28 rounded-full flex items-center justify-center shrink-0" style={{ background: "conic-gradient(#9CFF2E 0 51%, #2878ff 51% 83%, #965cff 83% 95%, #aaa 95% 100%)" }}><div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-xs font-mono">$48.2K</div></div><div className="space-y-2 text-xs flex-1"><Allocation color="#9CFF2E" label="$COUCH" value="51.2%" /><Allocation color="#2878ff" label="$CHAIR" value="32.1%" /><Allocation color="#965cff" label="$DESK" value="12.4%" /><Allocation color="#aaa" label="$GLITCH" value="4.3%" /></div></div></div></div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, note }) { return <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-mutedtext"><Icon size={16} className="text-primary" />{label}</div><div className="font-mono-nums text-xl font-semibold mt-3">{value}</div><div className="text-xs text-primary mt-1">{note}</div></div>; }
function Allocation({ color, label, value }) { return <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color }} /><span>{label}</span><span className="ml-auto font-mono">{value}</span></div>; }
