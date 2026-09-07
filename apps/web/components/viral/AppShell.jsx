"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Navigation from "@/components/viral/Navigation";
import Footer from "@/components/viral/Footer";
import SearchOverlay from "@/components/viral/SearchOverlay";
import NotificationsPanel from "@/components/viral/NotificationsPanel";
import { useLocation, useNavigate } from "@/lib/navigation";
import { portfolio } from "@/data";
import { MetricChange } from "@/components/viral/ui";
import { TerminalGrid } from "@/components/aceternity/terminal-grid";
import { ViralWalletProvider } from "@/lib/protocol/ViralWalletProvider";

export default function AppShell({ children }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState(false);
  const [notif, setNotif] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ViralWalletProvider><div className="min-h-screen bg-background">
      <Navigation onSearch={() => setSearch(true)} onNotifications={() => setNotif(true)} onPortfolio={() => setPortfolioOpen(true)} />
      <TerminalGrid className="pt-16 min-h-[calc(100vh-4rem)]">
        <motion.main
          key={location.pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 9, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </TerminalGrid>
      <Footer />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <NotificationsPanel open={notif} onClose={() => setNotif(false)} />
      <PortfolioDrawer open={portfolioOpen} onClose={() => setPortfolioOpen(false)} />
    </div></ViralWalletProvider>
  );
}

function PortfolioDrawer({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/40" />
      <div className="absolute top-14 right-3 sm:right-6 bottom-3 w-[calc(100vw-1.5rem)] sm:w-96 bg-deep border border-border-strong rounded-lg shadow-2xl overflow-hidden flex flex-col animate-flare-fade" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 h-12 border-b border-border"><span className="font-heading font-semibold text-sm tracking-wide">Portfolio</span><button onClick={onClose} className="text-mutedtext hover:text-foreground"><X size={16} /></button></div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 border-b border-border"><span className="font-mono-nums text-xs text-mutedtext">{portfolio.wallet}</span><div className="flex items-end justify-between mt-2"><div><span className="text-[10px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">Total Value</span><div className="font-mono-nums text-2xl font-semibold text-foreground mt-1">{portfolio.totalValue}</div></div><MetricChange value={portfolio.change24h} className="text-sm" /></div></div>
          <div className="px-4 py-3"><span className="text-[10px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">Holdings</span></div>
          {portfolio.holdings.map((holding) => <button key={holding.ticker} onClick={() => { navigate(`/token/${holding.ticker.toLowerCase()}`); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 transition-colors text-left"><img src={holding.image} alt="" className="w-8 h-8 rounded-md object-cover" /><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-sm text-foreground font-medium">${holding.ticker}</span><span className="text-xs text-mutedtext truncate">{holding.name}</span></div><span className="font-mono-nums text-[11px] text-mutedtext">{holding.amount}</span></div><div className="text-right"><div className="font-mono-nums text-sm text-foreground">{holding.value}</div><MetricChange value={holding.change} className="text-[11px]" /></div></button>)}
        </div>
        <div className="p-3 border-t border-border"><button onClick={() => { navigate('/portfolio'); onClose(); }} className="w-full h-9 text-xs text-secondarytext hover:text-primary">Open portfolio</button></div>
      </div>
    </div>
  );
}
