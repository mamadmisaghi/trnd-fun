"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

/** Local Vengeance-style magnetic interaction, kept deliberately subtle for ViralTerminal. */
export function Magnetic({ children, className = "", strength = 1.5 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { damping: 20, stiffness: 230, mass: 0.25 };
  const tx = useSpring(x, spring);
  const ty = useSpring(y, spring);
  const move = (event) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    x.set(((event.clientX - box.left) / box.width - 0.5) * strength * 2);
    y.set(((event.clientY - box.top) / box.height - 0.5) * strength * 2);
  };
  return <motion.span ref={ref} className={className} style={{ x: tx, y: ty }} onMouseMove={move} onMouseLeave={() => { x.set(0); y.set(0); }}>{children}</motion.span>;
}
