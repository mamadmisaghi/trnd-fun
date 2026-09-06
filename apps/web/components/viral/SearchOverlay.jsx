import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { Search, X, ArrowUpRight } from "lucide-react";
import { signals, tokens, creators } from "@/data";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { SectionLabel } from "@/components/viral/ui";

export default function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.toLowerCase().trim();
    const match = (s) => !query || s.toLowerCase().includes(query);
    return {
      signals: signals.filter((s) => match(s.title) || match(s.creator)).slice(0, 4),
      tokens: tokens.filter((t) => match(t.name) || match(t.ticker)).slice(0, 4),
      creators: creators.filter((c) => match(c.name) || match(c.handle)).slice(0, 4),
    };
  }, [q]);

  const flat = [...results.signals.map((s) => ({ type: "signal", id: s.id })), ...results.tokens.map((t) => ({ type: "token", id: t.id })), ...results.creators.map((c) => ({ type: "creator", id: c.id }))];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, flat.length - 1));
      if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
      if (e.key === "Enter" && flat[active]) {
        const r = flat[active];
        if (r.type === "signal") navigate(`/signal/${r.id}`);
        if (r.type === "token") navigate(`/token/${r.id}`);
        if (r.type === "creator") navigate(`/creator/${r.id}`);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, active]);

  if (!open) return null;

  const go = (type, id) => {
    if (type === "signal") navigate(`/signal/${id}`);
    if (type === "token") navigate(`/token/${id}`);
    if (type === "creator") navigate(`/creator/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-deep border border-border-strong rounded-lg shadow-2xl overflow-hidden animate-flare-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search size={18} className="text-mutedtext" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, markets, creators…"
            className="flex-1 bg-transparent text-foreground placeholder:text-mutedtext outline-none text-sm"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-mutedtext">ESC</kbd>
          <button onClick={onClose} className="text-mutedtext hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {flat.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-mutedtext">No results. Try “chair”, “glitch”, “@desk”.</div>
          )}

          {results.signals.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5"><SectionLabel>Viral Events</SectionLabel></div>
              {results.signals.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => go("signal", s.id)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active === i ? "bg-secondary" : "hover:bg-secondary/60"}`}
                >
                  <PlatformIcon platform={s.platform} size={16} className="text-secondarytext" />
                  <span className="text-sm text-foreground flex-1 truncate">{s.title}</span>
                  <span className="font-mono-nums text-xs text-primary">{s.viralScore}</span>
                  <ArrowUpRight size={14} className="text-mutedtext" />
                </button>
              ))}
            </div>
          )}

          {results.tokens.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 py-1.5"><SectionLabel>Tokens</SectionLabel></div>
              {results.tokens.map((t, i) => {
                const idx = results.signals.length + i;
                return (
                  <button
                    key={t.id}
                    onClick={() => go("token", t.id)}
                    onMouseEnter={() => setActive(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active === idx ? "bg-secondary" : "hover:bg-secondary/60"}`}
                  >
                    <img src={t.image} alt="" className="w-6 h-6 rounded object-cover" />
                    <span className="text-sm text-foreground flex-1 truncate">{t.name}</span>
                    <span className="font-mono-nums text-xs text-secondarytext">${t.ticker}</span>
                    <ArrowUpRight size={14} className="text-mutedtext" />
                  </button>
                );
              })}
            </div>
          )}

          {results.creators.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 py-1.5"><SectionLabel>Creators</SectionLabel></div>
              {results.creators.map((c, i) => {
                const idx = results.signals.length + results.tokens.length + i;
                return (
                  <button
                    key={c.id}
                    onClick={() => go("creator", c.id)}
                    onMouseEnter={() => setActive(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active === idx ? "bg-secondary" : "hover:bg-secondary/60"}`}
                  >
                    <img src={c.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-sm text-foreground flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-secondarytext">{c.handle}</span>
                    <ArrowUpRight size={14} className="text-mutedtext" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
