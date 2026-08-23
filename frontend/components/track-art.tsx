"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type TrackArtProps = {
  src?: string | null;
  alt: string;
  size?: number;
  priority?: boolean;
  className?: string;
};

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555'%3E%3Cpath d='M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z'/%3E%3C/svg%3E";

export function TrackArt({ src, alt, size = 56, priority = false, className }: TrackArtProps) {
  const initialSrc = src && typeof src === "string" ? src : FALLBACK;
  const [imgSrc, setImgSrc] = useState(initialSrc);

  // Update if src prop changes
  useEffect(() => {
    setImgSrc(src && typeof src === "string" ? src : FALLBACK);
  }, [src]);

  const isExternal = imgSrc.startsWith("http") || imgSrc.startsWith("data:");

  return (
    <Image
      src={imgSrc}
      alt={alt || "Track artwork"}
      width={size}
      height={size}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding={priority ? "sync" : "async"}
      unoptimized={imgSrc.endsWith(".svg") || isExternal}
      className={`shrink-0 object-cover w-full h-full ${className || ""}`}
      onError={() => {
        setImgSrc(FALLBACK);
      }}
    />
  );
}
