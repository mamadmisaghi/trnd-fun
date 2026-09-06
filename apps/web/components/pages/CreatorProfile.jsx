"use client";
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  DollarSign,
  Gift,
  Rocket,
  Search,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Button from "@/components/viral/Button";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import SafeImage from "@/components/ui/safe-image";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { cn } from "@/lib/utils";
import { creatorPerformance, getCreator, PLATFORMS, signals, tokens } from "@/data";

const TABS = ["tokens", "signals", "media", "performance"];
const PAIR_MATCHES = [
  { symbol: "COST", score: 94 },
  { symbol: "NVDA", score: 91 },
  { symbol: "AMZN", score: 88 },
  { symbol: "AAPL", score: 85 },
  { symbol: "TSLA", score: 81 },
];

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const creator = getCreator(id);
  const [tab, setTab] = useState("tokens");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [claimState, setClaimState] = useState("idle");

  const performance = creator ? creatorPerformance[creator.id] : null;
  const creatorSignals = creator ? signals.filter((signal) => signal.creator === creator.handle) : [];
  const creatorTokens = useMemo(() => {
    const result = [...tokens].slice(0, 5).filter((token) => `${token.name} ${token.ticker} ${token.pairAsset}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === "volume") return result.sort((a, b) => metricNumber(b.volume24h) - metricNumber(a.volume24h));
    if (sort === "mcap") return result.sort((a, b) => b.marketCapNum - a.marketCapNum);
    return result;
  }, [query, sort]);

  if (!creator || !performance) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <p className="text-secondarytext">Creator not found.</p>
        <Button as={Link} to="/creators" variant="outline" className="mt-4">Back to Creators</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-mutedtext hover:text-foreground transition-colors"><ArrowLeft size={15} /> Back to Creators</button>

        <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
          <SafeImage src={creator.avatar} alt="" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-border-strong shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.045em]">{creator.name}</h1>
              {creator.verified && <BadgeCheck size={22} className="text-primary" />}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-secondarytext"><PlatformIcon platform={creator.platform} size={15} /><span>{creator.handle}</span><span className="text-mutedtext">·</span><span className="text-mutedtext">{PLATFORMS[creator.platform].name}</span></div>
            <p className="mt-4 text-base text-secondarytext max-w-2xl leading-relaxed">{creator.bio}</p>
          </div>
          <div className="lg:w-72 shrink-0">
            <div className="h-9 px-3 border border-border rounded-full flex items-center justify-between text-[11px]"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" />Creator wallet connected</span><span className="font-mono text-mutedtext">0x7a3f…c821</span></div>
            <Button onClick={() => { setClaimState("claiming"); window.setTimeout(() => setClaimState("claimed"), 900); }} disabled={claimState !== "idle"} size="lg" className="w-full mt-2"><Gift size={17} />{claimState === "claiming" ? "Claiming…" : claimState === "claimed" ? "Claimed" : "Claim"}</Button>
            <div className="mt-3 text-sm text-secondarytext">Unclaimed fees</div><div className="font-mono-nums text-xl font-semibold mt-1">{claimState === "claimed" ? "$0 available" : "$18,420 available"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-8">
          <ProfileStat icon={Rocket} label="Total launches" value={performance.launches} note="All time" />
          <ProfileStat icon={BarChart3} label="Total volume" value={creator.totalVolume} note="All markets" />
          <ProfileStat icon={DollarSign} label="Creator fees earned" value={performance.totalFees} note="Available + claimed" accent />
          <ProfileStat icon={Target} label="Market value" value={creator.marketCap} note="Across all markets" />
          <ProfileStat icon={Users} label="Followers" value={creator.followers} note="Across platforms" />
          <ProfileStat icon={Trophy} label="Best rank" value={performance.bestRank} note={`Current #${performance.rank}`} />
        </div>

        <div className="mt-8 flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
          {TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={cn("px-4 py-3 text-sm capitalize border-b-2 -mb-px transition-colors whitespace-nowrap", tab === item ? "text-primary border-primary" : "text-mutedtext border-transparent hover:text-foreground")}>{item}</button>)}
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
          <main className="min-w-0">
            {tab === "tokens" && <MarketsPanel tokens={creatorTokens} query={query} setQuery={setQuery} sort={sort} setSort={setSort} />}
            {tab === "signals" && <SignalsPanel signals={creatorSignals} />}
            {tab === "media" && <MediaPanel creator={creator} />}
            {tab === "performance" && <PerformanceBreakdown performance={performance} />}
          </main>
          <PerformancePanel performance={performance} />
        </div>
      </section>
    </div>
  );
}

function metricNumber(value) {
  const match = String(value || "").replace(/[$,]/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  if (!match) return 0;
  const unit = match[2]?.toUpperCase();
  return Number(match[1]) * (unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1);
}

function ProfileStat({ icon: Icon, label, value, note, accent = false }) {
  return (
    <div className="min-h-28 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.11em] text-mutedtext"><Icon size={16} className="text-primary" /><span>{label}</span></div>
      <div className={cn("mt-3 font-mono-nums text-xl sm:text-2xl font-semibold", accent ? "text-primary" : "text-foreground")}>{value}</div>
      <div className="mt-1 text-xs text-mutedtext">{note}</div>
    </div>
  );
}

function MarketsPanel({ tokens: marketTokens, query, setQuery, sort, setSort }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Launched Markets</h2><p className="mt-1 text-xs text-mutedtext">Markets attributed to this creator profile</p></div>
        <div className="flex gap-2">
          <label className="h-9 flex-1 md:w-52 border border-border bg-deep rounded-sm flex items-center gap-2 px-3"><Search size={14} className="text-mutedtext" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tokens" className="w-full bg-transparent outline-none text-xs placeholder:text-mutedtext" /></label>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 border border-border bg-deep rounded-sm px-3 text-xs text-secondarytext outline-none"><option value="newest">Newest</option><option value="volume">Volume</option><option value="mcap">Market cap</option></select>
        </div>
      </div>
      <div className="hidden md:grid grid-cols-[minmax(220px,1.5fr)_0.8fr_0.8fr_0.65fr_0.65fr] gap-4 px-4 py-2.5 bg-deep/50 border-b border-border text-[10px] uppercase tracking-[0.12em] text-mutedtext"><span>Market</span><span>Volume</span><span>Market cap</span><span>Holders</span><span>Launched</span></div>
      {marketTokens.map((token, index) => (
        <Link key={token.id} to={`/token/${token.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(220px,1.5fr)_0.8fr_0.8fr_0.65fr_0.65fr] items-center gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-elevated/65 transition-colors">
          <div className="flex items-center gap-3 min-w-0"><SafeImage src={token.image} alt="" className="w-11 h-11 rounded-full border border-border-strong shrink-0" /><div className="min-w-0"><div className="font-semibold truncate group-hover:text-primary">{token.name}</div><div className="mt-0.5 flex items-center gap-1.5 text-xs text-mutedtext"><span className="font-mono">${token.ticker}</span><span>·</span><PairAssetLogo symbol={token.pairAsset} size={16} className="rounded-full border-0" /><span>{token.pairAsset}</span></div></div></div>
          <ArrowUpRight size={15} className="md:hidden text-mutedtext" />
          <MarketMetric value={token.volume24h} /><MarketMetric value={token.marketCap} /><MarketMetric value={token.holders.toLocaleString()} /><MarketMetric value={index === 0 ? "2d ago" : token.age + " ago"} />
        </Link>
      ))}
      {!marketTokens.length && <div className="py-20 text-center text-sm text-mutedtext">No markets match this search.</div>}
      <div className="px-4 py-3 border-t border-border bg-deep/45 flex items-center justify-between text-xs text-mutedtext"><span>Showing {marketTokens.length} markets</span><span className="font-mono-nums text-primary">LIVE DATA</span></div>
    </div>
  );
}

function MarketMetric({ value }) {
  return <span className="hidden md:block font-mono-nums text-sm text-foreground">{value}</span>;
}

function SignalsPanel({ signals: creatorSignals }) {
  if (!creatorSignals.length) return <EmptyPanel text="No Viral Events detected for this creator yet." />;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{creatorSignals.map((signal) => <Link key={signal.id} to={`/signal/${signal.id}`} className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/35"><SafeImage src={signal.thumb} alt="" className="block w-full aspect-video" /><div className="p-4"><div className="flex items-center gap-2 text-xs text-mutedtext"><PlatformIcon platform={signal.platform} size={12} /><span>{signal.age} ago</span></div><h3 className="mt-2 font-semibold group-hover:text-primary">{signal.title}</h3><div className="mt-3 font-mono-nums text-primary">VIRAL SCORE {signal.viralScore}</div></div></Link>)}</div>;
}

function MediaPanel({ creator }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="aspect-square rounded-lg overflow-hidden bg-card border border-border"><SafeImage src={creator.avatar} alt="" className="w-full h-full" imageClassName="opacity-70" /></div>)}</div>;
}

function PerformanceBreakdown({ performance }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Creator economics</h2>
      <p className="mt-2 text-sm text-secondarytext leading-relaxed max-w-2xl">Every attributed market routes half of the creator-fee revenue to this creator. Rankings are based on verified volume, market quality and sustained engagement—not raw launch count alone.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3"><EconomyRow label="Creator share" value="50%" /><EconomyRow label="VIRAL buyback & burn" value="20%" /><EconomyRow label="Top 5 reward pool" value="20%" /><EconomyRow label="Infrastructure" value="10%" /></div>
      <div className="mt-6 border-t border-border pt-5 flex items-center justify-between"><span className="text-sm text-mutedtext">Current estimated reward</span><span className="font-mono-nums text-2xl text-primary">{performance.estimatedReward}</span></div>
    </div>
  );
}

function EconomyRow({ label, value }) {
  return <div className="rounded-md border border-border bg-deep p-4 flex items-center justify-between"><span className="text-sm text-secondarytext">{label}</span><span className="font-mono-nums text-lg text-primary">{value}</span></div>;
}

function PerformancePanel({ performance }) {
  return (
    <aside className="xl:sticky xl:top-24 rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2"><Trophy size={17} className="text-primary" /><h2 className="text-lg font-semibold">Performance</h2><span className="ml-auto rounded-full bg-elevated px-2 py-1 text-[10px] text-mutedtext">ALL TIME</span></div>
      <div className="p-4 grid grid-cols-2 gap-2">
        <PanelMetric label="24H volume" value={performance.volume24h} change="↑ 18.6%" />
        <PanelMetric label="Total fees generated" value={performance.totalFees} change="↑ 21.3%" />
        <PanelMetric label="Avg Viral Score" value={performance.avgScore} change="↑ 6.7" />
        <PanelMetric label="Avg Holders / Market" value="2,840" change="↑ 12.4%" />
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Top Pair Matches</h3><span className="text-xs text-mutedtext">All markets</span></div>
        <div className="mt-4 space-y-3.5">
          {PAIR_MATCHES.map((pair) => <div key={pair.symbol} className="grid grid-cols-[26px_1fr_92px_38px] items-center gap-2"><PairAssetLogo symbol={pair.symbol} size={24} className="rounded-full" /><span className="font-mono text-xs">{pair.symbol}</span><div className="h-px bg-border"><div className="h-px bg-primary" style={{ width: `${pair.score}%` }} /></div><span className="font-mono-nums text-sm text-primary text-right">{pair.score}%</span></div>)}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-border bg-deep/55 flex items-center justify-between text-xs text-mutedtext"><span className="flex items-center gap-1.5"><Clock3 size={12} /> Updates every 15 minutes</span><span className="font-mono-nums text-primary">#{performance.rank}</span></div>
    </aside>
  );
}

function PanelMetric({ label, value, change, negative = false }) {
  return <div className="rounded-md bg-elevated p-3"><span className="block text-[10px] uppercase tracking-[0.1em] text-mutedtext">{label}</span><div className="mt-2 flex items-end justify-between gap-2"><span className="font-mono-nums text-lg font-semibold">{value}</span><span className={cn("text-[10px] font-mono-nums", negative ? "text-destructive" : "text-primary")}>{change}</span></div></div>;
}

function EmptyPanel({ text }) {
  return <div className="rounded-lg border border-border bg-card py-24 text-center text-sm text-mutedtext">{text}</div>;
}
