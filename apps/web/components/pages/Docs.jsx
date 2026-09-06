"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Fingerprint,
  Flame,
  Gauge,
  LockKeyhole,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const navigation = [
  {
    title: "Getting started",
    items: [
      ["Introduction", "introduction"],
      ["How it works", "how-it-works"],
      ["Core concepts", "core-concepts"],
    ],
  },
  {
    title: "Intelligence",
    items: [
      ["Viral Engine", "viral-engine"],
      ["Viral Score", "viral-score"],
      ["RWA matching", "rwa-matching"],
    ],
  },
  {
    title: "Launchpad",
    items: [
      ["Launch paths", "launch-paths"],
      ["Launch lifecycle", "launch-lifecycle"],
      ["Market provenance", "market-provenance"],
    ],
  },
  {
    title: "Economics",
    items: [
      ["Trading fee", "trading-fee"],
      ["Creator rewards", "creator-rewards"],
      ["VIRAL buyback", "viral-buyback"],
    ],
  },
  {
    title: "Reference",
    items: [
      ["Event states", "event-states"],
      ["Infrastructure", "infrastructure"],
      ["Security", "security"],
      ["FAQ", "faq"],
    ],
  },
];

const trackedIds = navigation.flatMap((group) => group.items.map(([, id]) => id));

const scoreRows = [
  ["Velocity", "How quickly views, mentions and interactions are growing."],
  ["Acceleration", "Whether the rate of growth is itself increasing."],
  ["Engagement anomaly", "Performance versus the source account’s normal baseline."],
  ["Reach", "Current and estimated audience exposure."],
  ["Source authority", "The influence, history and relevance of the source."],
  ["Cross-platform", "Evidence that the narrative is spreading elsewhere."],
  ["Novelty & persistence", "How new the event is and how likely it is to endure."],
];

const eventStates = ["NEW", "EARLY", "HEATING", "BREAKING", "VIRAL", "COOLING", "LAUNCH PENDING", "LAUNCHED"];

const faq = [
  [
    "Is ViralTerminal a normal token launchpad?",
    "No. The primary product is real-time cultural intelligence. Launching is the action that follows discovery, scoring and financial matching.",
  ],
  [
    "Do AI pair percentages add up to 100%?",
    "No. Each percentage is an independent relevance score. NVDA can be a 91% match while AMD is also a 74% match.",
  ],
  [
    "Can the same social post be launched more than once?",
    "No. A normalized platform and source-post ID identify one Viral Event, and one event can produce only one ViralTerminal launch.",
  ],
  [
    "Are all pair assets permanently available?",
    "No. The active pair catalog and launch configuration must be synchronized dynamically from launch infrastructure. A displayed pair count is only a current snapshot.",
  ],
  [
    "Does ViralTerminal sign transactions for users?",
    "No. Launch preparation may happen through backend infrastructure, but the connected wallet remains the creator and signer. Private keys are never requested or stored.",
  ],
];

export default function Docs() {
  const [activeId, setActiveId] = useState("introduction");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5] }
    );

    trackedIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-deep/35">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-mutedtext">
          <BookOpen size={14} className="text-primary" />
          <span>ViralTerminal Docs</span>
          <ChevronRight size={12} />
          <span className="text-secondarytext">Product overview</span>
          <span className="ml-auto hidden sm:inline-flex items-center gap-2 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Specification v0.1
          </span>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto grid lg:grid-cols-[245px_minmax(0,820px)_210px] xl:grid-cols-[260px_minmax(0,880px)_230px] gap-8 xl:gap-12 px-4 sm:px-6">
        <aside className="hidden lg:block border-r border-border pr-6 py-10">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto terminal-feed-scroll pr-2">
            <label className="h-9 flex items-center gap-2 px-3 border border-border rounded-md bg-card/70 mb-7">
              <Search size={13} className="text-mutedtext" />
              <span className="text-xs text-mutedtext">Browse documentation</span>
            </label>
            <DocsNavigation activeId={activeId} onSelect={jump} />
          </div>
        </aside>

        <main className="min-w-0 py-8 sm:py-12 lg:py-14">
          <div className="lg:hidden overflow-x-auto no-scrollbar flex gap-2 pb-7">
            {navigation.flatMap((group) => group.items).map(([label, id]) => (
              <button key={id} onClick={() => jump(id)} className={`shrink-0 h-8 px-3 rounded-full border text-xs transition-colors ${activeId === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondarytext bg-card"}`}>
                {label}
              </button>
            ))}
          </div>

          <section id="introduction" className="docs-section scroll-mt-28">
            <Eyebrow icon={Radio}>VIRAL INTELLIGENCE PROTOCOL</Eyebrow>
            <h1 className="mt-5 font-heading font-semibold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.055em] leading-[0.98] text-foreground">
              Internet attention,<br />mapped to markets.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-secondarytext leading-8 max-w-3xl">
              ViralTerminal detects what the internet is beginning to care about, scores the event, matches its narrative to relevant real-world assets and opens a path to launch that moment as an onchain market on Robinhood Chain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/live" className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                Open Live Analyzer <ArrowRight size={15} />
              </Link>
              <Link to="/create" className="h-10 px-4 inline-flex items-center gap-2 rounded-md border border-border-strong text-sm text-foreground hover:border-primary/60 transition-colors">
                Manual Launch
              </Link>
            </div>
            <Notice className="mt-9" icon={ShieldCheck} title="Current product status">
              This experience is a high-fidelity product prototype. Signal, score, market and transaction data may be simulated until production data providers, contracts and backend services are connected.
            </Notice>
          </section>

          <Section id="how-it-works" index="01" title="How it works" intro="ViralTerminal combines a scanner, an intelligence layer and a launch engine in one continuous workflow.">
            <div className="grid sm:grid-cols-2 gap-3">
              <FlowCard icon={Radio} step="SCAN" text="Monitor X, TikTok, Instagram, YouTube and news for emerging or high-authority events." />
              <FlowCard icon={Gauge} step="SCORE" text="Measure velocity, acceleration, anomaly, reach, authority, novelty and spread." />
              <FlowCard icon={Sparkles} step="MATCH" text="Rank four currently enabled RWA pair assets with independent relevance scores." />
              <FlowCard icon={Rocket} step="LAUNCH" text="Configure a token, sign with a wallet and permanently connect the market to its origin." />
            </div>
            <CodeLine>INTERNET → VIRAL EVENT → SCORE → RWA MATCH → LAUNCH → MARKET</CodeLine>
          </Section>

          <Section id="core-concepts" index="02" title="Core concepts" intro="The system is organized around concrete source events rather than generic token ideas.">
            <Definition term="Viral Event" detail="One specific source item—a tweet, TikTok, Instagram post, YouTube video or news object—with a stable internal identity." />
            <Definition term="Narrative" detail="The concise cultural or financial story that explains what the event means and why it may matter." />
            <Definition term="Pair Asset" detail="The actual asset against which the launched token trades—not a decorative category label." />
            <Definition term="Provenance" detail="The permanent relationship between the original source, detection data, score at launch, selected pair and resulting token market." />
          </Section>

          <Section id="viral-engine" index="03" title="The Viral Engine" intro="The engine looks for two different kinds of opportunity. Both can produce valid signals.">
            <div className="grid md:grid-cols-2 gap-3">
              <FeatureCard icon={Activity} label="TYPE A" title="Emerging momentum">
                Content is accelerating abnormally relative to its recent history or the source account’s baseline—even before it reaches mainstream scale.
              </FeatureCard>
              <FeatureCard icon={Users} label="TYPE B" title="High-signal source">
                A major creator, CEO, celebrity, institution or public figure posts something new. Source authority can make the event important before conventional virality appears.
              </FeatureCard>
            </div>
            <h3 className="docs-h3">Detection principles</h3>
            <Bullet>Exact duplicates use a normalized <InlineCode>platform + source_post_id</InlineCode> identity.</Bullet>
            <Bullet>Cross-platform confirmation increases confidence but is not required.</Bullet>
            <Bullet>Related posts may remain separate events while being linked under one narrative.</Bullet>
            <Bullet>Production scores come from repeated metric snapshots, not a single static view count.</Bullet>
          </Section>

          <Section id="viral-score" index="04" title="Viral Score" intro="Every accepted event receives a 0–100 score designed to be understandable at a glance and explainable in detail.">
            <div className="border border-border rounded-lg overflow-hidden bg-card/70">
              <div className="grid sm:grid-cols-[180px_1fr] px-4 py-3 bg-deep border-b border-border text-[11px] uppercase tracking-[0.14em] text-mutedtext">
                <span>Component</span><span className="hidden sm:block">What it measures</span>
              </div>
              {scoreRows.map(([name, detail]) => (
                <div key={name} className="grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 px-4 py-3 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  <span className="text-sm text-secondarytext leading-6">{detail}</span>
                </div>
              ))}
            </div>
            <Notice className="mt-4" icon={Bot} title="Explainable, not absolute">
              The score is a ranked intelligence signal—not a guarantee of future attention, token performance or financial return. Model and feature versions should be stored with every published score.
            </Notice>
          </Section>

          <Section id="rwa-matching" index="05" title="AI RWA matching" intro="ViralTerminal asks which real-world asset the narrative belongs with, then ranks only pair assets that are currently enabled by launch infrastructure.">
            <div className="grid md:grid-cols-[1fr_240px] gap-4 items-stretch">
              <div className="border border-border rounded-lg bg-card/65 p-5">
                <div className="text-[11px] tracking-[0.15em] text-mutedtext uppercase mb-4">Example · NVIDIA event</div>
                <PairMatch symbol="NVDA" name="NVIDIA" score={91} primary />
                <PairMatch symbol="AMD" name="Advanced Micro Devices" score={74} />
                <PairMatch symbol="QQQ" name="Nasdaq-100 ETF" score={58} />
                <PairMatch symbol="MSFT" name="Microsoft" score={41} />
              </div>
              <div className="border border-primary/25 bg-primary/[0.035] rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="mt-4 text-base font-semibold">Independent scores</h3>
                  <p className="mt-2 text-sm leading-6 text-secondarytext">Scores do not form a portfolio and never need to total 100%.</p>
                </div>
                <span className="mt-6 text-xs text-primary">Browse all active pairs →</span>
              </div>
            </div>
            <Bullet>Named companies and products receive direct relevance.</Bullet>
            <Bullet>Peers, sectors and broad-market assets can receive secondary relevance.</Bullet>
            <Bullet>The user may ignore all four recommendations and browse the current pair universe.</Bullet>
            <Bullet>The application must never fabricate a symbol or permanently hardcode a pair count.</Bullet>
          </Section>

          <Section id="launch-paths" index="06" title="Two launch paths" intro="Discovery-led creation is the signature flow, while manual creation remains available as a secondary route.">
            <div className="grid md:grid-cols-2 gap-3">
              <FeatureCard icon={Fingerprint} label="PRIMARY" title="Launch from a signal">
                Open an available Viral Event, review its intelligence, choose an AI-recommended or manual pair, configure the token and sign the launch.
              </FeatureCard>
              <FeatureCard icon={Rocket} label="SECONDARY" title="Manual launch">
                Create a token independently by providing its name, ticker, media, description, links, pair asset and supported launch settings.
              </FeatureCard>
            </div>
          </Section>

          <Section id="launch-lifecycle" index="07" title="Launch lifecycle" intro="One exact Viral Event can be launched once. A temporary reservation prevents two wallets from winning the same event simultaneously.">
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-lg overflow-hidden">
              <Lifecycle number="01" name="AVAILABLE" detail="The event can enter Launch Studio." />
              <Lifecycle number="02" name="RESERVED" detail="A short launch lock belongs to one wallet." />
              <Lifecycle number="03" name="LAUNCHED" detail="Confirmed onchain and permanently linked." />
            </div>
            <p className="docs-copy mt-5">If the wallet rejects, the transaction fails or the reservation expires, the event returns to available. The permanent lock happens only after confirmed transaction state—not when a frontend button is pressed.</p>
          </Section>

          <Section id="market-provenance" index="08" title="Market provenance" intro="Markets launched from signals retain a verifiable record of where the idea came from and what the system knew at launch time.">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0 border border-border bg-card/65 rounded-lg p-5">
              {["Viral Event ID", "Platform + source post ID", "Original source URL", "Source account", "Detected timestamp", "Viral Score at launch", "Selected RWA pair", "AI match score", "Launcher wallet", "Token address + transaction hash"].map((item) => (
                <div key={item} className="flex items-center gap-2 py-2.5 border-b border-border text-sm text-secondarytext"><Check size={13} className="text-primary shrink-0" />{item}</div>
              ))}
            </div>
          </Section>

          <Section id="trading-fee" index="09" title="Trading fee & distribution" intro="Every token market created through ViralTerminal uses a 1% trading fee. That fee is split across creators, recurring creator incentives, operations and the VIRAL token economy.">
            <div className="border border-border rounded-lg bg-card/70 overflow-hidden">
              <div className="h-3 flex">
                <span className="w-1/2 bg-primary" />
                <span className="w-1/5 bg-[#D6FF80]" />
                <span className="w-[10%] bg-[#727272]" />
                <span className="w-1/5 bg-white" />
              </div>
              <div className="grid sm:grid-cols-2 p-5 gap-5">
                <FeeItem value="50%" label="Creator" detail="Paid to the creator associated with the market." accent />
                <FeeItem value="20%" label="Daily creator rewards" detail="Funds the daily reward pool for top-performing creators." />
                <FeeItem value="10%" label="API, team & infrastructure" detail="Supports data providers, AI calls, engineering and operations." />
                <FeeItem value="20%" label="VIRAL buyback" detail="Used to buy back the VIRAL token according to protocol policy." />
              </div>
            </div>
            <CodeLine>1% TRADE FEE × 100% = 50% + 20% + 10% + 20%</CodeLine>
            <Notice className="mt-4" icon={CircleDollarSign} title="Example">
              If a trade generates $1.00 in trading fees, $0.50 goes to the creator, $0.20 to daily creator rewards, $0.10 to API/team/infrastructure and $0.20 to VIRAL buybacks.
            </Notice>
          </Section>

          <Section id="creator-rewards" index="10" title="Creator rewards" intro="Creators participate in two distinct incentive lanes: direct market fees and a competitive daily reward pool.">
            <Definition term="Direct creator share" detail="50% of the trading fee generated by markets connected to that creator." />
            <Definition term="Daily rewards pool" detail="20% of the trading fee funds rewards for the top five creators under the active ranking policy." />
            <Definition term="Creator profile" detail="A transparent view of launches, volume, fees earned, reach, performance and the markets connected to the creator." />
            <Notice className="mt-4" icon={Gauge} title="Ranking policy">
              Exact ranking weights, eligibility, anti-manipulation rules, claim windows and payout timing must be published before rewards become live. Prototype leaderboard values are simulated.
            </Notice>
          </Section>

          <Section id="viral-buyback" index="11" title="VIRAL buyback" intro="Twenty percent of trading-fee revenue is reserved for VIRAL token buybacks, connecting market activity to the platform token economy.">
            <p className="docs-copy">Production documentation must identify the buyback wallet or contract, execution cadence, eligible venues, slippage controls, transaction records and whether purchased tokens are burned, held or distributed. Until those rules and contracts are finalized, the interface should describe this allocation as a protocol policy—not claim completed onchain execution.</p>
          </Section>

          <Section id="event-states" index="12" title="Event states" intro="Status communicates where an event sits in both the attention lifecycle and launch lifecycle.">
            <div className="flex flex-wrap gap-2">
              {eventStates.map((state) => <span key={state} className={`h-8 px-3 inline-flex items-center border rounded-sm text-[11px] tracking-[0.08em] ${state === "LAUNCHED" ? "border-primary/40 bg-primary/[0.07] text-primary" : "border-border bg-card text-secondarytext"}`}>{state}{state === "LAUNCHED" ? " ✓" : ""}</span>)}
            </div>
            <p className="docs-copy mt-5">Launched events are never removed from the timeline. Their primary action changes from launch to view market, preserving historical context.</p>
          </Section>

          <Section id="infrastructure" index="13" title="Infrastructure" intro="The consumer experience belongs to ViralTerminal; launch preparation and onchain execution sit beneath it.">
            <div className="border border-border rounded-lg overflow-hidden bg-card/70">
              {["ViralTerminal interface", "ViralTerminal backend", "Launch infrastructure", "Connected wallet", "Robinhood Chain"].map((item, index) => (
                <div key={item} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
                  <span className="font-mono-nums text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm text-foreground">{item}</span>
                  {index < 4 && <ArrowRight size={14} className="ml-auto text-mutedtext rotate-90 sm:rotate-0" />}
                </div>
              ))}
            </div>
            <Bullet>Pair assets and launch configuration are synchronized dynamically.</Bullet>
            <Bullet>Prepared transaction data is passed to the user’s wallet for approval.</Bullet>
            <Bullet>Confirmation from chain/API state—not optimistic UI—finalizes a launch.</Bullet>
          </Section>

          <Section id="security" index="14" title="Security principles" intro="Wallet custody, API secrecy and authoritative launch state are non-negotiable boundaries.">
            <div className="grid sm:grid-cols-2 gap-3">
              <SecurityItem>Never request or store a private key.</SecurityItem>
              <SecurityItem>Keep launch-provider keys server-side.</SecurityItem>
              <SecurityItem>Validate event and reservation ownership.</SecurityItem>
              <SecurityItem>Validate pairs against current configuration.</SecurityItem>
              <SecurityItem>Use idempotency for launch preparation.</SecurityItem>
              <SecurityItem>Confirm transaction state before LAUNCHED.</SecurityItem>
            </div>
          </Section>

          <Section id="faq" index="15" title="Frequently asked questions">
            <div className="border-t border-border">
              {faq.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}
            </div>
          </Section>

          <div className="mt-16 border border-primary/25 bg-primary/[0.035] rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="text-[11px] tracking-[0.15em] text-primary">READY TO EXPLORE?</div>
              <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-[-0.03em]">Watch culture move in real time.</h2>
            </div>
            <Link to="/live" className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shrink-0">Open Live <ArrowRight size={15} /></Link>
          </div>
        </main>

        <aside className="hidden xl:block py-14">
          <div className="sticky top-24">
            <div className="text-[10px] uppercase tracking-[0.16em] text-mutedtext mb-4">On this page</div>
            <div className="border-l border-border">
              {navigation.flatMap((group) => group.items).map(([label, id]) => (
                <button key={id} onClick={() => jump(id)} className={`block w-full text-left pl-4 py-1.5 text-xs border-l -ml-px transition-colors ${activeId === id ? "border-primary text-primary" : "border-transparent text-mutedtext hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
            <div className="mt-8 border border-border rounded-lg bg-card/70 p-4">
              <div className="flex items-center gap-2 text-xs text-foreground"><LockKeyhole size={14} className="text-primary" /> Wallet-signed</div>
              <p className="mt-2 text-xs leading-5 text-mutedtext">Users remain the creator and signer of their transactions.</p>
            </div>
            <a href="https://robinhood.com/us/en/chain/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs text-mutedtext hover:text-primary transition-colors">Robinhood Chain <ExternalLink size={11} /></a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocsNavigation({ activeId, onSelect }) {
  return <div className="space-y-7">{navigation.map((group) => (
    <div key={group.title}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-mutedtext mb-2.5">{group.title}</div>
      <div className="space-y-0.5">{group.items.map(([label, id]) => (
        <button key={id} onClick={() => onSelect(id)} className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${activeId === id ? "text-primary bg-primary/[0.06]" : "text-secondarytext hover:text-foreground hover:bg-card"}`}>{label}</button>
      ))}</div>
    </div>
  ))}</div>;
}

function Eyebrow({ icon: Icon, children }) {
  return <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] text-primary"><Icon size={14} />{children}</div>;
}

function Section({ id, index, title, intro, children }) {
  return <section id={id} className="docs-section scroll-mt-28 border-t border-border mt-14 sm:mt-16 pt-10 sm:pt-12">
    <div className="flex items-center gap-3 mb-3"><span className="font-mono-nums text-[11px] text-primary">{index}</span><span className="h-px w-8 bg-primary/40" /></div>
    <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.04em] text-foreground">{title}</h2>
    {intro && <p className="docs-copy mt-4 mb-7">{intro}</p>}
    <div className={intro ? "" : "mt-7"}>{children}</div>
  </section>;
}

function FlowCard({ icon: Icon, step, text }) {
  return <div className="border border-border bg-card/70 rounded-lg p-5 min-h-40">
    <div className="flex items-center justify-between"><Icon size={18} className="text-primary" /><span className="font-mono-nums text-[10px] text-mutedtext">{step}</span></div>
    <p className="mt-7 text-sm leading-6 text-secondarytext">{text}</p>
  </div>;
}

function FeatureCard({ icon: Icon, label, title, children }) {
  return <div className="border border-border bg-card/70 rounded-lg p-5">
    <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] text-primary"><Icon size={15} />{label}</div>
    <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-secondarytext">{children}</p>
  </div>;
}

function Definition({ term, detail }) {
  return <div className="grid sm:grid-cols-[180px_1fr] gap-2 sm:gap-6 py-4 border-b border-border last:border-0">
    <span className="text-sm font-medium text-foreground">{term}</span>
    <span className="text-sm leading-6 text-secondarytext">{detail}</span>
  </div>;
}

function Bullet({ children }) {
  return <div className="flex gap-3 mt-3 text-sm leading-6 text-secondarytext"><span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-primary shrink-0" /><span>{children}</span></div>;
}

function InlineCode({ children }) {
  return <code className="font-mono text-[12px] text-primary bg-primary/[0.06] border border-primary/15 px-1.5 py-0.5 rounded-sm">{children}</code>;
}

function CodeLine({ children }) {
  return <div className="mt-4 border border-border bg-deep rounded-md px-4 py-3 overflow-x-auto font-mono text-xs text-primary whitespace-nowrap">{children}</div>;
}

function Notice({ icon: Icon, title, children, className = "" }) {
  return <div className={`border-l-2 border-primary bg-primary/[0.035] px-4 py-4 ${className}`}>
    <div className="flex gap-3"><Icon size={16} className="text-primary mt-0.5 shrink-0" /><div><div className="text-sm font-medium text-foreground">{title}</div><p className="mt-1.5 text-sm leading-6 text-secondarytext">{children}</p></div></div>
  </div>;
}

function PairMatch({ symbol, name, score, primary = false }) {
  return <div className="py-3 border-b border-border last:border-0">
    <div className="flex items-center gap-3">
      <span className={`w-9 h-9 rounded-md border flex items-center justify-center font-mono text-[10px] font-semibold ${primary ? "border-primary/40 bg-primary/[0.08] text-primary" : "border-border bg-deep text-foreground"}`}>{symbol.slice(0, 2)}</span>
      <div className="min-w-0"><div className="text-sm font-medium text-foreground">{symbol}</div><div className="text-xs text-mutedtext truncate">{name}</div></div>
      <span className={`ml-auto font-mono-nums text-sm ${primary ? "text-primary" : "text-secondarytext"}`}>{score}%</span>
    </div>
    <div className="ml-12 mt-2 h-1 bg-deep rounded-full overflow-hidden"><span className={`block h-full ${primary ? "bg-primary" : "bg-white/35"}`} style={{ width: `${score}%` }} /></div>
  </div>;
}

function Lifecycle({ number, name, detail }) {
  return <div className="p-5 border-b sm:border-b-0 sm:border-r border-border last:border-0">
    <span className="font-mono-nums text-[10px] text-primary">{number}</span>
    <div className="mt-5 text-xs tracking-[0.1em] text-foreground">{name}</div>
    <p className="mt-2 text-xs leading-5 text-mutedtext">{detail}</p>
  </div>;
}

function FeeItem({ value, label, detail, accent = false }) {
  return <div className="flex gap-4">
    <span className={`font-mono-nums text-2xl font-semibold tracking-[-0.04em] ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
    <div><div className="text-sm font-medium text-foreground">{label}</div><p className="mt-1 text-xs leading-5 text-mutedtext">{detail}</p></div>
  </div>;
}

function SecurityItem({ children }) {
  return <div className="flex items-center gap-3 border border-border bg-card/70 rounded-md p-4 text-sm text-secondarytext"><ShieldCheck size={16} className="text-primary shrink-0" />{children}</div>;
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return <div className="border-b border-border">
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="w-full py-5 flex items-center gap-4 text-left">
      <span className="text-sm sm:text-base font-medium text-foreground">{question}</span>
      <ChevronRight size={15} className={`ml-auto text-mutedtext transition-transform ${open ? "rotate-90 text-primary" : ""}`} />
    </button>
    {open && <p className="pb-5 pr-8 text-sm leading-6 text-secondarytext animate-flare-fade">{answer}</p>}
  </div>;
}
