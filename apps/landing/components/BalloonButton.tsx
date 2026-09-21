'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { EASE_OUT_EXPO } from '@/lib/constants';

type BalloonButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function BalloonButton({ href, children, className = '' }: BalloonButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 0.96 }}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
    >
      <Link
        href={href}
        className={`inline-flex items-center justify-center rounded-full bg-yellow px-8 py-4 text-base font-semibold text-navy shadow-[0_6px_0_#c9a832,0_10px_24px_rgba(255,210,63,0.25)] transition-shadow hover:shadow-[0_4px_0_#c9a832,0_8px_20px_rgba(255,210,63,0.2)] ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
