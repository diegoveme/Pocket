"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/constants";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.75,
        delay,
        ease: EASE_OUT_EXPO,
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
};

export function StaggerReveal({
  children,
  className = "",
  stagger = 0.12,
}: StaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 32 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: reduceMotion ? 0.2 : 0.8,
            ease: EASE_OUT_EXPO,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
