"use client";
import React, { useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, BarChart3, Clock3, DollarSign, Gift, Info, Trophy, Users } from "lucide-react";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { FilterChip } from "@/components/viral/ui";
import { cn } from "@/lib/utils";
import { creatorPerformance, creatorProgram, creators } from "@/data";

const FILTERS = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "launched", label: "Most Launched" },
  { key: "volume", label: "Highest Volume" },
  { key: "earners", label: "Top Earners" },
  { key: "leaderboard", label: "Leaderboard" },
];
const RANGES = ["24H", "7D", "30D", "All Time"];

function metricNumber(value) {
  const match = String(value || "").replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  if (!match) return 0;
  const unit = match[2]?.toUpperCase();
  return Number(match[1]) * (unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1);
}

export default function Creators() {
  const [filter, setFilter] = useState("trending");
  const [range, setRange] = useState("24H");

  const list = useMemo(() => [...creators].sort((a, b) => {
    const aPerf = creatorPerformance[a.id];
    const bPerf = creatorPerformance[b.id];
    if (filter === "volume") return metricNumber(b.totalVolume) - metricNumber(a.totalVolume);
    if (filter === "launched") return bPerf.launches - aPerf.launches;
    if (filter === "earners") return metricNumber(bPerf.feesEarned) - metricNumber(aPerf.feesEarned);
    if (filter === "new") return aPerf.rank - bPerf.rank;
    return aPerf.rank - bPerf.rank;
  }), [filter]);

  const topFive = [...creators].sort((a, b) => creatorPerformance[a.id].rank - creatorPerformance[b.id].rank).slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-[0.14em] uppercase"><Users size={14} /> Creator network</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.045em]">Creators</h1>
          <p className="text-sm sm:text-base text-secondarytext max-w-2xl leading-relaxed">Discover the creators turning cultural momentum into markets—and follow the fees, volume and rewards they generate.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-7">
          <SummaryMetric icon={DollarSign} label="24H creator payouts" value={creatorProgram.payout24h} note="↑ 14.2% vs yesterday" accent />
          <SummaryMetric icon={Gift} label="Top 5 reward pool" value={creatorProgram.rewardPool} note="Resets in 10h 24m" accent />
          <SummaryMetric icon={BarChart3} label="Total creator volume" value={creatorProgram.creatorVolume} note="↑ 21.6% vs 7d" />
          <SummaryMetric icon={Users} label="Active creators" value={creatorProgram.activeCreators} note="↑ 8.7% vs 7d" />
        </div>

        <div className="mt-4 overflow-x-auto no-scrollbar">
          <div className="min-w-max border border-border bg-card rounded-md px-4 py-3 flex items-center gap-4 text-sm">
            <span className="font-mono-nums text-primary font-semibold">{creatorProgram.tradeFee}% TRADE FEE</span>
            <FeeStep value={`${creatorProgram.creatorShare}%`} label="Creator" />
            <FeeStep value={`${creatorProgram.viralBurnShare}%`} label="VIRAL buyback & burn" />
            <FeeStep value={`${creatorProgram.rewardPoolShare}%`} label="Top 5 reward pool" />
            <FeeStep value={`${creatorProgram.infrastructureShare}%`} label="API & infrastructure" />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((item) => <FilterChip key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</FilterChip>)}
          </div>
          <div className="flex items-center rounded-md border border-border bg-card p-1 overflow-x-auto no-scrollbar">
            {RANGES.map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={cn("h-8 px-4 rounded-sm text-xs whitespace-nowrap transition-colors", range === item ? "bg-elevated text-primary" : "text-mutedtext hover:text-foreground")}>{item}</button>)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
          <div className="border border-border bg-card rounded-lg overflow-hidden">
            <div className="hidden lg:grid grid-cols-[44px_minmax(220px,1.7fr)_0.7fr_0.85fr_0.65fr_0.8fr_0.9fr_68px] gap-4 px-4 py-3 border-b border-border bg-deep/60 text-[10px] font-semibold uppercase tracking-[0.13em] text-mutedtext">
              <span>#</span><span>Creator</span><span>Followers</span><span>30D reach</span><span>Launches</span><span>Volume</span><span>Fees earned</span><span className="text-center">Rank</span>
            </div>
            {list.map((creator, index) => <CreatorLeaderboardRow key={creator.id} creator={creator} index={index} />)}
            <div className="px-4 py-3 border-t border-border bg-deep/45 flex items-center justify-between gap-4 text-xs text-mutedtext">
              <span>Showing 1 to {list.length} of {creatorProgram.activeCreators} creators</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => <button key={page} type="button" className={cn("h-8 min-w-8 px-2 rounded-sm border", page === 1 ? "border-primary text-primary bg-primary/[0.04]" : "border-border text-mutedtext hover:text-foreground")}>{page}</button>)}
                <span className="px-2">…</span><button type="button" className="h-8 min-w-8 px-2 rounded-sm border border-border text-mutedtext hover:text-foreground">52</button>
              </div>
            </div>
          </div>
          <TopFivePanel creators={topFive} />
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ icon: Icon, label, value, note, accent = false }) {
  return (
    <div className="min-h-28 rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-md border border-primary/15 bg-primary/[0.055] flex items-center justify-center shrink-0"><Icon size={20} className="text-primary" /></div>
      <div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-mutedtext truncate">{label}</div><div className={cn("mt-1 font-mono-nums text-2xl font-semibold", accent ? "text-primary" : "text-foreground")}>{value}</div><div className="mt-1 text-xs text-mutedtext">{note}</div></div>
    </div>
  );
}

function FeeStep({ value, label }) {
  return <span className="inline-flex items-center gap-2 whitespace-nowrap before:w-4 before:h-px before:bg-border-strong"><strong className="font-mono-nums text-foreground">{value}</strong><span className="text-mutedtext">{label}</span></span>;
}

function CreatorLeaderboardRow({ creator, index }) {
  const performance = creatorPerformance[creator.id];
  return (
    <Link to={`/creator/${creator.id}`} className="group grid grid-cols-[32px_minmax(0,1fr)_auto] lg:grid-cols-[44px_minmax(220px,1.7fr)_0.7fr_0.85fr_0.65fr_0.8fr_0.9fr_68px] items-center gap-3 lg:gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-elevated/65 transition-colors animate-flare-fade" style={{ animationDelay: `${index * 35}ms` }}>
      <span className="font-mono-nums text-sm text-secondarytext">{performance.rank}</span>
      <div className="flex items-center gap-3 min-w-0">
        <img src={creator.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border-strong shrink-0" />
        <div className="min-w-0"><div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{creator.name}</span>{creator.verified && <span className="text-primary text-xs">✓</span>}</div><div className="mt-0.5 flex items-center gap-1.5 text-xs text-mutedtext"><span className="truncate">{creator.handle}</span><PlatformIcon platform={creator.platform} size={12} /></div></div>
      </div>
      <span className="lg:hidden rounded-md border border-primary/30 px-2 py-1 font-mono-nums text-xs text-primary">#{performance.rank}</span>
      <TableMetric value={creator.followers} /><TableMetric value={creator.reach30d} /><TableMetric value={performance.launches} /><TableMetric value={creator.totalVolume} accent /><TableMetric value={performance.feesEarned} accent />
      <div className={cn("hidden lg:flex h-8 items-center justify-center rounded-md border font-mono-nums text-sm", performance.rank === 1 ? "border-primary/70 text-primary" : "border-border-strong text-foreground")}>#{performance.rank}</div>
    </Link>
  );
}

function TableMetric({ value, accent = false }) {
  return <span className={cn("hidden lg:block font-mono-nums text-sm", accent ? "text-primary" : "text-foreground")}>{value}</span>;
}

function TopFivePanel({ creators: rankedCreators }) {
  return (
    <aside className="xl:sticky xl:top-24 rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Trophy size={17} className="text-primary" /><h2 className="font-semibold text-lg">Top 5 Today</h2><Info size={13} className="text-mutedtext" /></div><span className="text-xs text-primary">Reward leaderboard</span>
      </div>
      <div className="divide-y divide-border">
        {rankedCreators.map((creator) => {
          const performance = creatorPerformance[creator.id];
          return (
            <Link key={creator.id} to={`/creator/${creator.id}`} className="grid grid-cols-[28px_42px_minmax(0,1fr)] gap-3 px-5 py-4 hover:bg-elevated/60 transition-colors group">
              <span className={cn("mt-2 h-6 w-6 rounded-full flex items-center justify-center font-mono-nums text-xs", performance.rank === 1 ? "bg-primary text-primary-foreground" : "bg-elevated text-secondarytext")}>{performance.rank}</span>
              <img src={creator.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border-strong" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-sm font-semibold truncate group-hover:text-primary">{creator.name}</span>{creator.verified && <span className="text-primary text-xs">✓</span>}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-mutedtext"><span className="truncate">{creator.handle}</span><PlatformIcon platform={creator.platform} size={11} /></div>
                <div className="mt-3 grid grid-cols-2 gap-3"><div><span className="block text-[10px] uppercase tracking-[0.1em] text-mutedtext">Volume (24H)</span><span className="mt-1 block font-mono-nums text-sm">{performance.volume24h}</span></div><div className="text-right"><span className="block text-[10px] uppercase tracking-[0.1em] text-mutedtext">Est. reward</span><span className="mt-1 block font-mono-nums text-sm text-primary">{performance.estimatedReward}</span></div></div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="px-5 py-4 border-t border-border bg-deep/60 flex items-center justify-between text-sm">
        <div><span className="block text-xs text-mutedtext">Top 5 Reward Pool</span><span className="font-mono-nums text-primary">{creatorProgram.rewardPool}</span></div>
        <div className="text-right"><span className="flex items-center justify-end gap-1 text-xs text-mutedtext"><Clock3 size={12} /> Resets in</span><span className="font-mono-nums text-foreground">10h 24m 31s</span></div>
      </div>
      <Link to="/creators" className="h-11 border-t border-border flex items-center justify-center gap-2 text-sm text-secondarytext hover:text-primary">View leaderboard <ArrowUpRight size={14} /></Link>
    </aside>
  );
}
