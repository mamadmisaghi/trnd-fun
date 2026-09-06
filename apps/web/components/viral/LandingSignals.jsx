import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { ArrowRight, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { LiveDot, StatusBadge } from "@/components/viral/StatusBadge";
import { cn } from "@/lib/utils";
import { PLATFORMS, signals } from "@/data";
import { getLaunchStates, subscribeLaunchState } from "@/lib/launchState";

const PLATFORM_FILTERS = ["all", "x", "tiktok", "instagram", "youtube"];
const STATUS_FILTERS = ["ALL", "HEATING", "BREAKING", "VIRAL", "LAUNCHED"];
const SORT_OPTIONS = [
  { key: "latest", label: "Latest" },
  { key: "score", label: "Viral Score" },
  { key: "velocity", label: "Velocity" },
  { key: "reach", label: "Reach" },
];

function parseMetric(value) {
  if (typeof value === "number") return value;
  const match = String(value || "").match(/([\d.]+)\s*([KM]?)/i);
  if (!match) return 0;
  const number = Number(match[1]);
  const unit = match[2]?.toUpperCase();
  return number * (unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1);
}

export default function LandingSignals() {
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("latest");
  const [query, setQuery] = useState("");
  const [feed, setFeed] = useState(signals);
  const [runtime, setRuntime] = useState(getLaunchStates);
  const [newFlash, setNewFlash] = useState(true);

  useEffect(() => subscribeLaunchState(() => setRuntime(getLaunchStates())), []);

  useEffect(() => {
    const metrics = window.setInterval(() => {
      setFeed((current) => current.map((event, index) => ({
        ...event,
        viralScore: Math.min(99.9, Number((event.viralScore + (index % 4 === 0 ? 0.1 : 0)).toFixed(1))),
        velocity: event.velocity + (index % 3 === 0 ? 2 : 0),
      })));
    }, 4800);
    const flash = window.setInterval(() => {
      setNewFlash(true);
      window.setTimeout(() => setNewFlash(false), 1900);
    }, 12000);
    const initial = window.setTimeout(() => setNewFlash(false), 2400);

    return () => {
      window.clearInterval(metrics);
      window.clearInterval(flash);
      window.clearTimeout(initial);
    };
  }, []);

  const events = useMemo(() => feed.map((event) => {
    const launch = runtime[String(event.id)];
    if (launch?.status === "LAUNCHED") {
      return { ...event, launched: true, status: "LAUNCHED", tokenId: launch.tokenId };
    }
    if (launch?.status === "RESERVED") return { ...event, status: "RESERVED" };
    return event;
  }), [feed, runtime]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events
      .filter((event) => {
        if (platform !== "all" && event.platform !== platform) return false;
        if (status !== "ALL" && event.status !== status) return false;
        if (!term) return true;
        const pairs = event.pairRecommendations.map((pair) => `${pair.symbol} ${pair.name}`).join(" ");
        return `${event.title} ${event.narrative} ${event.creator} ${pairs}`.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        if (sort === "score") return b.viralScore - a.viralScore;
        if (sort === "velocity") return b.velocity - a.velocity;
        if (sort === "reach") return parseMetric(b.views) - parseMetric(a.views);
        return a.ageMin - b.ageMin;
      });
  }, [events, platform, query, sort, status]);

  return (
    <section className="border-y border-border bg-background terminal-grid">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <LiveDot label="LIVE SIGNALS" />
              <span className="font-mono-nums text-[10px] tracking-[0.12em] text-mutedtext">4 SOURCES · CONTINUOUS SCAN</span>
            </div>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              See the signal before it becomes the market.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondarytext sm:text-base">
              Filter live cultural events, compare momentum and open the intelligence behind every AI-matched market.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <div className="font-mono-nums text-2xl text-foreground">{filtered.length}</div>
              <div className="text-[9px] uppercase tracking-[0.15em] text-mutedtext">Signals in view</div>
            </div>
            <Link to="/live" className="inline-flex h-10 items-center gap-2 rounded-sm border border-border-strong bg-deep px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/45 hover:text-primary">
              Open full analyzer <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card/75">
          <div className="flex flex-col gap-3 border-b border-border p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              <FilterLabel>Platform</FilterLabel>
              {PLATFORM_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={platform === item}
                  onClick={() => setPlatform(item)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-xs transition-colors",
                    platform === item ? "bg-primary text-primary-foreground" : "text-secondarytext hover:bg-elevated hover:text-foreground"
                  )}
                >
                  {item === "all" ? <SlidersHorizontal size={13} /> : <PlatformIcon platform={item} size={13} />}
                  {item === "all" ? "All" : PLATFORMS[item].name}
                </button>
              ))}
              <span className="mx-2 hidden h-5 w-px shrink-0 bg-border xl:block" />
              <FilterLabel className="hidden xl:block">Status</FilterLabel>
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={status === item}
                  onClick={() => setStatus(item)}
                  className={cn(
                    "hidden h-8 shrink-0 items-center rounded-sm px-2.5 text-[11px] font-semibold tracking-[0.08em] transition-colors xl:inline-flex",
                    status === item ? "bg-elevated text-primary" : "text-mutedtext hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="flex h-9 w-full items-center gap-2 rounded-sm border border-border bg-deep px-3 focus-within:border-primary/55 xl:w-72">
              <Search size={14} className="shrink-0 text-mutedtext" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter signals, accounts, pairs"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-mutedtext"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-3 py-2.5 no-scrollbar">
            <FilterLabel>Sort</FilterLabel>
            {SORT_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={sort === item.key}
                onClick={() => setSort(item.key)}
                className={cn(
                  "h-7 shrink-0 rounded-sm px-2.5 text-[11px] transition-colors",
                  sort === item.key ? "bg-elevated text-foreground" : "text-mutedtext hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-border" />
            <div className="flex gap-1.5 xl:hidden">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={status === item}
                  onClick={() => setStatus(item)}
                  className={cn("h-7 shrink-0 rounded-sm px-2.5 text-[10px] font-semibold tracking-wide", status === item ? "bg-primary text-primary-foreground" : "text-mutedtext")}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(
          "mt-5 flex min-h-9 items-center gap-2 border px-3 py-2 transition-colors",
          newFlash ? "border-primary/35 bg-primary/[0.055]" : "border-border bg-deep/75"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", newFlash ? "bg-primary animate-flare-pulse" : "bg-mutedtext")} />
          <span className={cn("text-[10px] font-semibold tracking-[0.12em]", newFlash ? "text-primary" : "text-secondarytext")}>NEW SIGNAL DETECTED</span>
          <span className="text-xs text-mutedtext">— feed updated from the social scanner</span>
        </div>

        {filtered.length ? (
          <div className="mt-4 max-h-[1180px] overflow-y-auto pr-1 terminal-feed-scroll">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((signal, index) => <LandingSignalCard key={signal.id} signal={signal} index={index} />)}
            </div>
          </div>
        ) : (
          <div className="mt-4 border border-border bg-card px-5 py-20 text-center">
            <div className="text-sm font-semibold text-foreground">No signals match this view.</div>
            <button type="button" onClick={() => { setPlatform("all"); setStatus("ALL"); setQuery(""); }} className="mt-3 text-xs text-primary hover:underline">Reset filters</button>
          </div>
        )}
      </div>
    </section>
  );
}

function LandingSignalCard({ signal, index }) {
  const pair = signal.pairRecommendations?.[0];
  const launched = signal.launched || signal.status === "LAUNCHED";
  const destination = launched && signal.tokenId ? `/token/${signal.tokenId}` : `/signal/${signal.id}`;

  return (
    <Link
      to={destination}
      className="group flex min-h-[500px] flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/35 hover:bg-elevated/90 animate-flare-fade"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative aspect-[16/8.8] overflow-hidden border-b border-border bg-deep">
        <img src={signal.thumb} alt={signal.title} loading="lazy" className="h-full w-full object-cover grayscale-[10%] transition duration-500 group-hover:scale-[1.025] group-hover:grayscale-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-background/15" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-background/80 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
          <PlatformIcon platform={signal.platform} size={12} className="text-primary" />
          {PLATFORMS[signal.platform]?.name} · {signal.creator}
        </div>
        <StatusBadge status={signal.status} className="absolute right-3 top-3 bg-background/85 backdrop-blur-sm" />
        {signal.sourceBadge && <span className="absolute bottom-3 left-3 rounded-sm border border-white/15 bg-background/80 px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-foreground">{signal.sourceBadge}</span>}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.13em] text-mutedtext">
          <span>{signal.viralEventId}</span>
          <span>Detected {signal.age} ago</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.025em] text-foreground transition-colors group-hover:text-primary sm:text-xl">{signal.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondarytext">{signal.narrative}</p>

        {pair && (
          <div className="mt-4 rounded-md border border-border-strong bg-deep p-3">
            <div className="flex items-center gap-3">
              <PairAssetLogo symbol={pair.symbol} size={38} className="border-primary/25" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono-nums text-sm font-semibold text-foreground">{pair.symbol}</span>
                    <span className="ml-2 text-xs text-mutedtext">{pair.name}</span>
                  </div>
                  <span className="font-mono-nums text-base font-semibold text-primary">{pair.score}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pair.score}%` }} />
                </div>
                <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-mutedtext">AI pair match</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-px border border-border bg-border">
          <Metric label="Viral score" value={signal.viralScore.toFixed(1)} accent />
          <Metric label="Velocity" value={`+${signal.velocity}%`} />
          <Metric label="Views" value={signal.views} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <span className="text-[11px] text-mutedtext"><span className="font-mono-nums text-secondarytext">{signal.engagement}</span> engagements</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
            {launched ? "View market" : "Open signal"} <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterLabel({ children, className = "" }) {
  return <span className={cn("shrink-0 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-mutedtext", className)}>{children}</span>;
}

function Metric({ label, value, accent = false }) {
  return (
    <div className="bg-background px-3 py-3">
      <div className={cn("font-mono-nums text-base font-semibold leading-none", accent ? "text-primary" : "text-foreground")}>{value}</div>
      <div className="mt-1.5 truncate text-[9px] uppercase tracking-[0.1em] text-mutedtext">{label}</div>
    </div>
  );
}
