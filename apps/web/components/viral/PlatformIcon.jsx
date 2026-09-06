import React from "react";
import { PLATFORMS } from "@/data";

// Minimal line-style platform glyphs. Recognizable but restrained.
export default function PlatformIcon({ platform, size = 14, className = "", title }) {
  const p = PLATFORMS[platform];
  if (!p && platform !== "telegram") return null;
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", className, "aria-hidden": title ? undefined : true, "aria-label": title };

  if (platform === "tiktok") {
    return (
      <svg {...common}>
        <path d="M16 3c.3 2.6 2 4.6 4.5 4.9v3.1c-1.7 0-3.3-.5-4.5-1.3v6.1c0 3.4-2.7 6.2-6.1 6.2S3.3 19.2 3.3 15.8c0-3.2 2.4-5.9 5.6-6.2v3.2c-1.4.2-2.5 1.4-2.5 2.9 0 1.7 1.3 3 3 3s3-1.3 3-3V3h3.6z" fill="currentColor"/>
      </svg>
    );
  }
  if (platform === "x") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
      </svg>
    );
  }
  if (platform === "instagram") {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg {...common}>
        <rect x="2.5" y="6" width="19" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M10.5 9.2l4.5 2.8-4.5 2.8z" fill="currentColor"/>
      </svg>
    );
  }
  if (platform === "telegram") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <path d="M21.7 3.4 18.6 20c-.2 1.2-.9 1.5-1.9.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.2 13.9 1.5 12.4c-1-.3-1-1 .2-1.5L20 3.8c.9-.3 1.9.2 1.7-.4z" fill="currentColor"/>
      </svg>
    );
  }
  return null;
}

export function PlatformBadge({ platform, className = "" }) {
  const p = PLATFORMS[platform];
  if (!p) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-secondarytext ${className}`}>
      <PlatformIcon platform={platform} size={13} />
      {p.name}
    </span>
  );
}
