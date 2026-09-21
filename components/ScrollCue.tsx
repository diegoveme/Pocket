"use client";

import { motion, useReducedMotion } from "motion/react";

export function ScrollCue() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center gap-2 text-sm text-muted"
      animate={reduceMotion ? undefined : { y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <span>Scroll ↓</span>
      <span className="block h-8 w-px bg-celeste/40" />
    </motion.div>
  );
}
