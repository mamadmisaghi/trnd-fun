import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const assetMarks = {
  ETH: { slug: "ethereum", domain: "ethereum.org", color: "627EEA" },
  USDG: { domain: "globaldollar.com", color: "A8FF00" },
  AAPL: { slug: "apple", domain: "apple.com", color: "FFFFFF" },
  AMD: { slug: "amd", domain: "amd.com", color: "ED1C24" },
  AMZN: { slug: "amazon", domain: "amazon.com", color: "FF9900" },
  COST: { slug: "costco", domain: "costco.com", color: "E31837" },
  DIS: { slug: "disney", domain: "disney.com", color: "FFFFFF" },
  GOOGL: { slug: "google", domain: "google.com", color: "4285F4" },
  META: { slug: "meta", domain: "meta.com", color: "0866FF" },
  MSFT: { slug: "microsoft", domain: "microsoft.com", color: "00A4EF" },
  NFLX: { slug: "netflix", domain: "netflix.com", color: "E50914" },
  NKE: { slug: "nike", domain: "nike.com", color: "FFFFFF" },
  NVDA: { slug: "nvidia", domain: "nvidia.com", color: "76B900" },
  QQQ: { domain: "invesco.com", color: "FFFFFF" },
  SPY: { domain: "ssga.com", color: "FFFFFF" },
  TSLA: { slug: "tesla", domain: "tesla.com", color: "E82127" },
  WMT: { slug: "walmart", domain: "walmart.com", color: "FFC220" },
};

export default function PairAssetLogo({ symbol, size = 32, className = "" }) {
  const normalized = String(symbol || "").toUpperCase();
  const mark = assetMarks[normalized];
  const initialMode = mark?.slug ? "brand" : mark?.domain ? "favicon" : "fallback";
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(mark?.slug ? "brand" : mark?.domain ? "favicon" : "fallback");
  }, [normalized, mark?.domain, mark?.slug]);

  const brandUrl = mark?.slug ? `https://cdn.simpleicons.org/${mark.slug}/${mark.color}` : "";
  const faviconUrl = mark?.domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(mark.domain)}&sz=128` : "";
  const src = mode === "brand" ? brandUrl : mode === "favicon" ? faviconUrl : "";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong bg-elevated", className)}
      style={{ width: size, height: size }}
      title={normalized}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-[62%] w-[62%] object-contain"
          loading="lazy"
          onError={() => setMode((current) => current === "brand" && faviconUrl ? "favicon" : "fallback")}
        />
      ) : (
        <span className="font-mono-nums text-[10px] font-semibold text-foreground">{normalized.slice(0, 2)}</span>
      )}
    </span>
  );
}
