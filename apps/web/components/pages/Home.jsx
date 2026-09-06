"use client";
import React from "react";
import Hero from "@/components/viral/Hero";
import LandingSignals from "@/components/viral/LandingSignals";
import RecentLaunchesTicker from "@/components/viral/RecentLaunchesTicker";
import LaunchCTA from "@/components/viral/LaunchCTA";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero launchpad */}
      <Hero />

      {/* Filterable live signal browser */}
      <LandingSignals />

      {/* Recent launches ticker */}
      <RecentLaunchesTicker />

      {/* Launch CTA */}
      <LaunchCTA />
    </div>
  );
}
