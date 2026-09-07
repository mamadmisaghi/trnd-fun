"use client";
import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  Globe2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Send,
  ShieldCheck,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import Button from "@/components/viral/Button";
import PairAssetLogo from "@/components/viral/PairAssetLogo";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { SectionLabel } from "@/components/viral/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { creatorProgram, getCreator, pairAssets, pairCatalog } from "@/data";
import { cn } from "@/lib/utils";
import { explorerUrl, getTestnetPair } from "@/lib/protocol/robinhood-testnet";
import { shortAddress, useViralWallet } from "@/lib/protocol/ViralWalletProvider";
import { confirmManualLaunch } from "@/lib/launchState";

const factorySnapshot = {
  creationFee: "0.001 ETH",
  fixedSupply: "1B",
  openingFdv: "≈ $4.0K",
  poolModel: "Locked pool",
};

const pairGroups = [
  { label: "NATIVE & STABLE", test: (asset) => asset.type === "CRYPTO" || asset.type === "STABLE" },
  { label: "STOCK TOKENS", test: (asset) => asset.type === "STOCK" },
  { label: "MARKET INDEXES", test: (asset) => asset.type === "INDEX" },
];

export default function Create() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [pair, setPair] = useState("ETH");
  const [pairOpen, setPairOpen] = useState(false);
  const [image, setImage] = useState("");
  const [website, setWebsite] = useState("");
  const [xLink, setXLink] = useState("");
  const [telegram, setTelegram] = useState("");
  const [devBuyEnabled, setDevBuyEnabled] = useState(false);
  const [devBuyPercent, setDevBuyPercent] = useState(5);
  const [devBuyAmount, setDevBuyAmount] = useState("");
  const [creatorFeeEnabled, setCreatorFeeEnabled] = useState(false);
  const [creatorBuyFee, setCreatorBuyFee] = useState(1);
  const [creatorSellFee, setCreatorSellFee] = useState(1);
  const [feeWalletEnabled, setFeeWalletEnabled] = useState(false);
  const [feeWallet, setFeeWallet] = useState("");
  const [editableMetadata, setEditableMetadata] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataKey, setMetadataKey] = useState("");
  const [metadataValue, setMetadataValue] = useState("");
  const [phase, setPhase] = useState("idle");
  const [launchError, setLaunchError] = useState("");
  const [launchResult, setLaunchResult] = useState(null);
  const [addressSeed, setAddressSeed] = useState(1);
  const wallet = useViralWallet();
  const walletConnected = wallet.isConnected;

  const selectedPair = useMemo(
    () => pairAssets.find((asset) => asset.symbol === pair) ?? pairAssets[0],
    [pair],
  );
  const identityComplete = Boolean(name.trim() && ticker.trim() && selectedPair);
  const tokenLetter = (ticker || name || "V").trim().charAt(0).toUpperCase();
  const previewAddress = `0x${(71 + addressSeed).toString(16)}a4…${ticker ? ticker.slice(0, 2).toLowerCase() : "vt"}01`;
  const attributedCreator = getCreator(searchParams.get("creator"));

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (image) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
  };

  const prepareLaunch = async () => {
    setLaunchError("");
    if (!wallet.isConnected) {
      try { await wallet.connect(); } catch (error) { setLaunchError(error.message); }
      return;
    }
    if (!wallet.isCorrectNetwork) {
      try { await wallet.switchNetwork(); } catch (error) { setLaunchError(error.message); }
      return;
    }
    if (!getTestnetPair(selectedPair.symbol)) {
      setLaunchError(`${selectedPair.symbol} is available in the product catalog but not enabled on this testnet deployment. Choose ETH, USDG, or TSLA.`);
      return;
    }
    if (creatorFeeEnabled && creatorBuyFee !== creatorSellFee) {
      setLaunchError("Protocol v1 uses one shared creator fee on both buys and sells. Set the two controls to the same value before launching.");
      return;
    }
    setPhase("signature");
  };

  const confirmLaunch = async () => {
    setLaunchError("");
    setPhase("submitting");
    try {
      const result = await wallet.launchWithPair({
        pairSymbol: selectedPair.symbol,
        name,
        symbol: ticker,
        logo: image,
        description,
        website,
        twitter: xLink,
        telegram,
        creatorFeeRecipient: feeWalletEnabled ? feeWallet : wallet.address,
        creatorFeePercent: creatorFeeEnabled ? creatorBuyFee : 0,
        openingBuyAmount: devBuyEnabled ? devBuyAmount || "0" : "0",
      });
      confirmManualLaunch({
        tokenId: (ticker || "token").toLowerCase().replace(/[^a-z0-9]/g, ""),
        tokenName: name,
        ticker,
        description,
        image,
        selectedPair: selectedPair.symbol,
        creatorWallet: wallet.address,
        tokenAddress: result.tokenAddress,
        txHash: result.hash,
        poolId: result.poolId,
      });
      setLaunchResult(result);
      setPhase("success");
    } catch (error) {
      setLaunchError(error?.shortMessage || error?.message || "The testnet transaction failed.");
      setPhase("signature");
    }
  };

  if (phase === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="w-16 h-16 border border-primary/60 bg-primary/[0.06] rounded-full flex items-center justify-center mx-auto">
          <Check size={26} className="text-primary" />
        </div>
        <div className="text-xs tracking-[0.16em] text-primary mt-7">LAUNCH CONFIRMED</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.05em] mt-3">
          ${ticker} / {selectedPair.symbol}
        </h1>
        <p className="text-secondarytext mt-4 max-w-lg mx-auto leading-relaxed">
          The token and its paired market are now represented in the ViralTerminal prototype. Production launch status will only finalize after onchain confirmation.
        </p>
        <div className="grid sm:grid-cols-3 border border-border mt-8 text-left">
          <ResultCell label="PAIR" value={selectedPair.symbol} />
          <ResultCell label="SUPPLY" value={factorySnapshot.fixedSupply} />
          <ResultCell label="POOL" value="LOCKED" />
        </div>
        {launchResult?.tokenAddress && <a href={explorerUrl("address", launchResult.tokenAddress)} target="_blank" rel="noreferrer" className="block mt-5 font-mono text-xs text-primary hover:underline">Token {launchResult.tokenAddress}</a>}
        {launchResult?.hash && <a href={explorerUrl("tx", launchResult.hash)} target="_blank" rel="noreferrer" className="block mt-2 font-mono text-xs text-secondarytext hover:text-primary">View confirmed transaction</a>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button as={Link} to={`/token/live?address=${launchResult?.tokenAddress || ""}`} size="lg">Trade live market <ArrowRight size={15} /></Button>
          <Button as={Link} to="/live" variant="outline" size="lg">Return to Live</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 border-b border-border pb-7">
        <div>
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-primary uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Manual launch
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.05em] mt-3">Launch a token</h1>
          <p className="text-sm sm:text-base text-secondarytext mt-3 max-w-2xl leading-relaxed">
            Create a fixed-supply token and open its paired market through the ViralTerminal protocol on Robinhood Chain.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-mutedtext">
          <Database size={14} className="text-primary" />
          <span>Protocol pair catalog</span>
          <span className="font-mono-nums text-foreground">{pairCatalog.lastSynced}</span>
        </div>
      </header>

      {attributedCreator && (
        <div className="mt-5 rounded-md border border-primary/25 bg-primary/[0.035] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-md border border-primary/20 bg-deep flex items-center justify-center shrink-0"><UserPlus size={16} className="text-primary" /></div>
          <img src={attributedCreator.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border-strong shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold"><span>Creating with {attributedCreator.name}</span><PlatformIcon platform={attributedCreator.platform} size={13} className="text-primary" /></div>
            <p className="mt-1 text-xs text-mutedtext">This launch will be attributed to {attributedCreator.handle}. The creator receives {creatorProgram.creatorShare}% of creator-fee revenue generated by this market.</p>
          </div>
          <Link to={`/creator/${attributedCreator.id}`} className="text-xs text-primary hover:underline whitespace-nowrap">View creator</Link>
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_390px] gap-7 xl:gap-10 mt-8">
        <main className="min-w-0 space-y-10">
          <LaunchSection number="01" title="Token identity">
            <div className="grid md:grid-cols-[180px_minmax(0,1fr)] gap-5">
              <label className="group h-[180px] border border-dashed border-border-strong bg-card rounded-md flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden">
                {image ? (
                  <img src={image} alt="Token logo preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center px-4">
                    <ImagePlus size={25} className="text-primary mx-auto" />
                    <div className="text-sm font-medium mt-3">Token logo</div>
                    <div className="text-xs text-mutedtext mt-1.5">Square PNG or JPG</div>
                    <div className="text-[10px] tracking-wider text-secondarytext mt-4 group-hover:text-primary">CHOOSE FILE</div>
                  </div>
                )}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={chooseImage} />
              </label>

              <div className="space-y-5">
                <Field label="Token name" required help="The public name shown across the market.">
                  <input value={name} onChange={(event) => setName(event.target.value)} className="terminal-input h-12" placeholder="Token name" maxLength={48} />
                </Field>
                <Field label="Token symbol" required help="Up to 10 letters or numbers.">
                  <div className="relative">
                    <input
                      value={ticker}
                      onChange={(event) => setTicker(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      className="terminal-input h-12 pr-20 font-mono"
                      maxLength={10}
                      placeholder="TOKEN"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-mutedtext">{ticker.length}/10</span>
                  </div>
                </Field>
              </div>
            </div>

            <Field label="Paired asset" required help="This is the actual quote asset for the market, not a decorative category.">
              <button
                type="button"
                onClick={() => setPairOpen(true)}
                className="w-full h-14 px-4 border border-border-strong bg-card rounded-md flex items-center gap-3 text-left hover:border-primary/55 transition-colors"
              >
                <PairAssetLogo symbol={selectedPair.symbol} size={34} className="border-primary/25" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-semibold">{selectedPair.symbol}</div>
                  <div className="text-xs text-mutedtext truncate">{selectedPair.name} · {selectedPair.sector}</div>
                </div>
                <span className="hidden sm:inline text-[10px] tracking-[0.12em] text-mutedtext">CURRENT PROTOCOL CATALOG</span>
                <ChevronDown size={15} className="text-mutedtext" />
              </button>
              <div className="flex items-center justify-between gap-4 mt-2 text-xs text-mutedtext">
                <span>Creation fee · current configuration</span>
                <span className="font-mono-nums text-foreground">{factorySnapshot.creationFee}</span>
              </div>
            </Field>

            <Field label="Description" help="A concise public explanation of the token and its market.">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="terminal-input min-h-32 resize-y leading-relaxed"
                placeholder="What is this token about?"
                maxLength={520}
              />
              <div className="text-right font-mono text-[10px] text-mutedtext mt-1.5">{description.length}/520</div>
            </Field>

            <div>
              <FieldLabel label="Project links" help="Optional public links shown on the token profile." />
              <div className="grid gap-2.5">
                <LinkInput icon={Globe2} value={website} onChange={setWebsite} placeholder="https://yourproject.xyz" label="Website" />
                <LinkInput icon={() => <span className="font-semibold text-sm">𝕏</span>} value={xLink} onChange={setXLink} placeholder="https://x.com/yourproject" label="X profile" />
                <LinkInput icon={Send} value={telegram} onChange={setTelegram} placeholder="https://t.me/yourproject" label="Telegram" />
              </div>
            </div>

            <div className="border border-border bg-card rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-9 h-9 rounded-md bg-elevated border border-border flex items-center justify-center shrink-0">
                <Zap size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Prepared token address</span>
                  <InfoHint text="Production address preview is generated by the launch preparation flow." />
                </div>
                <div className="font-mono text-xs text-mutedtext mt-1 truncate">
                  {walletConnected ? previewAddress : "Connect wallet to generate a launch address preview"}
                </div>
              </div>
              <button
                type="button"
                disabled={!walletConnected}
                onClick={() => setAddressSeed((value) => value + 1)}
                className="h-9 px-3 border border-border-strong rounded-md text-xs text-secondarytext hover:text-primary hover:border-primary/50 disabled:opacity-35 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <RefreshCcw size={13} /> Refresh
              </button>
            </div>
          </LaunchSection>

          <LaunchSection number="02" title="Creator Buy / Dev Buy" action={<Switch checked={devBuyEnabled} onCheckedChange={setDevBuyEnabled} aria-label="Creator Buy enabled" />}>
            <RevealPanel open={devBuyEnabled}>
              <p className="text-xs text-mutedtext max-w-2xl leading-relaxed">Optionally buy your own token at launch. The prepared flow will include this configuration when supported by the active launch route.</p>
              <div className="border border-border bg-card rounded-md p-4 mt-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex rounded-md border border-border p-1 bg-deep"><span className="px-4 py-2 text-xs rounded-sm bg-foreground text-background">Buy with {selectedPair.symbol}</span></div>
                  <div className="grid grid-cols-4 gap-2 lg:ml-auto">{[1, 2, 5, 10].map((percent) => <button key={percent} onClick={() => setDevBuyPercent(percent)} className={cn("h-9 min-w-14 border text-xs font-mono rounded-sm", devBuyPercent === percent ? "border-primary bg-primary text-primary-foreground" : "border-border text-mutedtext hover:text-foreground")}>{percent}%</button>)}</div>
                </div>
                <div className="grid sm:grid-cols-[1fr_260px] gap-3 mt-4"><Field label={`Amount (${selectedPair.symbol})`}><input value={devBuyAmount} onChange={(event) => setDevBuyAmount(event.target.value)} className="terminal-input font-mono" placeholder="0.0" /></Field><div className="border border-border bg-deep px-4 py-3 text-xs text-mutedtext"><div className="text-foreground font-medium">Creator Buy in paired asset</div><div className="mt-1">Your wallet approves {selectedPair.symbol} first when it is an ERC-20 pair.</div></div></div>
              </div>
            </RevealPanel>
          </LaunchSection>

          <LaunchSection number="03" title="Creator Fee / Tax" action={<Switch checked={creatorFeeEnabled} onCheckedChange={setCreatorFeeEnabled} aria-label="Creator Fee enabled" />}>
            <RevealPanel open={creatorFeeEnabled}>
              <p className="text-xs text-mutedtext max-w-2xl leading-relaxed">Drag each control to set the creator fee for buys and sells. The destination wallet receives the configured creator share.</p>
              <div className="grid lg:grid-cols-[1fr_270px] gap-5 border border-border bg-card rounded-md p-4 mt-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <CreatorFeeSlider label="Buy fee" value={creatorBuyFee} setValue={setCreatorBuyFee} />
                  <CreatorFeeSlider label="Sell fee" value={creatorSellFee} setValue={setCreatorSellFee} />
                </div>
                <div className="border border-border bg-deep p-3 text-xs"><div className="font-medium mb-2">Fee breakdown</div><SummaryRow label="Creator buy fee" value={`${creatorBuyFee.toFixed(1)}%`} mono /><SummaryRow label="Creator sell fee" value={`${creatorSellFee.toFixed(1)}%`} mono /><SummaryRow label="Protocol fee" value="1.0%" mono /><div className="border-t border-border mt-2 pt-2"><SummaryRow label="Maximum trade fee" value={`${(1 + Math.max(creatorBuyFee, creatorSellFee)).toFixed(1)}%`} mono /></div></div>
              </div>
            </RevealPanel>
          </LaunchSection>

          <LaunchSection number="04" title="Fee destination wallet" action={<Switch checked={feeWalletEnabled} onCheckedChange={setFeeWalletEnabled} aria-label="Fee destination enabled" />}>
            <RevealPanel open={feeWalletEnabled}>
              <p className="text-xs text-mutedtext">Choose where creator fee earnings are sent. It defaults to the connected wallet.</p>
              <div className="border border-border bg-card rounded-md p-4 mt-5"><Field label="Fee wallet address"><div className="flex flex-col sm:flex-row gap-2"><input value={feeWallet} onChange={(event) => setFeeWallet(event.target.value)} className="terminal-input font-mono flex-1" placeholder="0x wallet address" /><button type="button" onClick={() => setFeeWallet(wallet.address || "")} className="h-11 px-4 border border-border-strong rounded-md text-xs hover:border-primary/40 hover:text-primary whitespace-nowrap">Use connected wallet</button></div></Field></div>
            </RevealPanel>
          </LaunchSection>

          <LaunchSection number="05" title="Metadata options">
            <OptionRow
              icon={RefreshCcw}
              title="Metadata editable after launch"
              description="Allow supported profile fields to be updated later. Token supply and pool rules stay immutable."
            >
              <Switch checked={editableMetadata} onCheckedChange={setEditableMetadata} aria-label="Metadata editable after launch" />
            </OptionRow>
            <OptionRow
              icon={Database}
              title="Onchain metadata"
              description="Attach an optional public key-value field to the token profile."
            >
              <button type="button" onClick={() => setMetadataOpen((value) => !value)} className="text-xs text-primary hover:text-primary/80">
                {metadataOpen ? "Remove" : "Add metadata"}
              </button>
            </OptionRow>
            {metadataOpen && (
              <div className="grid sm:grid-cols-2 gap-3 border border-border bg-deep rounded-md p-4 animate-flare-fade">
                <Field label="Metadata key"><input className="terminal-input" value={metadataKey} onChange={(event) => setMetadataKey(event.target.value)} placeholder="category" /></Field>
                <Field label="Metadata value"><input className="terminal-input" value={metadataValue} onChange={(event) => setMetadataValue(event.target.value)} placeholder="culture" /></Field>
              </div>
            )}

            <div className="border border-border bg-card rounded-md divide-y divide-border">
              <Fact icon={LockKeyhole}>The token and its {selectedPair.symbol} market launch together with permanently locked token-side liquidity.</Fact>
              <Fact icon={ShieldCheck}>The factory mints the configured fixed supply once. Profile editing cannot mint, pause transfers, or remove liquidity.</Fact>
              <Fact icon={Database}>Fees, supply, supported pairs, and launch parameters are read from the deployed protocol before preparation.</Fact>
              <Fact icon={Wallet}>Your connected wallet remains the creator and signer. ViralTerminal never requests or stores private keys.</Fact>
            </div>
          </LaunchSection>

          <div className="border border-border bg-primary/[0.025] p-4 flex items-start gap-3 rounded-md">
            <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-secondarytext leading-relaxed">
              Manual Launch is a secondary path and has no Viral Event provenance. To create a market from a detected post with AI pair matching, start from the <Link to="/live" className="text-primary hover:underline">Live Analyzer</Link>.
            </p>
          </div>
        </main>

        <aside className="xl:sticky xl:top-24 h-fit space-y-4">
          <div className="border border-border-strong bg-card rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <SectionLabel>Live market preview</SectionLabel>
              <span className="text-[10px] tracking-[0.14em] text-primary border border-primary/30 bg-primary/[0.04] px-2 py-1 rounded-sm">NEW</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md overflow-hidden border border-border bg-elevated flex items-center justify-center shrink-0">
                  {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-semibold text-primary">{tokenLetter}</span>}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] truncate">{name || "Your token"}</h2>
                  <div className="font-mono text-xs text-mutedtext mt-0.5">{ticker || "TOKEN"}/{selectedPair.symbol}</div>
                </div>
              </div>
              <p className={cn("text-sm leading-relaxed mt-5 min-h-10", description ? "text-secondarytext" : "text-mutedtext")}>
                {description || `Fixed-supply token trading against ${selectedPair.symbol} in a permanently locked market.`}
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-5 mt-6">
                <PreviewMetric label="OPENING FDV" value={factorySnapshot.openingFdv} note="Current factory reference" />
                <PreviewMetric label="FIXED SUPPLY" value={factorySnapshot.fixedSupply} note="Set by active config" />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <PairAssetLogo symbol={selectedPair.symbol} size={34} className="border-primary/25" />
                <span className="text-xs font-mono">{selectedPair.symbol}</span>
                <span className="ml-auto text-[10px] tracking-[0.1em] text-primary">IMMUTABLE SUPPLY</span>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card rounded-lg p-5">
            <div className="space-y-3.5">
              <SummaryRow label="Network" value="Robinhood Chain" />
              <SummaryRow label="Paired asset" value={selectedPair.symbol} mono />
              <SummaryRow label="Pool model" value={factorySnapshot.poolModel} />
              <SummaryRow label="Fixed supply" value={factorySnapshot.fixedSupply} />
              <SummaryRow label="Opening FDV" value={factorySnapshot.openingFdv} />
              <SummaryRow label="Creation fee" value={factorySnapshot.creationFee} mono />
            </div>

            <div className="border-t border-border mt-5 pt-5">
              {!walletConnected ? (
                <Button onClick={() => wallet.connect().catch((error) => setLaunchError(error.message))} className="w-full" size="lg">
                  <Wallet size={15} /> Connect wallet
                </Button>
              ) : phase === "signature" ? (
                <Button onClick={confirmLaunch} className="w-full" size="lg">
                  Confirm in wallet <ArrowRight size={15} />
                </Button>
              ) : phase === "submitting" ? (
                <Button disabled className="w-full" size="lg"><Loader2 size={15} className="animate-spin" /> Confirming onchain</Button>
              ) : (
                <Button onClick={prepareLaunch} disabled={!identityComplete || phase === "preparing"} className="w-full" size="lg">
                  {phase === "preparing" ? <><Loader2 size={15} className="animate-spin" /> Preparing launch</> : <>Prepare launch <ArrowRight size={15} /></>}
                </Button>
              )}

              <div className="mt-3 text-center">
                {walletConnected && <div className="text-[10px] text-primary tracking-[0.12em] mb-1">WALLET CONNECTED · {shortAddress(wallet.address).toUpperCase()}</div>}
                <p className="text-[11px] text-mutedtext leading-relaxed">
                  {walletConnected && !identityComplete ? "Complete token name and symbol to continue." : "You approve the prepared transaction in your wallet. Nothing is minted on button click alone."}
                </p>
                {launchError && <p className="mt-2 text-[11px] text-destructive leading-relaxed">{launchError}</p>}
              </div>
            </div>
          </div>

          <div className="border border-border bg-deep rounded-md px-4 py-3 flex gap-3">
            <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-mutedtext leading-relaxed">Current parameters are presented as a synced configuration snapshot, not permanent protocol constants.</p>
          </div>
        </aside>
      </div>

      <PairDialog open={pairOpen} onOpenChange={setPairOpen} selected={pair} onSelect={setPair} />
    </div>
  );
}

function CreatorFeeSlider({ label, value, setValue }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel label={label} help={`Applied to each token ${label.toLowerCase().replace(" fee", "")} in this prototype.`} />
        <span className="font-mono text-sm text-primary">{value.toFixed(1)}%</span>
      </div>
      <input aria-label={label} type="range" min="0" max="10" step="0.5" value={value} onChange={(event) => setValue(Number(event.target.value))} className="range-control" style={{ "--range-progress": `${value * 10}%` }} />
      <div className="flex items-center justify-between text-[10px] font-mono text-mutedtext mt-2"><span>0%</span><span>5%</span><span>10%</span></div>
    </div>
  );
}

function LaunchSection({ number, title, action, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[11px] text-primary border border-primary/25 bg-primary/[0.04] rounded-sm px-2 py-1">{number}</span>
        <h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2>
        <span className="h-px bg-border flex-1" />
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function RevealPanel({ open, children }) {
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden={!open}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function FieldLabel({ label, required = false, help }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-sm font-medium">{label}</span>
      {required && <span className="text-primary">*</span>}
      {help && <InfoHint text={help} />}
    </div>
  );
}

function Field({ label, required, help, children }) {
  return <label className="block"><FieldLabel label={label} required={required} help={help} />{children}</label>;
}

function InfoHint({ text }) {
  return <CircleHelp size={13} className="text-mutedtext" role="img" aria-label={text} title={text} />;
}

function LinkInput({ icon: Icon, value, onChange, placeholder, label }) {
  return (
    <label className="h-12 px-3 border border-border bg-card rounded-md flex items-center gap-3 focus-within:border-primary transition-colors">
      <Icon size={15} className="text-mutedtext shrink-0" />
      <span className="sr-only">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none text-sm placeholder:text-mutedtext" />
    </label>
  );
}

function PairDialog({ open, onOpenChange, selected, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-border-strong bg-card p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Select paired asset</DialogTitle>
          <DialogDescription className="text-mutedtext">Choose the actual asset used to price this market. Only registered protocol pairs can be launched onchain.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none bg-card">
          <CommandInput placeholder="Search symbol, company, or sector…" className="h-12" />
          <CommandList className="max-h-[420px] p-2">
            <CommandEmpty>No active pair found.</CommandEmpty>
            {pairGroups.map((group, groupIndex) => {
              const assets = pairAssets.filter(group.test);
              if (!assets.length) return null;
              return (
                <React.Fragment key={group.label}>
                  {groupIndex > 0 && <CommandSeparator className="my-2" />}
                  <CommandGroup heading={`${group.label} · ${assets.length}`}>
                    {assets.map((asset) => (
                      <CommandItem
                        key={asset.symbol}
                        value={`${asset.symbol} ${asset.name} ${asset.sector}`}
                        onSelect={() => { onSelect(asset.symbol); onOpenChange(false); }}
                        className="min-h-12 px-3 data-[selected=true]:bg-primary/[0.06] data-[selected=true]:text-foreground"
                      >
                        <PairAssetLogo symbol={asset.symbol} size={34} className="border-primary/20" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold">{asset.symbol}</span><span className="text-xs text-mutedtext truncate">{asset.name}</span></div>
                          <div className="text-[10px] text-mutedtext mt-0.5">{asset.sector}</div>
                        </div>
                        {selected === asset.symbol && <Check size={14} className="ml-auto text-primary" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </React.Fragment>
              );
            })}
          </CommandList>
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[10px] tracking-[0.1em] text-mutedtext">
            <span>PROTOTYPE CATALOG</span><span className="text-primary">DYNAMIC IN PRODUCTION</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function OptionRow({ icon: Icon, title, description, badge, children }) {
  return (
    <div className="border border-border bg-card rounded-md p-4 flex items-center gap-3 sm:gap-4">
      <div className="w-9 h-9 rounded-md border border-border bg-elevated flex items-center justify-center shrink-0"><Icon size={15} className="text-primary" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><span className="text-sm font-medium">{title}</span>{badge && <span className="text-[9px] tracking-[0.12em] text-mutedtext border border-border px-1.5 py-0.5">{badge}</span>}</div>
        <p className="text-xs text-mutedtext leading-relaxed mt-1">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Fact({ icon: Icon, children }) {
  return <div className="px-4 py-3.5 flex items-start gap-3"><Icon size={14} className="text-primary shrink-0 mt-0.5" /><p className="text-xs sm:text-sm text-secondarytext leading-relaxed">{children}</p></div>;
}

function PreviewMetric({ label, value, note }) {
  return <div><div className="text-[10px] tracking-[0.12em] text-mutedtext">{label}</div><div className="font-mono-nums text-lg font-semibold mt-1">{value}</div><div className="text-[10px] text-mutedtext mt-1">{note}</div></div>;
}

function SummaryRow({ label, value, mono }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-mutedtext">{label}</span><span className={cn("text-foreground text-right", mono && "font-mono-nums")}>{value}</span></div>;
}

function ResultCell({ label, value }) {
  return <div className="px-4 py-4 border-b sm:border-b-0 sm:border-r border-border last:border-0"><div className="text-[10px] tracking-[0.12em] text-mutedtext">{label}</div><div className="font-mono text-sm text-foreground mt-1">{value}</div></div>;
}
