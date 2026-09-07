import React from "react";
import { Link } from "@/lib/navigation";
import { ArrowRight, Radar, Gauge, Rocket } from "lucide-react";
import Button from "@/components/viral/Button";

const STEPS = [
  { icon: Radar, label: "Detect" },
  { icon: Gauge, label: "Score" },
  { icon: Rocket, label: "Launch" },
];

export default function LaunchCTA() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 flare-grid opacity-20" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(70% 120% at 10% 110%, rgba(17,20,59,0.6), transparent 70%)" }}
      />
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.label}>
                <span className="flex items-center gap-1.5 text-[11px] font-heading font-semibold tracking-[0.12em] uppercase text-secondarytext">
                  <s.icon size={13} className="text-primary" />
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <span className="text-mutedtext/50">→</span>}
              </React.Fragment>
            ))}
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground tracking-tight leading-tight text-balance">
            See a trend? Launch it on Robinhood Chain in under a minute.
          </h2>
          <p className="mt-3 text-secondarytext max-w-lg">
            TRND.fun preserves the source event, recommends the matching RWA, and prepares the launch through o1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button as={Link} to="/create" size="lg" className="group">
            Launch a token
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <Button as={Link} to="/live" size="lg" variant="outline">
            Browse Viral Events
          </Button>
        </div>
      </div>
    </section>
  );
}
