"use client";
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/navigation";
import { ArrowDownUp, ArrowLeft, ArrowUpRight, Check, Copy, ExternalLink, Globe2, ShieldCheck, TrendingUp } from "lucide-react";
import Button from "@/components/viral/Button";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { MetricChange, SectionLabel } from "@/components/viral/ui";
import { activity, getSignal, getToken, topHolders } from "@/data";
import { getLaunchByToken } from "@/lib/launchState";
import { cn } from "@/lib/utils";
import SafeImage from "@/components/ui/safe-image";

function series(seed) {
  let value = seed;
  return Array.from({ length: 48 }, (_, index) => {
    value += ((index % 7) - 2.4) * seed * 0.018 + (index > 30 ? seed * 0.018 : 0);
    return Math.max(seed * 0.55, value);
  });
}

export default function TokenMarket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stored = getLaunchByToken(id);
  const staticToken = getToken(id);
  const token = staticToken || (stored ? {
    id: stored.tokenId,
    name: stored.tokenName,
    ticker: stored.ticker,
    image: stored.image,
    pairAsset: stored.selectedPair,
    pairMatchScore: stored.pairMatchScore,
    tokenAddress: stored.tokenAddress,
    marketCap: "$84.2K",
    price: "$0.000084",
    change24h: 18.4,
    volume24h: "$12.8K",
    liquidity: "$31.4K",
    holders: 47,
    fromSignal: true,
    signalId: stored.eventId,
    launchId: stored.launchId,
    launchTime: "Just now",
  } : null);
  const signal = token?.fromSignal ? getSignal(token.signalId) : null;
  const [timeframe, setTimeframe] = useState("1H");
  const [side, setSide] = useState("buy");
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState("idle");
  const chart = useMemo(() => series(Math.max(1, token?.change24h || 14)), [token?.change24h, timeframe]);

  if (!token) return <div className="max-w-3xl mx-auto px-4 py-32 text-center"><p className="text-secondarytext">Market not found.</p><Button as={Link} to="/explore" variant="outline" className="mt-4">Back to Markets</Button></div>;

  const quote = token.pairAsset || "ETH";
  const submitTrade = () => {
    setTxState("pending");
    window.setTimeout(() => setTxState("success"), 1300);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-mutedtext hover:text-foreground mb-5"><ArrowLeft size={14} /> Markets</button>

      <header className="border border-border bg-card rounded-sm mb-5">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0"><SafeImage src={token.image} alt="" className="w-16 h-16 border border-border shrink-0" /><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h1 className="text-2xl font-semibold tracking-[-0.035em] truncate">{token.name}</h1><span className={`text-[9px] border px-2 py-0.5 tracking-[0.13em] ${token.fromSignal ? "text-primary border-primary/25 bg-primary/[0.04]" : "text-secondarytext border-border-strong"}`}>{token.fromSignal ? "VIRAL ORIGIN" : "MANUAL LAUNCH"}</span></div><div className="mt-1 flex items-center gap-1.5 font-mono text-sm text-primary"><span>${token.ticker} /</span><PairAssetLogo symbol={quote} size={20} className="rounded-full" /><span>{quote}</span></div><button className="text-[11px] text-mutedtext mt-1 flex items-center gap-1 hover:text-foreground">{token.tokenAddress}<Copy size={11} /></button><div className="mt-2 flex items-center gap-4 text-[10px] text-mutedtext"><span>Creator <b className="text-secondarytext">@viralindex</b></span><span>Created {token.launchTime}</span></div></div></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-x-5 gap-y-4 xl:min-w-[760px]"><HeaderStat label="Price" value={token.price} /><HeaderStat label="24H" value={<MetricChange value={token.change24h} />} /><HeaderStat label="Market Cap" value={token.marketCap} /><HeaderStat label="FDV" value={token.marketCap} /><HeaderStat label="Liquidity" value={token.liquidity} /><HeaderStat label="24H Volume" value={token.volume24h} /><HeaderStat label="Holders" value={token.holders.toLocaleString()} /></div>
        </div>
        <div className="px-4 sm:px-5 py-3 border-t border-border grid md:grid-cols-[1fr_360px] gap-4 text-xs"><div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-mutedtext"><span>Creator fee generated <b className="font-mono-nums text-base text-foreground ml-1">$14,270</b></span><span>Created <b className="text-foreground ml-1">Jun 14, 2025 · 2:21 PM</b></span></div><p className="text-secondarytext leading-relaxed">A cultural market connected to a real internet moment and priced against {quote}.</p></div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <main className="space-y-5 min-w-0">
          <section className="border border-border bg-card rounded-sm p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4"><HeaderStat label="Price" value={token.price} /><HeaderStat label="Market cap" value={token.marketCap} /><HeaderStat label="Volume (24H)" value={token.volume24h} /><HeaderStat label="Liquidity" value={token.liquidity} /><HeaderStat label="Holders" value={token.holders.toLocaleString()} /></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-t border-border pt-3"><div className="flex gap-1">{["15M", "1H", "4H", "1D"].map((item) => <button key={item} onClick={() => setTimeframe(item)} className={cn("px-3 py-1.5 text-[11px] font-mono rounded-sm", timeframe === item ? "bg-primary text-primary-foreground" : "bg-deep text-mutedtext hover:text-foreground")}>{item}</button>)}</div><div className="flex items-center gap-1"><span className="px-3 py-1.5 bg-primary/[0.08] text-primary text-[10px]">PRICE</span><span className="px-3 py-1.5 bg-deep text-mutedtext text-[10px]">MARKET CAP</span></div></div>
            <CandleChart data={chart} positive={token.change24h >= 0} />
          </section>

          <section className="grid lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)] gap-5">
            <div className="border border-border bg-card rounded-sm overflow-hidden"><div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">Recent trades</h2></div><div className="grid grid-cols-[60px_54px_minmax(105px,1fr)_72px_86px_90px] gap-2 px-4 py-2 border-b border-border bg-deep/45 text-[9px] uppercase tracking-[0.1em] text-mutedtext"><span>Time</span><span>Type</span><span>Wallet</span><span>{quote}</span><span>${token.ticker}</span><span>Price</span></div>{activity.slice(0, 8).map((trade, index) => <div key={`${trade.wallet}-${index}`} className="grid grid-cols-[60px_54px_minmax(105px,1fr)_72px_86px_90px] gap-2 px-4 py-2 border-b border-border last:border-0 text-[11px] font-mono"><span className="text-mutedtext">{trade.time} ago</span><span className={trade.type === "sell" ? "text-destructive" : "text-primary"}>{trade.type.toUpperCase()}</span><span className="truncate text-secondarytext">{trade.wallet}</span><span>{(0.38 + index * 0.27).toFixed(2)}</span><span>{(6482 + index * 9043).toLocaleString()}</span><span>{token.price}</span></div>)}</div>
            <div className="border border-border bg-card rounded-sm overflow-hidden"><div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">Top holders</h2></div><div className="grid grid-cols-[28px_1fr_72px] gap-3 px-4 py-2 border-b border-border bg-deep/45 text-[9px] uppercase tracking-[0.1em] text-mutedtext"><span>#</span><span>Address</span><span>Share</span></div>{topHolders.slice(0, 8).map((holder) => <div key={holder.address} className="grid grid-cols-[28px_1fr_72px] gap-3 px-4 py-2.5 border-b border-border last:border-0 text-[11px] font-mono"><span className="text-mutedtext">{holder.rank}</span><span className="truncate">{holder.address}</span><span className="text-right">{holder.pct}%</span></div>)}</div>
          </section>

          {signal && (
            <section className="border border-primary/25 bg-primary/[0.025] rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-primary/15 flex items-center justify-between"><div><SectionLabel>Origin</SectionLabel><div className="text-sm font-medium mt-1">This market began as a detected Viral Event.</div></div><span className="font-mono text-xs text-primary">{signal.viralEventId}</span></div>
              <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_310px]">
                <img src={signal.thumb} alt="" onError={(event) => { event.currentTarget.src = "/viral-terminal-mark.svg"; event.currentTarget.classList.add("p-8", "bg-deep"); }} className="w-full h-full min-h-44 object-cover border-r border-primary/15 grayscale-[15%]" />
                <div className="p-5"><div className="flex items-center gap-2 text-xs text-secondarytext"><PlatformIcon platform={signal.platform} size={13} />{signal.creator} · detected {signal.age} ago</div><h2 className="text-lg font-semibold tracking-[-0.025em] mt-3">{signal.title}</h2><p className="text-xs text-mutedtext leading-relaxed mt-2">{signal.narrative}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border mt-5"><OriginCell label="Viral score" value={signal.viralScore.toFixed(1)} accent /><OriginCell label="Selected pair" value={quote} /><OriginCell label="AI match" value={token.pairMatchScore ? `${token.pairMatchScore}%` : "MANUAL"} /><OriginCell label="Launch ID" value={token.launchId || signal.viralEventId} /></div><div className="flex flex-wrap gap-3 mt-4"><Link to={`/signal/${signal.id}`} className="text-xs text-primary flex items-center gap-1">View original intelligence <ArrowUpRight size={12} /></Link><button className="text-xs text-secondarytext flex items-center gap-1 hover:text-foreground">Original post <ExternalLink size={12} /></button></div></div>
                <div className="p-5 border-t lg:border-t-0 lg:border-l border-primary/15"><div className="flex items-center gap-2 text-primary"><TrendingUp size={14} /><h3 className="text-sm font-semibold">Why this is moving</h3></div><ul className="mt-3 space-y-2 text-xs text-secondarytext leading-relaxed"><li>• Engagement is accelerating across multiple social surfaces.</li><li>• The narrative has direct relevance to {quote}.</li><li>• Holder distribution is broadening while volume remains elevated.</li></ul><div className="mt-4 border border-border bg-deep p-3 text-xs text-secondarytext">“This moment is spreading beyond its original audience.”</div></div>
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-5 self-start">
          <section className="border border-border-strong bg-card rounded-lg overflow-hidden">
            <div className="px-4 pt-4"><div className="grid grid-cols-2 rounded-md bg-deep p-1"><button onClick={() => { setSide("buy"); setTxState("idle"); }} className={cn("py-2.5 rounded-sm text-sm font-semibold transition-colors", side === "buy" ? "bg-primary text-primary-foreground" : "text-mutedtext hover:text-foreground")}>Buy</button><button onClick={() => { setSide("sell"); setTxState("idle"); }} className={cn("py-2.5 rounded-sm text-sm font-semibold transition-colors", side === "sell" ? "bg-foreground text-background" : "text-mutedtext hover:text-foreground")}>Sell</button></div></div>
            <div className="p-4">
              <div className="rounded-md border border-border bg-deep/70 p-3 focus-within:border-primary/60 transition-colors">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-mutedtext"><span>You pay</span><span>Balance 2.40</span></div>
                <div className="mt-3 flex items-center gap-3"><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 bg-transparent outline-none font-mono-nums text-2xl placeholder:text-mutedtext" /><div className="flex items-center gap-2 border border-border bg-card px-2.5 py-2 rounded-md shrink-0">{side === "buy" ? <PairAssetLogo symbol={quote} size={22} className="rounded-full" /> : <SafeImage src={token.image} alt="" className="w-[22px] h-[22px] rounded-full" />}<span className="font-mono text-xs font-semibold">{side === "buy" ? quote : token.ticker}</span></div></div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">{[25, 50, 75, 100].map((percent) => <button key={percent} onClick={() => setAmount((2.4 * percent / 100).toFixed(2))} className="border border-border rounded-sm py-1.5 text-[10px] text-mutedtext hover:text-primary hover:border-primary/35 transition-colors">{percent === 100 ? "MAX" : `${percent}%`}</button>)}</div>
              <div className="relative h-6"><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border-strong bg-card flex items-center justify-center text-mutedtext"><ArrowDownUp size={13} /></span></div>
              <div className="rounded-md border border-border bg-deep/45 p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-mutedtext">You receive</div>
                <div className="mt-3 flex items-center gap-3"><span className="min-w-0 flex-1 font-mono-nums text-2xl">{amount ? Math.round(Number(amount) * 18400).toLocaleString() : "0"}</span><div className="flex items-center gap-2 border border-border bg-card px-2.5 py-2 rounded-md shrink-0">{side === "buy" ? <SafeImage src={token.image} alt="" className="w-[22px] h-[22px] rounded-full" /> : <PairAssetLogo symbol={quote} size={22} className="rounded-full" />}<span className="font-mono text-xs font-semibold">{side === "buy" ? token.ticker : quote}</span></div></div>
              </div>
              <div className="my-4 space-y-2 text-[11px]"><ConfigRow label="Rate" value={`1 ${quote} ≈ 18,400 ${token.ticker}`} /><ConfigRow label="Trading fee" value="1.00%" /><ConfigRow label="Minimum received" value={`${amount ? Math.round(Number(amount) * 18216).toLocaleString() : "0"} ${side === "buy" ? token.ticker : quote}`} /></div>
              <Button className="w-full" size="lg" onClick={submitTrade} disabled={!amount || txState === "pending"}>{txState === "pending" ? "Preparing quote…" : txState === "success" ? <><Check size={15} /> Quote ready</> : `${side === "buy" ? "Buy" : "Sell"} $${token.ticker}`}</Button>
              <p className="text-[10px] text-mutedtext text-center mt-2.5">Prototype quote · wallet signature required in production</p>
            </div>
          </section>

          <section className="border border-border bg-card rounded-sm p-4">
            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /><SectionLabel>Market configuration</SectionLabel></div>
            <div className="mt-4 space-y-3"><ConfigRow label="Infrastructure" value="o1 Launchpad" /><ConfigRow label="Quote asset" value={quote} /><ConfigRow label="Base swap fee" value="1% snapshot" /><ConfigRow label="Liquidity" value="Permanent token-side" /></div>
            <p className="text-[10px] text-mutedtext leading-relaxed mt-4 pt-4 border-t border-border">Values shown are a prototype snapshot. Production reads the active o1 configuration.</p>
          </section>

          <section className="border border-border bg-card rounded-sm p-4"><h2 className="text-sm font-semibold">About this token</h2><p className="mt-3 text-xs text-secondarytext leading-relaxed">{token.name} captures a live cultural moment and keeps its market provenance connected to the original source.</p><div className="flex flex-wrap gap-2 mt-4"><AboutLink icon={Globe2} label="Website" /><AboutLink label="𝕏 Twitter" />{signal && <AboutLink icon={() => <PlatformIcon platform={signal.platform} size={12} />} label={signal.platform === "tiktok" ? "TikTok" : "Original"} />}</div></section>
        </aside>
      </div>
    </div>
  );
}

function HeaderStat({ label, value }) { return <div><span className="text-[9px] uppercase tracking-[0.13em] text-mutedtext block">{label}</span><span className="font-mono-nums text-base xl:text-lg font-semibold leading-tight mt-1.5 block">{value}</span></div>; }
function OriginCell({ label, value, accent = false }) { return <div className="bg-deep px-3 py-3"><span className="text-[9px] uppercase tracking-[0.12em] text-mutedtext block">{label}</span><span className={cn("font-mono text-sm mt-1 block", accent && "text-primary")}>{value}</span></div>; }
function Field({ label, children }) { return <label><span className="text-[10px] uppercase tracking-[0.13em] text-mutedtext block mb-1.5">{label}</span>{children}</label>; }
function ConfigRow({ label, value }) { return <div className="flex items-center justify-between text-xs"><span className="text-mutedtext">{label}</span><span>{value}</span></div>; }
function AboutLink({ icon: Icon, label }) { return <button className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[11px] text-secondarytext hover:text-primary hover:border-primary/35">{Icon && <Icon size={12} />}{label}</button>; }

function CandleChart({ data, positive }) {
  const width = 900;
  const height = 300;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.08;
  const scaleY = (value) => height - 30 - ((value - min) / (max - min || 1)) * (height - 55);
  const candles = data.slice(0, 36).map((value, index) => {
    const open = index ? data[index - 1] : value * 0.98;
    const close = value;
    const spread = Math.max(0.35, Math.abs(close - open) * 0.7);
    return { open, close, high: Math.max(open, close) + spread, low: Math.min(open, close) - spread };
  });
  return <div className="h-[300px] w-full overflow-hidden border border-border bg-deep/35"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full"><g stroke="rgba(255,255,255,.055)" strokeWidth="1">{[1,2,3,4].map((line) => <line key={`h${line}`} x1="0" x2={width} y1={line * 60} y2={line * 60} />)}{[1,2,3,4,5].map((line) => <line key={`v${line}`} y1="0" y2={height} x1={line * 150} x2={line * 150} />)}</g>{candles.map((candle, index) => { const x = 13 + index * 24.2; const up = candle.close >= candle.open; const color = up ? "#53E67B" : "#FF4D5D"; return <g key={index}><line x1={x} x2={x} y1={scaleY(candle.high)} y2={scaleY(candle.low)} stroke={color} strokeWidth="1.4" /><rect x={x - 5} y={Math.min(scaleY(candle.open), scaleY(candle.close))} width="10" height={Math.max(3, Math.abs(scaleY(candle.open) - scaleY(candle.close)))} fill={color} rx="1" /></g>; })}<line x1="0" x2={width} y1={scaleY(data[data.length - 1])} y2={scaleY(data[data.length - 1])} stroke={positive ? "#A8FF00" : "#FF4D4D"} strokeDasharray="4 5" opacity=".45" /></svg></div>;
}
