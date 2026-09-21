'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';

type FloatingIconProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  floatIntensity?: number;
  parallaxIntensity?: number;
  delay?: number;
  priority?: boolean;
};

export function FloatingIcon({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  className = '',
  floatIntensity = 12,
  parallaxIntensity = 24,
  delay = 0,
  priority = false,
}: FloatingIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [imgSrc, setImgSrc] = useState(src);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [parallaxIntensity, -parallaxIntensity],
  );

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={reduceMotion ? undefined : { y: parallaxY }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -floatIntensity, 0] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 4 + delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
              }
        }
      >
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(134,212,230,0.2)]"
          onError={() => {
            if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
          }}
        />
      </motion.div>
    </motion.div>
  );
}
