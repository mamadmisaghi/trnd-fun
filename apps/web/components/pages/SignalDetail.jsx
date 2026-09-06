"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BrainCircuit,
  Check,
  ExternalLink,
  Search,
  Share2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Button from "@/components/viral/Button";
import LineChart from "@/components/viral/LineChart";
import PlatformIcon from "@/components/viral/PlatformIcon";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import { LiveDot, StatusBadge } from "@/components/viral/StatusBadge";
import { Metric, SectionLabel } from "@/components/viral/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSignal, pairAssets, pairCatalog, PLATFORMS } from "@/data";
import { getEventLaunch, subscribeLaunchState } from "@/lib/launchState";
import { cn } from "@/lib/utils";

const timeframes = ["15M", "1H", "6H", "24H"];

function genSeries(seed, points = 44) {
  let value = Math.max(20, seed / 18);
  return Array.from({ length: points }, (_, index) => {
    value += ((index % 5) - 1.25) * (seed / 170) + (index > points * 0.62 ? seed / 95 : 0);
    return Math.max(1, value);
  });
}

export default function SignalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const signal = getSignal(id);
  const [timeframe, setTimeframe] = useState("1H");
  const [watching, setWatching] = useState(false);
  const [allPairsOpen, setAllPairsOpen] = useState(false);
  const [pairQuery, setPairQuery] = useState("");
  const [runtimeLaunch, setRuntimeLaunch] = useState(() => getEventLaunch(id));

  useEffect(() => subscribeLaunchState(() => setRuntimeLaunch(getEventLaunch(id))), [id]);

  const pairResults = useMemo(() => {
    const term = pairQuery.trim().toLowerCase();
    if (!term) return pairAssets;
    return pairAssets.filter((asset) => `${asset.symbol} ${asset.name} ${asset.sector}`.toLowerCase().includes(term));
  }, [pairQuery]);

  if (!signal) {
    return <div className="max-w-3xl mx-auto px-4 py-32 text-center"><p className="text-secondarytext">Viral Event not found.</p><Button as={Link} to="/live" variant="outline" className="mt-4">Back to Live</Button></div>;
  }

  const launched = signal.launched || runtimeLaunch?.status === "LAUNCHED";
  const reserved = runtimeLaunch?.status === "RESERVED";
  const tokenId = runtimeLaunch?.tokenId || signal.tokenId;
  const series = genSeries(signal.velocity + timeframe.length * 13);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between gap-4 mb-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-mutedtext hover:text-foreground"><ArrowLeft size={14} /> Live analyzer</button>
          <div className="font-mono text-[10px] text-mutedtext">{signal.viralEventId} · SOURCE {signal.sourcePostId}</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
          <div className="space-y-5 min-w-0">
            <section className="border border-border bg-card rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <PlatformIcon platform={signal.platform} size={15} />
                  <span className="text-sm font-medium">{PLATFORMS[signal.platform].name}</span>
                  <span className="text-mutedtext">·</span>
                  <span className="text-xs text-mutedtext">detected {signal.age} ago</span>
                  <StatusBadge status={launched ? "LAUNCHED" : reserved ? "RESERVED" : signal.status} />
                  {signal.sourceBadge && <span className="px-2 py-0.5 border border-border-strong text-[9px] tracking-[0.14em]">{signal.sourceBadge}</span>}
                </div>
                <button className="flex items-center gap-1.5 text-xs text-secondarytext hover:text-primary"><ExternalLink size={13} /> Original source</button>
              </div>

              <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
                <div className="p-5 sm:p-7 md:border-r border-border">
                  <h1 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.045em] leading-[1.08] max-w-3xl">{signal.title}</h1>
                  <p className="mt-4 text-base text-secondarytext leading-relaxed max-w-3xl">{signal.narrative}</p>
                  <p className="mt-2 text-sm text-mutedtext leading-relaxed max-w-3xl">{signal.context}</p>
                  <div className="grid grid-cols-3 gap-px bg-border border border-border mt-7">
                    <MetricCell label="Views" value={signal.views} />
                    <MetricCell label="Engagement" value={signal.engagement} />
                    <MetricCell label="Mentions" value={signal.mentions} />
                  </div>
                </div>
                <div className="bg-deep p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={signal.avatar} alt="" className="w-9 h-9 rounded-full object-cover grayscale-[20%]" />
                    <div><div className="text-sm font-medium">{signal.creatorName}</div><div className="text-xs text-mutedtext">{signal.handle}</div></div>
                  </div>
                  {signal.mediaType === "text" ? (
                    <blockquote className="text-[15px] leading-relaxed text-foreground">“{signal.narrative}”</blockquote>
                  ) : (
                    <img src={signal.thumb} alt={signal.title} className="w-full aspect-video object-cover border border-border rounded-sm" />
                  )}
                  <div className="mt-3 text-[10px] uppercase tracking-[0.13em] text-mutedtext">Original {signal.mediaType} · {signal.platform}</div>
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-[1.3fr_.7fr] gap-5">
              <div className="border border-border bg-card rounded-sm p-5">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div><SectionLabel>Momentum</SectionLabel><div className="flex items-center gap-2 mt-1"><LiveDot /><span className="text-xs text-primary">+{signal.velocity}% velocity</span></div></div>
                  <div className="flex items-center gap-1">
                    {timeframes.map((item) => <button key={item} onClick={() => setTimeframe(item)} className={cn("px-2.5 py-1.5 text-[11px] font-mono rounded-sm", timeframe === item ? "bg-primary text-primary-foreground" : "text-mutedtext hover:text-foreground bg-deep")}>{item}</button>)}
                  </div>
                </div>
                <LineChart data={series} height={210} color="#A8FF00" />
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border"><Metric label="Current reach" value={signal.views} /><Metric label="Acceleration" value={`${signal.scoreBreakdown.acceleration}/100`} /><Metric label="Spread" value={`${signal.crossPlatform.length} platforms`} /></div>
              </div>

              <div className="border border-border bg-card rounded-sm p-5">
                <div className="flex items-center gap-2"><Zap size={14} className="text-primary" /><SectionLabel>Why this is moving</SectionLabel></div>
                <p className="text-sm text-secondarytext leading-relaxed mt-4">{signal.whyMoving}</p>
                <div className="mt-5 pt-4 border-t border-border">
                  <SectionLabel>Cross-platform activity</SectionLabel>
                  <div className="mt-3 space-y-2">
                    {signal.crossPlatform.map((platform, index) => (
                      <div key={platform} className="flex items-center justify-between py-1.5">
                        <span className="flex items-center gap-2 text-xs text-secondarytext"><PlatformIcon platform={platform} size={13} />{PLATFORMS[platform].name}</span>
                        <span className="font-mono text-xs text-primary">{index === 0 ? "PRIMARY" : `+${Math.round(signal.velocity / (index + 1.8))}%`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-border bg-card rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div><div className="flex items-center gap-2"><BrainCircuit size={15} className="text-primary" /><SectionLabel>AI RWA match</SectionLabel></div><p className="text-xs text-mutedtext mt-1">Independent relevance scores. They are not normalized to 100%.</p></div>
                <button onClick={() => setAllPairsOpen(true)} className="text-xs text-secondarytext hover:text-primary flex items-center gap-1.5">Browse all {pairCatalog.activeCount} pairs <ArrowUpRight size={13} /></button>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-px bg-border">
                {signal.pairRecommendations.map((pair, index) => (
                  <Link key={pair.symbol} to={`/launch/${signal.id}?pair=${pair.symbol}`} className="bg-card p-4 hover:bg-elevated transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <PairAssetLogo symbol={pair.symbol} size={40} className={index === 0 ? "border-primary/45" : ""} />
                      <div className="text-right"><div className={cn("font-mono-nums text-xl font-semibold", index === 0 ? "text-primary" : "text-foreground")}>{pair.score}%</div><div className="text-[10px] text-mutedtext">MATCH</div></div>
                    </div>
                    <div className="font-heading text-xl font-semibold mt-4 group-hover:text-primary">{pair.symbol}</div>
                    <div className="text-xs text-secondarytext mt-1 truncate">{pair.name}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", index === 0 ? "bg-primary" : "bg-foreground/35")} style={{ width: `${pair.score}%` }} /></div>
                    <div className="text-xs text-mutedtext leading-relaxed mt-3 min-h-9">{pair.reason}</div>
                    <div className="mt-4 text-[10px] tracking-[0.13em] text-foreground flex items-center gap-1">{index === 0 ? "BEST MATCH" : "SELECT PAIR"} <ArrowUpRight size={11} /></div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="border border-border bg-card rounded-sm p-5 xl:sticky xl:top-20">
              <div className="flex items-center justify-between"><SectionLabel>Viral Score</SectionLabel><LiveDot label="RESCORING" /></div>
              <div className="flex items-end gap-2 mt-3"><span className="font-mono text-7xl font-semibold leading-none text-primary">{signal.viralScore.toFixed(1)}</span><span className="font-mono text-xs text-mutedtext mb-2">/ 100</span></div>
              <div className="mt-6 space-y-3">
                {Object.entries(signal.scoreBreakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-secondarytext capitalize">{key.replace(/([A-Z])/g, " $1")}</span><span className="font-mono text-xs">{value}</span></div>
                    <div className="h-px bg-border"><div className="h-px bg-primary" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                {launched ? (
                  <>
                    <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-[0.12em]"><Check size={14} /> LAUNCHED ✓</div>
                    <p className="text-sm text-secondarytext mt-3">This exact source event is permanently connected to one live market.</p>
                    <Button as={Link} to={`/token/${tokenId}`} size="lg" className="w-full mt-4">View market <ArrowUpRight size={15} /></Button>
                  </>
                ) : reserved ? (
                  <>
                    <div className="text-xs font-semibold tracking-[0.12em]">LAUNCH IN PROGRESS</div>
                    <p className="text-sm text-secondarytext mt-3">This event is temporarily reserved while a wallet completes launch.</p>
                    <Button as={Link} to={`/launch/${signal.id}`} size="lg" className="w-full mt-4">Continue launch</Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-secondarytext"><ShieldCheck size={14} className="text-primary" /> One viral post = one launch</div>
                    <Button as={Link} to={`/launch/${signal.id}?pair=${signal.pairRecommendations[0].symbol}`} size="lg" className="w-full mt-4">Launch this event <ArrowUpRight size={15} /></Button>
                    <p className="text-[11px] text-mutedtext text-center mt-2">Prepared through o1 · signed by your wallet</p>
                  </>
                )}
                <div className="grid grid-cols-[1fr_auto] gap-2 mt-3"><Button variant="secondary" onClick={() => setWatching(!watching)}><Bookmark size={14} />{watching ? "Watching" : "Watch event"}</Button><Button variant="secondary" size="icon"><Share2 size={14} /></Button></div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={allPairsOpen} onOpenChange={setAllPairsOpen}>
        <DialogContent className="bg-deep border-border-strong text-foreground max-w-2xl">
          <DialogHeader><DialogTitle className="font-heading text-xl">Browse active o1 pairs</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2 h-10 px-3 bg-background border border-border rounded-sm"><Search size={14} className="text-mutedtext" /><input autoFocus value={pairQuery} onChange={(event) => setPairQuery(event.target.value)} placeholder="Search symbol, company or sector" className="bg-transparent outline-none text-sm w-full placeholder:text-mutedtext" /></div>
          <div className="max-h-[420px] overflow-y-auto border border-border">
            {pairResults.map((asset) => {
              const recommended = signal.pairRecommendations.find((pair) => pair.symbol === asset.symbol);
              return <Link key={asset.symbol} to={`/launch/${signal.id}?pair=${asset.symbol}`} className="grid grid-cols-[36px_72px_1fr_auto] items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-elevated"><PairAssetLogo symbol={asset.symbol} size={34} /><span className="font-mono font-semibold">{asset.symbol}</span><span><span className="text-sm block">{asset.name}</span><span className="text-xs text-mutedtext">{asset.type} · {asset.sector}</span></span>{recommended ? <span className={cn("font-mono-nums text-sm font-semibold", recommended === signal.pairRecommendations[0] ? "text-primary" : "text-foreground")}>{recommended.score}% MATCH</span> : <ArrowUpRight size={14} className="text-mutedtext" />}</Link>;
            })}
          </div>
          <div className="text-[11px] text-mutedtext flex items-center justify-between"><span>{pairCatalog.activeCount} active assets in current configuration</span><span>Synced {pairCatalog.lastSynced}</span></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCell({ label, value }) {
  return <div className="bg-deep px-3 py-3"><span className="text-[9px] uppercase tracking-[0.13em] text-mutedtext block">{label}</span><span className="font-mono text-base mt-1 block">{value}</span></div>;
}
