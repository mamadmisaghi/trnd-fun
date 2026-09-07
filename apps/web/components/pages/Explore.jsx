"use client";
import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import TokenRow from "@/components/viral/TokenRow";
import { FilterChip, SectionLabel } from "@/components/viral/ui";
import { tokens } from "@/data";
import { getIndexedMarkets, indexedMarketToToken } from "@/lib/indexer/client";

const tabs = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "mcap", label: "Top Market Cap" },
  { key: "volume", label: "High Volume" },
  { key: "signals", label: "Viral Origin" },
  { key: "pairs", label: "RWA Paired" },
];

export default function Explore() {
  const [tab, setTab] = useState("trending");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("24H");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [indexedTokens, setIndexedTokens] = useState([]);
  const [indexerState, setIndexerState] = useState("loading");

  useEffect(() => {
    let active = true;
    getIndexedMarkets(50)
      .then((markets) => {
        if (!active) return;
        setIndexedTokens(markets.map(indexedMarketToToken));
        setIndexerState("live");
      })
      .catch(() => active && setIndexerState("fallback"));
    return () => { active = false; };
  }, []);

  const list = useMemo(() => {
    let l = [...indexedTokens, ...tokens];
    if (query) l = l.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.ticker.toLowerCase().includes(query.toLowerCase()));
    if (tab === "trending") l.sort((a, b) => b.change24h - a.change24h);
    if (tab === "new") l.sort((a, b) => a.age.localeCompare(b.age));
    if (tab === "mcap") l.sort((a, b) => b.marketCapNum - a.marketCapNum);
    if (tab === "volume") l.sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h));
    if (tab === "signals") l = l.filter((t) => t.fromSignal);
    if (tab === "pairs") l = l.filter((t) => t.pairAsset && t.pairAsset !== "ETH");
    return l;
  }, [indexedTokens, tab, query]);

  const totalMarkets = query ? list.length : 247;
  const pageCount = Math.max(1, Math.ceil(totalMarkets / rowsPerPage));
  const activePage = Math.min(page, pageCount);
  const firstRow = totalMarkets === 0 ? 0 : (activePage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(activePage * rowsPerPage, totalMarkets);
  const visibleRows = totalMarkets === 0 || list.length === 0
    ? []
    : Array.from({ length: lastRow - firstRow + 1 }, (_, index) => list[((firstRow - 1) + index) % list.length]);

  const pageItems = (() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
    if (activePage <= 4) return [1, 2, 3, 4, 5, "ellipsis", pageCount];
    if (activePage >= pageCount - 3) return [1, "ellipsis", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    return [1, "ellipsis-left", activePage - 1, activePage, activePage + 1, "ellipsis-right", pageCount];
  })();

  return (
    <div className="max-w-[1640px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <div className="text-[10px] tracking-[0.15em] text-primary mb-2">LIVE ON ROBINHOOD CHAIN · {indexerState === "live" ? `${indexedTokens.length} ONCHAIN MARKET${indexedTokens.length === 1 ? "" : "S"}` : indexerState === "loading" ? "SYNCING TESTNET" : "MOCK FALLBACK"}</div>
          <h1 className="font-heading font-semibold text-3xl sm:text-4xl text-foreground tracking-[-0.045em]">Markets</h1>
          <p className="text-sm text-secondarytext mt-2">Markets created from internet events, permanently connected to their source and paired asset.</p>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <FilterChip key={t.key} active={tab === t.key} onClick={() => { setTab(t.key); setPage(1); }}>{t.label}</FilterChip>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="flex items-center gap-2 h-10 px-3 rounded-md border border-border sm:w-72">
              <Search size={15} className="text-mutedtext" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search tokens, events, or creators…" className="bg-transparent text-sm text-foreground placeholder:text-mutedtext outline-none flex-1 min-w-0" />
            </label>
            <div className="flex items-center rounded-md border border-border bg-card p-1">
              {["24H", "7D", "30D", "All Time"].map((item) => <button key={item} onClick={() => setRange(item)} className={`h-8 px-3 text-[11px] rounded-sm transition-colors ${range === item ? "bg-primary/[0.13] text-primary" : "text-mutedtext hover:text-foreground"}`}>{item}</button>)}
            </div>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="hidden xl:grid market-table-grid gap-2 px-4 py-2.5 border-b border-border bg-deep">
          <SectionLabel>#</SectionLabel>
          <SectionLabel>Token / Event</SectionLabel>
          <SectionLabel>Pair</SectionLabel>
          <SectionLabel>Status</SectionLabel>
          <SectionLabel>Market Cap</SectionLabel>
          <SectionLabel>24H Volume</SectionLabel>
          <SectionLabel>24H</SectionLabel>
          <SectionLabel>Holders</SectionLabel>
          <SectionLabel>Origin</SectionLabel>
          <SectionLabel>Chart</SectionLabel>
          <span />
        </div>
        {visibleRows.map((t, i) => (
          <TokenRow key={`${activePage}-${i}-${t.id}`} token={t} index={firstRow + i - 1} />
        ))}
        {visibleRows.length === 0 && <div className="py-16 text-center text-sm text-mutedtext">No tokens found.</div>}
        <div className="px-4 py-3 border-t border-border bg-deep/45 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center text-xs text-mutedtext">
          <span>Showing {firstRow} to {lastRow} of {totalMarkets} markets</span>
          <nav aria-label="Markets pages" className="flex items-center justify-center gap-1">
            <button aria-label="Previous page" disabled={activePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="market-page-button disabled:opacity-30"><ChevronLeft size={14} /></button>
            {pageItems.map((item, index) => typeof item === "number" ? (
              <button key={item} aria-current={activePage === item ? "page" : undefined} onClick={() => setPage(item)} className={`market-page-button ${activePage === item ? "is-active" : ""}`}>{item}</button>
            ) : <span key={`${item}-${index}`} className="w-8 text-center text-mutedtext">…</span>)}
            <button aria-label="Next page" disabled={activePage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="market-page-button disabled:opacity-30"><ChevronRight size={14} /></button>
          </nav>
          <label className="flex items-center justify-start md:justify-end gap-2">
            <span>Rows per page</span>
            <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }} className="h-8 border border-border-strong bg-card px-2 text-xs text-foreground outline-none focus:border-primary/60">
              {[10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
