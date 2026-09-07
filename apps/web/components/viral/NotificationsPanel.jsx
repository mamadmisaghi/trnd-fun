import React from "react";
import { X, TrendingUp, Rocket, GraduationCap, UserPlus, Flame } from "lucide-react";
import { notifications } from "@/data";

const iconMap = {
  score: { icon: TrendingUp, color: "#9CFF2E" },
  launch: { icon: Rocket, color: "#9CFF2E" },
  graduate: { icon: GraduationCap, color: "#F3F5F3" },
  creator: { icon: UserPlus, color: "#A2AAA1" },
  heat: { icon: Flame, color: "#9CFF2E" },
};

export default function NotificationsPanel({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/40" />
      <div
        className="absolute top-14 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-96 bg-deep border border-border-strong rounded-lg shadow-2xl overflow-hidden animate-flare-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <span className="font-heading font-semibold text-sm tracking-wide">Activity</span>
          <button onClick={onClose} className="text-mutedtext hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.map((n) => {
            const { icon: Icon, color } = iconMap[n.type] || iconMap.heat;
            return (
              <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer">
                <div className="mt-0.5 shrink-0" style={{ color }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">{n.title}</p>
                  <p className="text-xs text-mutedtext mt-0.5 truncate">{n.sub}</p>
                </div>
                <span className="font-mono-nums text-[10px] text-mutedtext shrink-0">{n.time}</span>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button className="text-xs text-secondarytext hover:text-primary transition-colors">Mark all read</button>
        </div>
      </div>
    </div>
  );
}