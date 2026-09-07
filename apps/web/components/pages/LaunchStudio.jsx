"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe2,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import Button from "@/components/viral/Button";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { SectionLabel } from "@/components/viral/ui";
import { getSignal, pairAssets, pairCatalog } from "@/data";
import { confirmLaunch, getEventLaunch, releaseEvent, reserveEvent, subscribeLaunchState } from "@/lib/launchState";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import SafeImage from "@/components/ui/safe-image";
import { explorerUrl } from "@/lib/protocol/robinhood-testnet";
import { useViralWallet } from "@/lib/protocol/ViralWalletProvider";

const steps = ["Select Pair", "Configure Token", "Review", "Wallet"];

function tokenSuggestions(signal) {
  const primary = signal.pairRecommendations[0].symbol;
  const compact = signal.title.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(Boolean);
  return [
    { name: compact.slice(0, 4).join(" "), ticker: compact.slice(0, 2).map((word) => word[0]).join("").toUpperCase() + primary.slice(0, 2) },
    { name: `${primary} Viral Moment`, ticker: `V${primary}`.slice(0, 8) },
    { name: compact.slice(-3).join(" "), ticker: compact.slice(-2).join("").slice(0, 8).toUpperCase() },
  ];
}

export default function LaunchStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signal = getSignal(id);
  const recommendedSymbols = signal?.pairRecommendations.map((pair) => pair.symbol) || [];
  const requestedPair = searchParams.get("pair");
  const initialPair = pairAssets.some((asset) => asset.symbol === requestedPair) ? requestedPair : recommendedSymbols[0] || "ETH";
  const suggestions = signal ? tokenSuggestions(signal) : [];

  const [step, setStep] = useState(0);
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [showAllPairs, setShowAllPairs] = useState(false);
  const [pairQuery, setPairQuery] = useState("");
  const [name, setName] = useState(suggestions[0]?.name || "");
  const [ticker, setTicker] = useState(suggestions[0]?.ticker || "");
  const [description, setDescription] = useState(signal?.narrative || "");
  const [image, setImage] = useState(signal?.thumb || "");
  const [website, setWebsite] = useState(signal?.sourceUrl || `https://x.com/${String(signal?.creator || "viral").replace("@", "")}/status/${signal?.sourcePostId || id}`);
  const [xLink, setXLink] = useState("");
  const [telegram, setTelegram] = useState("");
  const [devBuy, setDevBuy] = useState("0.0002");
  const [buyTax, setBuyTax] = useState(0);
  const [sellTax, setSellTax] = useState(0);
  const [taxRecipient, setTaxRecipient] = useState("");
  const [editableMetadata, setEditableMetadata] = useState(true);
  const [phase, setPhase] = useState("idle");
  const [runtimeLaunch, setRuntimeLaunch] = useState(() => getEventLaunch(id));
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [error, setError] = useState("");
  const [onchainResult, setOnchainResult] = useState(null);
  const wallet = useViralWallet();
  const walletAddress = wallet.address || "Connect wallet";

  useEffect(() => {
    if (wallet.address && !taxRecipient) setTaxRecipient(wallet.address);
  }, [taxRecipient, wallet.address]);

  useEffect(() => subscribeLaunchState(() => setRuntimeLaunch(getEventLaunch(id))), [id]);

  useEffect(() => {
    if (runtimeLaunch?.status === "RESERVED" && phase === "idle") {
      setStep(3);
      setPhase("awaiting_signature");
    }
  }, [phase, runtimeLaunch]);

  useEffect(() => {
    if (runtimeLaunch?.status !== "RESERVED") return undefined;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((runtimeLaunch.reservedUntil - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [runtimeLaunch]);

  useEffect(() => {
    if (runtimeLaunch?.status === "RESERVED" && secondsLeft === 0) {
      releaseEvent(signal?.id || id);
      setRuntimeLaunch(null);
      setPhase("idle");
      setStep(2);
      setError("Reservation expired. The event is available again.");
    }
  }, [id, runtimeLaunch, secondsLeft, signal?.id]);

  const pairResults = useMemo(() => {
    const term = pairQuery.toLowerCase().trim();
    return pairAssets.filter((asset) => !term || `${asset.symbol} ${asset.name} ${asset.sector}`.toLowerCase().includes(term));
  }, [pairQuery]);

  if (!signal) return <div className="max-w-3xl mx-auto px-4 py-32 text-center"><p className="text-secondarytext">Viral Event not found.</p><Button as={Link} to="/live" variant="outline" className="mt-4">Back to Live</Button></div>;

  // Signal provenance is metadata, not a contract-level uniqueness gate.
  // The same signal may seed another market if a creator intentionally relaunches it.
  const alreadyLaunched = false;
  const topMatch = signal.pairRecommendations.find((pair) => pair.symbol === selectedPair);

  const prepareLaunch = async () => {
    setError("");
    if (!wallet.isConnected) {
      try { await wallet.connect(); } catch (walletError) { setError(walletError.message); }
      return;
    }
    if (!wallet.isCorrectNetwork) {
      try { await wallet.switchNetwork(); } catch (walletError) { setError(walletError.message); }
      return;
    }
    if (selectedPair !== "ETH") {
      setError("The live testnet route currently supports ETH. Choose ETH to submit onchain; RWA recommendations remain previews until their reference pools are registered.");
      return;
    }
    if (buyTax !== sellTax) {
      setError("Protocol v1 uses one shared creator fee on buys and sells. Set both fee controls to the same value before launching.");
      return;
    }
    if (getEventLaunch(signal.id)?.status === "LAUNCHED") releaseEvent(signal.id);
    const reservation = reserveEvent(signal.id, walletAddress, 90000);
    if (!reservation.ok) {
      setError(reservation.reason === "already_launched" ? "This exact event has already been launched." : "Another wallet is currently launching this event.");
      return;
    }
    setRuntimeLaunch(reservation.record);
    setStep(3);
    setPhase("awaiting_signature");
  };

  const approveWallet = async () => {
    setError("");
    setPhase("submitting");
    try {
      const result = await wallet.launchWithEth({
        name,
        symbol: ticker,
        logo: image,
        description,
        website,
        twitter: xLink,
        telegram,
        creatorFeeRecipient: taxRecipient || wallet.address,
        creatorFeePercent: buyTax,
        openingBuyEth: devBuy || "0",
      });
      const tokenId = (ticker || `viral-${signal.id}`).toLowerCase().replace(/[^a-z0-9]/g, "");
      const record = confirmLaunch(signal.id, {
        tokenId,
        tokenName: name,
        ticker,
        description,
        image,
        selectedPair,
        pairMatchScore: topMatch?.score ?? null,
        creatorWallet: walletAddress,
        launchId: signal.viralEventId,
        tokenAddress: result.tokenAddress,
        txHash: result.hash,
        poolId: result.poolId,
      });
      setOnchainResult(result);
      setRuntimeLaunch(record);
      setPhase("success");
    } catch (walletError) {
      releaseEvent(signal.id);
      setRuntimeLaunch(null);
      setError(walletError?.shortMessage || walletError?.message || "The testnet transaction failed.");
      setPhase("idle");
      setStep(2);
    }
  };

  const rejectWallet = () => {
    releaseEvent(signal.id);
    setRuntimeLaunch(null);
    setPhase("idle");
    setStep(2);
    setError("Wallet request rejected. The event is available again.");
  };

  if (alreadyLaunched && phase !== "success") {
    const launch = runtimeLaunch || { tokenId: signal.tokenId, selectedPair: signal.selectedPair, pairMatchScore: signal.pairRecommendations[0].score };
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 border border-primary bg-primary/[0.04] flex items-center justify-center mx-auto"><Check size={24} className="text-primary" /></div>
        <div className="text-xs text-primary tracking-[0.16em] font-semibold mt-6">LAUNCHED ✓</div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] mt-3">This event already has a market.</h1>
        <p className="text-secondarytext mt-4">ViralTerminal allows one launch for each exact source post. Its provenance is permanently preserved.</p>
        <div className="grid grid-cols-2 gap-px bg-border border border-border mt-8 text-left">
          <SummaryCell label="Event" value={signal.viralEventId} />
          <SummaryCell label="Pair" value={launch.selectedPair || signal.pairRecommendations[0].symbol} accent />
          <SummaryCell label="Viral score" value={signal.viralScore.toFixed(1)} />
          <SummaryCell label="AI match" value={`${launch.pairMatchScore || signal.pairRecommendations[0].score}%`} />
        </div>
        <Button as={Link} to={launch.tokenAddress ? `/token/live?address=${launch.tokenAddress}` : `/token/${launch.tokenId}`} size="lg" className="mt-6">View live market <ArrowRight size={15} /></Button>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 border border-primary bg-primary/[0.04] flex items-center justify-center mx-auto animate-flare-fade"><Check size={28} className="text-primary" /></div>
        <div className="text-xs text-primary tracking-[0.16em] font-semibold mt-6">CONFIRMED ON ROBINHOOD CHAIN</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.05em] mt-3">The moment is now a market.</h1>
        <p className="text-secondarytext mt-4">${ticker} / {selectedPair} is live and linked to {signal.viralEventId}.</p>
        <div className="border border-border bg-card mt-8 text-left">
          <div className="p-4 flex items-center gap-4 border-b border-border"><SafeImage src={image} alt="" className="w-14 h-14 border border-border shrink-0" /><div><div className="font-semibold text-lg">{name}</div><div className="font-mono text-sm text-primary">${ticker} / {selectedPair}</div></div></div>
          <div className="grid sm:grid-cols-2 gap-px bg-border">
            <SummaryCell label="Viral origin" value={signal.viralEventId} />
            <SummaryCell label="Viral score at launch" value={signal.viralScore.toFixed(1)} />
            <SummaryCell label="AI pair match" value={topMatch ? `${selectedPair} — ${topMatch.score}%` : `${selectedPair} — manual`} accent />
            <SummaryCell label="Creator wallet" value={walletAddress} />
          </div>
        </div>
        {(onchainResult?.tokenAddress || runtimeLaunch?.tokenAddress) && <a href={explorerUrl("address", onchainResult?.tokenAddress || runtimeLaunch.tokenAddress)} target="_blank" rel="noreferrer" className="block mt-5 font-mono text-xs text-primary hover:underline">View token contract</a>}
        {(onchainResult?.hash || runtimeLaunch?.txHash) && <a href={explorerUrl("tx", onchainResult?.hash || runtimeLaunch.txHash)} target="_blank" rel="noreferrer" className="block mt-2 font-mono text-xs text-secondarytext hover:text-primary">View confirmed transaction</a>}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7"><Button as={Link} to={`/token/live?address=${runtimeLaunch.tokenAddress}`} size="lg">Trade live market <ArrowRight size={15} /></Button><Button as="a" href={explorerUrl("address", runtimeLaunch.tokenAddress)} target="_blank" rel="noreferrer" variant="outline" size="lg">View contract</Button><Button as={Link} to="/live" variant="outline" size="lg">Return to Live</Button></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1460px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-mutedtext hover:text-foreground mb-5"><ArrowLeft size={14} /> Event intelligence</button>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div><div className="flex items-center gap-2 text-xs text-primary tracking-[0.14em]"><Lock size={12} /> VERIFIED TESTNET LAUNCH</div><h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-[-0.045em] mt-2">Launch {signal.viralEventId}</h1><p className="text-sm text-secondarytext mt-2">Match the narrative, configure the token, then sign the ViralTerminal protocol transaction.</p></div>
        {runtimeLaunch?.status === "RESERVED" && <div className="border border-border bg-deep px-4 py-3"><div className="text-[10px] text-mutedtext tracking-[0.14em]">EVENT RESERVED</div><div className="font-mono text-sm mt-1">{secondsLeft}s remaining</div></div>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5">
        <main>
          <div className="border border-border bg-card rounded-sm">
            <div className="grid grid-cols-4 border-b border-border">
              {steps.map((label, index) => <button key={label} onClick={() => phase === "idle" && index <= 2 && setStep(index)} className={cn("px-2 sm:px-4 py-3 text-left border-r border-border last:border-r-0 transition-colors", step === index ? "bg-elevated" : "bg-deep/40")}><div className={cn("font-mono text-[10px]", step === index || index < step ? "text-primary" : "text-mutedtext")}>0{index + 1}</div><div className={cn("hidden sm:block text-xs mt-1", step === index ? "text-foreground" : "text-mutedtext")}>{label}</div></button>)}
            </div>

            <div className="p-5 sm:p-7 min-h-[510px]">
              {step === 0 && (
                <div>
                  <div className="flex items-end justify-between gap-4 mb-5"><div><SectionLabel>AI recommended</SectionLabel><p className="text-sm text-secondarytext mt-1">Four independent relevance scores from the current active catalog.</p></div><div className="text-[10px] text-mutedtext">Catalog snapshot {pairCatalog.lastSynced}</div></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {signal.pairRecommendations.map((pair, index) => <PairCard key={pair.symbol} pair={pair} index={index} best={index === 0} selected={selectedPair === pair.symbol} onClick={() => setSelectedPair(pair.symbol)} />)}
                  </div>
                  <button onClick={() => setShowAllPairs(!showAllPairs)} className="w-full mt-4 border border-border h-11 flex items-center justify-between px-4 text-sm text-secondarytext hover:text-foreground hover:border-border-strong"><span>Browse all {pairCatalog.activeCount} active pairs</span><ChevronRight size={15} className={cn("transition-transform", showAllPairs && "rotate-90")} /></button>
                  {showAllPairs && <div className="mt-3 border border-border"><div className="p-3 border-b border-border"><label className="h-9 border border-border bg-deep flex items-center gap-2 px-3"><Search size={13} className="text-mutedtext" /><input value={pairQuery} onChange={(event) => setPairQuery(event.target.value)} placeholder="Search symbol, asset or sector" className="bg-transparent outline-none text-xs w-full" /></label></div><div className="max-h-64 overflow-y-auto grid sm:grid-cols-2">{pairResults.map((asset) => <button key={asset.symbol} onClick={() => setSelectedPair(asset.symbol)} className={cn("flex items-center gap-2.5 text-left px-3 py-2.5 border-b border-r border-border hover:bg-elevated", selectedPair === asset.symbol && "bg-primary/[0.05] text-primary")}><PairAssetLogo symbol={asset.symbol} size={30} /><span className="min-w-0"><span className="font-mono text-sm font-semibold block">{asset.symbol}</span><span className="text-xs text-mutedtext block truncate">{asset.name}</span></span></button>)}</div></div>}
                  <div className="mt-5 border border-border bg-deep/60 p-4 flex items-start gap-3"><div className="w-5 h-5 rounded-full border border-secondarytext text-[11px] flex items-center justify-center shrink-0">i</div><div><div className="text-xs font-medium">Next up</div><p className="text-[11px] text-mutedtext mt-1">In Step 02 you’ll configure project links, dev buy, tax configuration, and editable metadata.</p></div></div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-5"><Sparkles size={15} className="text-primary" /><SectionLabel>AI token concepts</SectionLabel></div>
                  <div className="grid sm:grid-cols-3 gap-3 mb-6">{suggestions.map((suggestion) => <button key={suggestion.ticker} onClick={() => { setName(suggestion.name); setTicker(suggestion.ticker); }} className={cn("text-left border p-3", ticker === suggestion.ticker ? "border-primary bg-primary/[0.04]" : "border-border hover:border-border-strong")}><div className="text-sm font-semibold line-clamp-1">{suggestion.name}</div><div className="font-mono text-xs text-primary mt-1">${suggestion.ticker}</div></button>)}</div>
                  <div className="grid sm:grid-cols-[1.6fr_.7fr] gap-4"><Field label="Token name"><input className="terminal-input" value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Ticker"><input className="terminal-input font-mono uppercase" value={ticker} maxLength={10} onChange={(event) => setTicker(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} /></Field></div>
                  <Field label="Description" className="mt-4"><textarea className="terminal-input min-h-28 resize-none" value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
                  <div className="mt-4 grid sm:grid-cols-[140px_1fr] gap-4"><SafeImage src={image} alt="" className="w-full aspect-square border border-border" /><div className="border border-dashed border-border-strong min-h-28 flex flex-col items-center justify-center text-center p-4"><Sparkles size={18} className="text-primary" /><div className="text-sm mt-2">Source crop selected</div><div className="text-xs text-mutedtext mt-1">Image generation and upload are simulated in this prototype.</div></div></div>
                  <div className="mt-6 pt-5 border-t border-border"><div className="flex items-center gap-2 mb-3"><Globe2 size={14} className="text-primary" /><SectionLabel>Project links</SectionLabel></div><div className="grid md:grid-cols-3 gap-3"><Field label="Website"><div className="relative"><input className="terminal-input pr-24 text-xs" value={website} onChange={(event) => setWebsite(event.target.value)} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] border border-border px-1.5 py-0.5 text-mutedtext">FROM SIGNAL</span></div></Field><Field label="X / Twitter"><input className="terminal-input text-xs" value={xLink} onChange={(event) => setXLink(event.target.value)} placeholder="https://x.com/yourproject" /></Field><Field label="Telegram"><input className="terminal-input text-xs" value={telegram} onChange={(event) => setTelegram(event.target.value)} placeholder="https://t.me/yourproject" /></Field></div></div>
                  <div className="mt-6 pt-5 border-t border-border"><div className="flex items-center gap-2 mb-3"><ShieldCheck size={14} className="text-primary" /><SectionLabel>Launch options</SectionLabel></div><div className="space-y-3"><ConfigOption title="Creator Buy" description="Optional ETH purchase included atomically with the testnet launch."><div className="flex flex-wrap items-center gap-2"><div className="relative w-36"><input type="number" min="0" step="0.0001" className="terminal-input pr-10 font-mono" value={devBuy} onChange={(event) => setDevBuy(event.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mutedtext">ETH</span></div>{["0", "0.0001", "0.0002", "0.0005"].map((value) => <button key={value} onClick={() => setDevBuy(value)} className={cn("h-10 px-3 border text-xs font-mono", devBuy === value ? "border-primary text-primary bg-primary/[0.04]" : "border-border text-mutedtext")}>{value}</button>)}</div></ConfigOption><ConfigOption title="Creator fee" description="Protocol v1 applies one shared creator fee to buys and sells. Set both controls equally."><div className="space-y-4 w-full"><div className="grid sm:grid-cols-2 gap-4"><TaxSlider value={buyTax} setValue={setBuyTax} label="Buy fee" /><TaxSlider value={sellTax} setValue={setSellTax} label="Sell fee" /></div><Field label="Fee recipient"><input className="terminal-input text-xs font-mono" value={taxRecipient} onChange={(event) => setTaxRecipient(event.target.value)} /></Field></div></ConfigOption><ConfigOption title="Editable metadata after launch" description="Profile preference for future metadata services; core token and pool parameters remain immutable."><div className="flex items-center gap-2"><Switch checked={editableMetadata} onCheckedChange={setEditableMetadata} /><span className="text-xs text-secondarytext">{editableMetadata ? "Enabled" : "Disabled"}</span></div></ConfigOption></div></div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <SectionLabel>Launch review</SectionLabel>
                  <div className="border border-border mt-3 max-w-4xl"><div className="p-3 flex items-start gap-3 border-b border-border"><SafeImage src={image} alt="" className="w-12 h-12 border border-border shrink-0" /><div className="min-w-0"><div className="text-base font-semibold">{name || "Untitled token"}</div><div className="font-mono text-xs text-primary mt-0.5">${ticker || "TICKER"} / {selectedPair}</div><p className="text-[11px] text-mutedtext mt-1 line-clamp-1">{description}</p></div></div><div className="grid sm:grid-cols-3 gap-px bg-border"><SummaryCell compact label="Source event" value={signal.viralEventId} /><SummaryCell compact label="Pair" value={selectedPair} accent /><SummaryCell compact label="AI match" value={topMatch ? `${topMatch.score}% · ${topMatch.reason}` : "Manual pair selection"} /><SummaryCell compact label="Creator / signer" value={walletAddress} /><SummaryCell compact label="Website" value={website || "—"} accent /><SummaryCell compact label="X / Twitter" value={xLink || "—"} /><SummaryCell compact label="Telegram" value={telegram || "—"} /><SummaryCell compact label="Creator Buy" value={`${devBuy || "0"} ETH`} /><SummaryCell compact label="Creator fee" value={`${buyTax}% / ${sellTax}%`} /><SummaryCell compact label="Fee recipient" value={taxRecipient || walletAddress} /><SummaryCell compact label="Metadata preference" value={editableMetadata ? "Editable profile" : "Fixed profile"} /><SummaryCell compact label="Creation fee" value="0.001 ETH" /></div></div>
                  <div className="mt-4 border border-border bg-deep p-4 flex items-start gap-3"><AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" /><div><div className="text-sm font-medium">ViralTerminal protocol · Robinhood Testnet</div><p className="text-xs text-mutedtext leading-relaxed mt-1">ETH launches and the optional Creator Buy execute atomically through the verified ViralTerminal router. Launch status is saved only after the receipt confirms.</p></div></div>
                  {error && <div className="mt-4 text-xs text-destructive border border-destructive/30 bg-destructive/[0.05] px-3 py-2.5">{error}</div>}
                </div>
              )}

              {step === 3 && (
                <WalletStage phase={phase} secondsLeft={secondsLeft} onApprove={approveWallet} onReject={rejectWallet} />
              )}
            </div>

            {step < 3 && <div className="border-t border-border p-4 flex items-center justify-between"><Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft size={14} /> Back</Button>{step < 2 ? <Button onClick={() => setStep(step + 1)} disabled={step === 1 && (!name || !ticker)}>Continue <ArrowRight size={14} /></Button> : <Button onClick={prepareLaunch} disabled={!name || !ticker || !selectedPair}>Reserve & prepare launch <Lock size={14} /></Button>}</div>}
          </div>
        </main>

        <aside className="space-y-4">
          <div className="border border-border bg-card p-4 xl:sticky xl:top-20">
            <SectionLabel>Source event</SectionLabel>
            <SafeImage src={signal.thumb} alt="" className="block w-full aspect-video border border-border mt-3" />
            <div className="flex items-center gap-2 mt-3"><PlatformIcon platform={signal.platform} size={13} /><span className="text-xs text-secondarytext">{signal.creator}</span></div>
            <h2 className="text-sm font-semibold leading-snug mt-2">{signal.title}</h2>
            <div className="grid grid-cols-2 gap-px bg-border border border-border mt-4"><SummaryCell label="Viral score" value={signal.viralScore.toFixed(1)} accent /><SummaryCell label="Velocity" value={`+${signal.velocity}%`} /></div>
            <div className="mt-4 pt-4 border-t border-border"><SectionLabel>Selected pair</SectionLabel><div className="flex items-center justify-between gap-3 mt-2"><div className="flex items-center gap-2.5 min-w-0"><PairAssetLogo symbol={selectedPair} size={38} className={topMatch === signal.pairRecommendations[0] ? "border-primary/40" : ""} /><div className="min-w-0"><div className="font-mono text-xl font-semibold">{selectedPair}</div><div className="text-xs text-mutedtext truncate">{pairAssets.find((asset) => asset.symbol === selectedPair)?.name}</div></div></div><div className={cn("font-mono-nums font-semibold", topMatch === signal.pairRecommendations[0] ? "text-primary" : "text-foreground")}>{topMatch ? `${topMatch.score}%` : "MANUAL"}</div></div>{topMatch && <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden"><div className={cn("h-full rounded-full", topMatch === signal.pairRecommendations[0] ? "bg-primary" : "bg-foreground/40")} style={{ width: `${topMatch.score}%` }} /></div>}</div>
            <div className="mt-5 flex items-start gap-2 text-[11px] text-mutedtext leading-relaxed"><ShieldCheck size={13} className="text-primary shrink-0" />The client reads live protocol economics, simulates the transaction, and waits for a confirmed Robinhood Testnet receipt.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PairCard({ pair, index, best, selected, onClick }) {
  return (
    <button onClick={onClick} className={cn("p-4 border text-left transition-colors", selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-border-strong")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PairAssetLogo symbol={pair.symbol} size={42} className={best ? "border-primary/45" : ""} />
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="font-mono text-lg font-semibold">{pair.symbol}</span>{best && <span className="text-[9px] font-semibold tracking-[0.12em] text-primary">BEST MATCH</span>}</div>
            <div className="text-xs text-secondarytext truncate">{pair.name}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("font-mono-nums text-2xl font-semibold leading-none", best ? "text-primary" : "text-foreground")}>{pair.score}%</div>
          <div className="mt-1 text-[10px] text-mutedtext">0–100</div>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"><div className={cn("h-full rounded-full", best ? "bg-primary" : "bg-foreground/35")} style={{ width: `${pair.score}%` }} /></div>
      <p className="text-xs text-mutedtext mt-3 leading-relaxed">{pair.reason}</p>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.11em]"><span className="text-mutedtext">Rank 0{index + 1}</span><span className={selected ? "text-primary" : "text-secondarytext"}>{selected ? "Selected" : "Select pair"}</span></div>
    </button>
  );
}

function WalletStage({ phase, secondsLeft, onApprove, onReject }) {
  const preparing = phase === "preparing";
  const submitting = phase === "submitting";
  return <div className="max-w-lg mx-auto py-8 text-center"><div className="w-14 h-14 border border-border bg-deep flex items-center justify-center mx-auto">{preparing || submitting ? <Loader2 size={23} className="animate-spin text-primary" /> : <Wallet size={23} className="text-primary" />}</div><SectionLabel className="block mt-6">{preparing ? "READING PROTOCOL CONFIG" : submitting ? "CONFIRMING ONCHAIN" : "AWAITING WALLET SIGNATURE"}</SectionLabel><h2 className="text-2xl font-semibold tracking-[-0.03em] mt-2">{preparing ? "Building the launch plan" : submitting ? "Transaction submitted" : "Approve the simulated transaction"}</h2><p className="text-sm text-secondarytext leading-relaxed mt-3">{preparing ? "ViralTerminal is validating the pair and current launch configuration." : submitting ? "The interface records this launch only after the receipt confirms." : "Your wallet remains the creator and signer. ViralTerminal never requests or stores a private key."}</p><div className="font-mono text-xs text-mutedtext mt-5 flex items-center justify-center gap-2"><Clock3 size={12} /> Session reservation expires in {secondsLeft}s</div>{phase === "awaiting_signature" && <div className="grid sm:grid-cols-2 gap-3 mt-7"><Button variant="outline" onClick={onReject}>Reject</Button><Button onClick={onApprove}>Approve in wallet <ExternalLink size={14} /></Button></div>}</div>;
}

function Field({ label, children, className = "" }) {
  return <label className={className}><span className="text-[10px] uppercase tracking-[0.14em] text-mutedtext block mb-1.5">{label}</span>{children}</label>;
}

function SummaryCell({ label, value, accent = false, compact = false }) {
  return <div className={cn("bg-deep min-w-0", compact ? "px-3 py-2" : "px-3 py-3")}><span className="text-[9px] uppercase tracking-[0.13em] text-mutedtext block">{label}</span><span className={cn(compact ? "text-xs mt-1" : "text-sm mt-1.5", "block truncate", accent ? "text-primary font-mono" : "text-foreground")}>{value}</span></div>;
}

function ConfigOption({ title, description, children }) {
  return <div className="border border-border bg-deep/35 p-4 flex flex-col md:flex-row md:items-center gap-4"><div className="md:w-56 shrink-0"><div className="text-sm font-medium">{title}</div><p className="text-[11px] text-mutedtext mt-1 leading-relaxed">{description}</p></div><div className="flex-1 min-w-0">{children}</div></div>;
}

function TaxSlider({ value, setValue, label }) {
  return <div><div className="flex items-center justify-between mb-2"><span className="text-[10px] uppercase tracking-[0.14em] text-mutedtext">{label}</span><span className="font-mono text-sm text-primary">{value.toFixed(1)}%</span></div><input aria-label={label} type="range" min="0" max="10" step="0.5" value={value} onChange={(event) => setValue(Number(event.target.value))} className="range-control" style={{ "--range-progress": `${value * 10}%` }} /><div className="flex items-center justify-between text-[9px] font-mono text-mutedtext mt-2"><span>0%</span><span>5%</span><span>10%</span></div></div>;
}
