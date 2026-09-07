"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Hero from "@/components/viral/Hero";
import LandingSignals from "@/components/viral/LandingSignals";
import RecentLaunchesTicker from "@/components/viral/RecentLaunchesTicker";
import LaunchCTA from "@/components/viral/LaunchCTA";

export default function Home() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };
  return (
    <motion.div className="bg-background min-h-screen" initial={reduceMotion ? false : "hidden"} animate="visible" variants={reduceMotion ? undefined : { visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } } }}>
      <motion.div variants={reveal}><Hero /></motion.div>
      <motion.div variants={reveal}><LandingSignals /></motion.div>
      <motion.div variants={reveal}><RecentLaunchesTicker /></motion.div>
      <motion.div variants={reveal}><LaunchCTA /></motion.div>
    </motion.div>
  );
}
