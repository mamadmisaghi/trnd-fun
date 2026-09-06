"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Database,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import PlatformIcon from "@/components/viral/PlatformIcon";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import { LiveDot, StatusBadge } from "@/components/viral/StatusBadge";
import { cn } from "@/lib/utils";
import { pairCatalog, PLATFORMS, signals, STATUSES } from "@/data";
import { getLaunchStates, subscribeLaunchState } from "@/lib/launchState";

const platformFilters = ["all", "x", "tiktok", "instagram", "youtube"];
const statusFilters = ["NEW", "EARLY", "HEATING", "BREAKING", "VIRAL", "LAUNCHED"];
const sortOptions = [
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
  return number * (match[2]?.toUpperCase() === "M" ? 1e6 : match[2]?.toUpperCase() === "K" ? 1e3 : 1);
}

function eventTime(index) {
  const seconds = 18 + index * 37;
  const date = new Date(Date.UTC(2026, 8, 3, 3, 42, 18));
  date.setUTCSeconds(date.getUTCSeconds() - seconds);
  return date.toISOString().slice(11, 19);
}

export default function Signals() {
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("latest");
  const [query, setQuery] = useState("");
  const [feed, setFeed] = useState(signals);
  const [selectedId, setSelectedId] = useState(signals[0]?.id);
  const [runtime, setRuntime] = useState(getLaunchStates);
  const [newFlash, setNewFlash] = useState(false);

  useEffect(() => subscribeLaunchState(() => setRuntime(getLaunchStates())), []);

  useEffect(() => {
    const metrics = window.setInterval(() => {
      setFeed((current) => current.map((event, index) => ({
        ...event,
        viralScore: Math.min(99.9, Number((event.viralScore + (index % 3 === 0 ? 0.1 : 0)).toFixed(1))),
        velocity: event.velocity + (index % 4 === 0 ? 3 : 1),
      })));
    }, 4200);
    const insert = window.setInterval(() => {
      setNewFlash(true);
      window.setTimeout(() => setNewFlash(false), 1700);
    }, 11000);
    return () => {
      window.clearInterval(metrics);
      window.clearInterval(insert);
    };
  }, []);

  const events = useMemo(() => feed.map((event) => {
    const state = runtime[String(event.id)];
    if (state?.status === "LAUNCHED") return { ...event, launched: true, status: "LAUNCHED", tokenId: state.tokenId, runtimeLaunch: state };
    if (state?.status === "RESERVED") return { ...event, status: "RESERVED", runtimeLaunch: state };
    return event;
  }), [feed, runtime]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = events.filter((event) => {
      if (platform !== "all" && event.platform !== platform) return false;
      if (status !== "ALL" && event.status !== status) return false;
      if (term && !`${event.title} ${event.narrative} ${event.creator} ${event.pairRecommendations.map((p) => p.symbol).join(" ")}`.toLowerCase().includes(term)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === "score") return b.viralScore - a.viralScore;
      if (sort === "velocity") return b.velocity - a.velocity;
      if (sort === "reach") return parseMetric(b.views) - parseMetric(a.views);
      return a.ageMin - b.ageMin;
    });
  }, [events, platform, query, sort, status]);

  const selected = events.find((event) => event.id === selectedId) || filtered[0] || events[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <section className="border-b border-border bg-deep/45 terminal-grid">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-6 lg:py-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LiveDot label="LIVE ANALYZER" />
              <span className="font-mono-nums text-[11px] text-mutedtext">UTC 03:42:18</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.045em]">Watch culture move.</h1>
            <p className="mt-2 text-sm sm:text-base text-secondarytext max-w-2xl">Real-time social events scored for momentum and matched to active Robinhood Chain assets.</p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border border border-border min-w-[340px]">
            <HeaderMetric label="Events / 24H" value="1,284" />
            <HeaderMetric label="Scanning" value="4 SOURCES" />
            <HeaderMetric label="o1 Pairs" value={pairCatalog.activeCount} accent />
          </div>
        </div>
      </section>

      <div className="max-w-[1720px] mx-auto grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
        <aside className="hidden xl:block border-r border-border px-4 py-5 min-h-[calc(100vh-189px)]">
          <FilterGroup label="Platform">
            {platformFilters.map((item) => (
              <FilterButton key={item} active={platform === item} onClick={() => setPlatform(item)}>
                {item === "all" ? <Activity size={14} /> : <PlatformIcon platform={item} size={14} />}
                {item === "all" ? "All sources" : PLATFORMS[item].name}
              </FilterButton>
            ))}
          </FilterGroup>
          <FilterGroup label="Event state" className="mt-7">
            <FilterButton active={status === "ALL"} onClick={() => setStatus("ALL")}><SlidersHorizontal size={14} />All states</FilterButton>
            {statusFilters.map((item) => (
              <FilterButton key={item} active={status === item} onClick={() => setStatus(item)}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUSES[item]?.color }} />
                {STATUSES[item]?.label}
              </FilterButton>
            ))}
          </FilterGroup>
          <div className="mt-8 pt-5 border-t border-border text-[11px] leading-relaxed text-mutedtext">
            <div className="flex items-center gap-2 text-secondarytext mb-2"><Database size={13} /> o1 CONFIG</div>
            <div>{pairCatalog.activeCount} active paired assets</div>
            <div>Synced {pairCatalog.lastSynced}</div>
            <div className="text-primary mt-2">Dynamic catalog</div>
          </div>
        </aside>

        <main className="min-w-0 border-r border-border">
          <div className="px-4 py-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background sticky top-16 z-20">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-mutedtext whitespace-nowrap">SORT</span>
              {sortOptions.map((item) => (
                <button key={item.key} onClick={() => setSort(item.key)} className={cn("px-2.5 py-1.5 rounded-sm text-xs whitespace-nowrap transition-colors", sort === item.key ? "bg-primary text-primary-foreground" : "text-secondarytext hover:text-foreground bg-elevated")}>{item.label}</button>
              ))}
            </div>
            <label className="h-9 px-3 border border-border bg-deep flex items-center gap-2 rounded-sm focus-within:border-primary/60 md:w-64">
              <Search size={14} className="text-mutedtext" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter events, accounts, pairs" className="bg-transparent outline-none text-xs w-full placeholder:text-mutedtext" />
            </label>
          </div>

          <div className="xl:hidden px-4 py-3 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">
            {platformFilters.map((item) => (
              <button key={item} onClick={() => setPlatform(item)} className={cn("h-8 px-3 rounded-full border text-xs flex items-center gap-1.5 whitespace-nowrap", platform === item ? "border-primary text-primary bg-primary/5" : "border-border text-secondarytext")}>
                {item === "all" ? "All" : <><PlatformIcon platform={item} size={12} />{PLATFORMS[item].name}</>}
              </button>
            ))}
          </div>

          {newFlash && (
            <div className="px-4 py-2 border-b border-primary/25 bg-primary/[0.035] animate-flare-enter flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-flare-pulse" />
              <span className="text-[11px] tracking-[0.12em] font-semibold text-primary">NEW EVENT DETECTED</span>
              <span className="text-xs text-mutedtext">stream updated</span>
            </div>
          )}

          <div className="hidden md:grid grid-cols-[86px_minmax(0,1fr)_104px] px-4 py-2 border-b border-border text-[10px] uppercase tracking-[0.14em] text-mutedtext">
            <span>Time</span><span>Viral event</span><span className="text-right">Score</span>
          </div>

          <div>
            {filtered.map((event, index) => (
              <EventRow key={event.id} event={event} index={index} selected={selected?.id === event.id} onSelect={() => setSelectedId(event.id)} />
            ))}
            {!filtered.length && <div className="px-6 py-24 text-center text-secondarytext">No events match this view.</div>}
          </div>
        </main>

        <aside className="hidden xl:block p-4 min-h-[calc(100vh-189px)]">
          {selected && <EventIntelligence event={selected} />}
        </aside>
      </div>
    </div>
  );
}

function EventRow({ event, index, selected, onSelect }) {
  const launched = event.status === "LAUNCHED" || event.launched;
  const topPair = event.pairRecommendations[0];
  return (
    <article onClick={onSelect} className={cn("group border-b border-border transition-colors cursor-default", selected ? "bg-elevated/75" : "hover:bg-deep")}>
      <div className="grid md:grid-cols-[86px_minmax(0,1fr)_104px] gap-3 px-4 py-4">
        <div className="hidden md:block font-mono-nums text-[11px] text-mutedtext pt-0.5">
          <div>{eventTime(index)}</div>
          <div className="mt-2 text-[10px] font-mono">#{event.viralEventId.split("-")[1]}</div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <PlatformIcon platform={event.platform} size={13} />
            <span className="text-xs text-secondarytext">{event.creator}</span>
            <span className="text-mutedtext text-xs">· {event.age} ago</span>
            <StatusBadge status={event.status} />
            {event.sourceBadge && <span className="text-[9px] tracking-[0.13em] text-foreground border border-border-strong px-1.5 py-0.5">{event.sourceBadge}</span>}
          </div>
          <div className="flex gap-3">
            {event.mediaType !== "text" && <img src={event.thumb} alt="" className="hidden sm:block w-20 h-14 object-cover border border-border rounded-sm shrink-0 grayscale-[15%]" />}
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] sm:text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{event.title}</h2>
              <p className="text-xs sm:text-sm text-mutedtext mt-1 leading-relaxed line-clamp-2">{event.narrative}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] font-mono-nums text-mutedtext flex-wrap">
            <span className="text-primary">+{event.velocity}% velocity</span>
            <span>{event.views} views</span>
            <span>{event.engagement} engagements</span>
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-deep px-2 py-1 text-foreground">
              <PairAssetLogo symbol={topPair.symbol} size={18} className="rounded-full border-0 bg-transparent" />
              {topPair.symbol} <span className="text-primary">{topPair.score}%</span>
            </span>
          </div>
        </div>
        <div className="flex md:flex-col items-end justify-between md:justify-start gap-3 md:gap-0">
          <div className="md:text-right">
            <div className="font-mono-nums text-3xl font-semibold leading-none text-primary">{event.viralScore.toFixed(1)}</div>
            <div className="text-[9px] tracking-[0.13em] text-mutedtext mt-1">VIRAL SCORE</div>
          </div>
          <Link to={launched ? `/token/${event.tokenId}` : `/signal/${event.id}`} className="md:mt-5 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-foreground hover:text-primary">
            {launched ? "VIEW MARKET" : "OPEN"} <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EventIntelligence({ event }) {
  const launched = event.status === "LAUNCHED" || event.launched;
  return (
    <div className="sticky top-20 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-mutedtext">Selected intelligence</span>
        <span className="font-mono text-[10px] text-mutedtext">{event.viralEventId}</span>
      </div>
      <div className="border border-border bg-card p-4 rounded-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-secondarytext">VIRAL SCORE</div>
            <div className="font-mono-nums text-5xl text-primary font-semibold mt-1">{event.viralScore.toFixed(1)}</div>
          </div>
          <StatusBadge status={event.status} />
        </div>
        <div className="mt-4 space-y-2">
          {Object.entries(event.scoreBreakdown).slice(0, 4).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[1fr_88px_24px] items-center gap-2">
              <span className="text-[11px] text-mutedtext capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <div className="h-px bg-border"><div className="h-px bg-primary" style={{ width: `${value}%` }} /></div>
              <span className="font-mono-nums text-xs text-secondarytext text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card p-4 rounded-sm">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-mutedtext"><Zap size={12} className="text-primary" />Why this is moving</div>
        <p className="text-sm text-secondarytext leading-relaxed mt-3">{event.whyMoving}</p>
      </div>

      <div className="border border-border bg-card rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.16em] text-mutedtext">AI pair match</span>
          <span className="text-[10px] text-primary">TOP 4</span>
        </div>
        {event.pairRecommendations.map((pair, index) => (
          <div key={pair.symbol} className="grid grid-cols-[30px_1fr_auto] items-center gap-2.5 px-4 py-3 border-b border-border last:border-0">
            <PairAssetLogo symbol={pair.symbol} size={30} className={index === 0 ? "border-primary/40" : ""} />
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="text-sm font-semibold">{pair.symbol}</span><span className="text-[10px] text-mutedtext truncate">{pair.name}</span></div>
              <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden"><div className={cn("h-full rounded-full", index === 0 ? "bg-primary" : "bg-foreground/35")} style={{ width: `${pair.score}%` }} /></div>
            </div>
            <span className={cn("font-mono-nums text-sm font-semibold", index === 0 ? "text-primary" : "text-foreground")}>{pair.score}%</span>
          </div>
        ))}
      </div>

      <Link to={launched ? `/token/${event.tokenId}` : `/signal/${event.id}`} className="h-11 px-4 bg-primary text-primary-foreground flex items-center justify-center gap-2 text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors">
        {launched ? "View market" : "Open full intelligence"} <ArrowUpRight size={14} />
      </Link>
      <div className="flex items-center justify-center gap-2 text-[10px] text-mutedtext"><Clock3 size={11} />Continuously rescored</div>
    </div>
  );
}

function FilterGroup({ label, children, className = "" }) {
  return <div className={className}><div className="text-[10px] uppercase tracking-[0.16em] text-mutedtext px-2 mb-2">{label}</div><div className="space-y-1">{children}</div></div>;
}

function FilterButton({ active, children, onClick }) {
  return <button onClick={onClick} className={cn("w-full h-9 px-2.5 rounded-sm flex items-center gap-2 text-xs text-left transition-colors", active ? "bg-elevated text-foreground border-l-2 border-primary" : "text-mutedtext hover:text-foreground hover:bg-deep")}>{children}</button>;
}

function HeaderMetric({ label, value, accent = false }) {
  return <div className="bg-deep px-3 py-2.5"><span className="text-[9px] uppercase tracking-[0.12em] text-mutedtext block">{label}</span><span className={cn("font-mono-nums text-sm mt-1 block", accent ? "text-primary" : "text-foreground")}>{value}</span></div>;
}
