'use client';

import Image from 'next/image';
import { useState } from 'react';

type AssetImageProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function AssetImage({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  className = '',
  priority = false,
}: AssetImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={() => {
        if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
      }}
    />
  );
}
