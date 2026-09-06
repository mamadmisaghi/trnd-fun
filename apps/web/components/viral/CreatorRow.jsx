import React from "react";
import { Link } from "@/lib/navigation";
import { BadgeCheck } from "lucide-react";
import PlatformIcon from "@/components/viral/PlatformIcon";

export default function CreatorRow({ creator, index = 0 }) {
  return (
    <Link
      to={`/creator/${creator.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors animate-flare-fade"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <img src={creator.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-heading font-semibold text-foreground truncate">{creator.name}</span>
          {creator.verified && <BadgeCheck size={14} className="text-primary shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <PlatformIcon platform={creator.platform} size={11} className="text-mutedtext" />
          <span className="text-xs text-mutedtext">{creator.handle}</span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">Followers</span>
        <span className="font-mono-nums text-sm text-foreground mt-0.5">{creator.followers}</span>
      </div>
      <div className="hidden md:flex flex-col items-end">
        <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">30D Reach</span>
        <span className="font-mono-nums text-sm text-foreground mt-0.5">{creator.reach30d}</span>
      </div>
      <div className="hidden lg:flex flex-col items-end">
        <span className="text-[9px] font-heading font-semibold tracking-[0.14em] uppercase text-mutedtext">Volume</span>
        <span className="font-mono-nums text-sm text-primary mt-0.5">{creator.totalVolume}</span>
      </div>
    </Link>
  );
}