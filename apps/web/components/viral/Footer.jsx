import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, Radio, ShieldCheck } from "lucide-react";
import Logo from "@/components/viral/Logo";

const productLinks = [
  { label: "Live Analyzer", to: "/live" },
  { label: "Markets", to: "/explore" },
  { label: "Manual Launch", to: "/create" },
  { label: "Creators", to: "/creators" },
  { label: "Documentation", to: "/docs" },
];

const accountLinks = [
  { label: "Portfolio", to: "/portfolio" },
  { label: "Search signals", to: "/live" },
  { label: "Recently launched", to: "/explore" },
];

const ecosystemLinks = [
  { label: "o1 Launchpad", href: "https://launch.o1.exchange/token/create" },
  { label: "Robinhood Chain", href: "https://robinhood.com/us/en/chain/" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-deep/55 pb-20 md:pb-0">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[minmax(280px,1.4fr)_repeat(3,minmax(130px,.55fr))] gap-9 lg:gap-12 py-10 sm:py-14">
          <div className="max-w-md">
            <Logo size={28} />
            <p className="mt-5 text-sm sm:text-base text-secondarytext leading-relaxed max-w-sm">
              Real-time cultural intelligence that finds what the internet is beginning to care about, scores the signal, matches the asset and opens the path to market.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 h-8 px-3 border border-primary/25 bg-primary/[0.035] rounded-sm text-[10px] tracking-[0.12em] text-primary">
                <Radio size={12} /> SYSTEM LIVE
              </span>
              <span className="inline-flex items-center gap-2 h-8 px-3 border border-border rounded-sm text-[10px] tracking-[0.1em] text-mutedtext">
                <ShieldCheck size={12} /> WALLET-SIGNED
              </span>
            </div>
          </div>

          <FooterColumn title="Product">
            {productLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>

          <FooterColumn title="Activity">
            {accountLinks.map((link) => <FooterLink key={link.label} {...link} />)}
          </FooterColumn>

          <FooterColumn title="Infrastructure">
            {ecosystemLinks.map((link) => <FooterLink key={link.label} {...link} external />)}
            <span className="text-xs text-mutedtext mt-2 leading-relaxed">Launch configuration and supported pairs are synced dynamically.</span>
          </FooterColumn>
        </div>

        <div className="border-t border-border py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] text-mutedtext">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span>© 2026 TRND.fun</span>
            <span>Built for Robinhood Chain</span>
            <span className="text-primary">Internet → Signal → Market</span>
          </div>
          <p className="max-w-xl md:text-right leading-relaxed">Product prototype. Signal, score and market data shown in this experience may be simulated.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-mutedtext mb-4">{title}</div>
      <div className="flex flex-col items-start gap-3">{children}</div>
    </div>
  );
}

function FooterLink({ label, to, href, external = false }) {
  const className = "inline-flex items-center gap-1.5 text-sm text-secondarytext hover:text-primary transition-colors";
  if (external) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}>{label}<ArrowUpRight size={12} /></a>;
  }
  return <Link to={to} className={className}>{label}</Link>;
}
