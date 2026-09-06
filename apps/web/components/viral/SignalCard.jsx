import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight } from "lucide-react";
import PlatformIcon from "@/components/viral/PlatformIcon";
import { StatusBadge } from "@/components/viral/StatusBadge";
import { Image } from "@/components/ui/image";

// A single Signal in the live feed. Variants by mediaType create natural timeline rhythm.
export default function SignalCard({ signal, index = 0 }) {
  const isVideo = signal.mediaType === "video";
  const isText = signal.mediaType === "text";
  const mediaForward = isVideo || (!isText && index % 3 === 0);

  return (
    <Link
      to={`/signal/${signal.id}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-border-strong hover:-translate-y-0.5 animate-flare-fade"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {mediaForward && !isText && (
        <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
          <Image src={signal.thumb} alt={signal.title} fittingType="fill" className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium">
              <PlatformIcon platform={signal.platform} size={12} />
              {signal.creator}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={signal.status} />
          </div>
          {isVideo && (
            <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white ml-0.5" />
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          {!mediaForward || isText ? (
            <div className="flex items-center gap-2 text-[11px] text-secondarytext">
              <PlatformIcon platform={signal.platform} size={13} />
              <span className="font-medium">{signal.creator}</span>
              <span className="text-mutedtext">·</span>
              <span className="font-mono-nums">{signal.age} ago</span>
            </div>
          ) : (
            <span className="text-[11px] text-mutedtext font-mono-nums">detected {signal.age} ago</span>
          )}
          {!mediaForward && <StatusBadge status={signal.status} />}
        </div>

        <h3 className="font-heading font-semibold text-foreground text-base leading-tight mb-1.5 group-hover:text-primary transition-colors">
          {signal.title}
        </h3>
        <p className="text-[13px] text-secondarytext leading-snug mb-3.5 line-clamp-2">{signal.narrative}</p>

        <div className="flex items-end justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-end gap-5">
            <div className="flex flex-col">
              <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">VIRAL SCORE</span>
              <span className="font-mono-nums text-lg font-semibold text-primary leading-none mt-1">{signal.viralScore}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">Velocity</span>
              <span className="font-mono-nums text-sm font-medium text-foreground leading-none mt-1.5">+{signal.velocity}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">{signal.views === "—" ? "Mentions" : "Views"}</span>
              <span className="font-mono-nums text-sm font-medium text-foreground leading-none mt-1.5">{signal.views === "—" ? signal.mentions : signal.views}</span>
            </div>
          </div>
          <span className="text-[11px] font-heading font-medium text-secondarytext group-hover:text-primary transition-colors flex items-center gap-0.5">
            {signal.launched ? "View Market" : "View Signal"}
            <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}