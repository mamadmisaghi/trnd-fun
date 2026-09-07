import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@/lib/navigation";
import { Search, Bell, Wallet, Radio, LineChart, Rocket, Users, BookOpen, X } from "lucide-react";
import Logo from "@/components/viral/Logo";
import { cn } from "@/lib/utils";
import { shortAddress, useViralWallet } from "@/lib/protocol/ViralWalletProvider";

const navItems = [
  { label: "Live", path: "/live", icon: Radio },
  { label: "Markets", path: "/explore", icon: LineChart },
  { label: "Launch", path: "/create", icon: Rocket },
  { label: "Creators", path: "/creators", icon: Users },
  { label: "Docs", path: "/docs", icon: BookOpen },
];

export default function Navigation({ onSearch, onNotifications, onPortfolio }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [walletNotice, setWalletNotice] = useState("");
  const wallet = useViralWallet();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (wallet.error) setWalletNotice(wallet.error);
    if (wallet.isConnected) setWalletNotice("");
  }, [wallet.error, wallet.isConnected]);

  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  const onWalletClick = async () => {
    if (wallet.isConnected) {
      onPortfolio?.();
      return;
    }
    setWalletNotice("");
    try {
      await wallet.connect();
    } catch (error) {
      setWalletNotice(error?.message || "Wallet connection failed. Please try again.");
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 h-16 border-b transition-colors duration-200",
          scrolled ? "bg-background/85 backdrop-blur-md border-border" : "bg-background border-border/50"
        )}
      >
        <div className="h-full px-4 sm:px-6 max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          <Link to="/live" className="shrink-0">
            <Logo size={30} compact />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-3.5 py-1.5 text-sm font-heading font-medium tracking-wide transition-colors duration-150 rounded-sm",
                  isActive(item.path) ? "text-primary" : "text-secondarytext hover:text-foreground"
                )}
              >
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute -bottom-[14px] inset-x-3 h-px bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onSearch}
              className="flex items-center gap-2 h-9 px-2.5 sm:px-3 rounded-md border border-border text-mutedtext hover:text-foreground hover:border-border-strong transition-colors"
            >
              <Search size={15} />
              <span className="hidden lg:inline text-xs text-mutedtext pr-5">Search events or pairs…</span>
              <kbd className="hidden lg:inline text-[10px] font-mono px-1 py-0.5 rounded border border-border text-mutedtext">⌘K</kbd>
            </button>
            <button
              onClick={onNotifications}
              className="relative h-9 w-9 flex items-center justify-center rounded-md border border-border text-secondarytext hover:text-foreground hover:border-border-strong transition-colors"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
            <button
              onClick={onWalletClick}
              disabled={wallet.status === "connecting"}
              aria-busy={wallet.status === "connecting"}
              className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-border text-secondarytext hover:text-foreground hover:border-border-strong transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <Wallet size={15} />
              <span className="font-mono-nums text-xs">
                {wallet.status === "connecting" ? "Connecting…" : shortAddress(wallet.address)}
              </span>
            </button>
            <button
              onClick={onWalletClick}
              disabled={wallet.status === "connecting"}
              aria-label={wallet.isConnected ? "Open portfolio" : "Connect wallet"}
              aria-busy={wallet.status === "connecting"}
              className="sm:hidden h-9 w-9 flex items-center justify-center rounded-md border border-border text-secondarytext hover:text-foreground hover:border-border-strong transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <Wallet size={15} />
            </button>
          </div>
        </div>
      </header>

      {walletNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-[4.5rem] right-4 sm:right-6 z-[60] max-w-sm rounded-md border border-border-strong bg-card/95 backdrop-blur-md px-4 py-3 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <Wallet size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-heading font-medium text-foreground">Wallet connection unavailable</p>
              <p className="mt-1 text-xs leading-relaxed text-secondarytext">{walletNotice}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-mutedtext">Open TRND.fun in a wallet-enabled browser such as Chrome or Brave with MetaMask installed.</p>
            </div>
            <button
              onClick={() => setWalletNotice("")}
              aria-label="Dismiss wallet message"
              className="shrink-0 text-mutedtext hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-heading font-medium tracking-wide rounded-md transition-colors",
              item.label === "Launch"
                ? "bg-primary text-primary-foreground px-4"
                : isActive(item.path)
                ? "text-primary"
                : "text-mutedtext"
            )}
          >
            <item.icon size={15} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
