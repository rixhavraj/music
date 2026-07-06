import Image from "next/image";

type TrackArtProps = {
  src?: string | null;
  alt: string;
  size?: number;
  priority?: boolean;
  className?: string;
};

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555'%3E%3Cpath d='M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z'/%3E%3C/svg%3E";

export function TrackArt({ src, alt, size = 56, priority = false, className }: TrackArtProps) {
  const safeSrc = src && typeof src === "string" ? src : FALLBACK;
  const isExternal = safeSrc.startsWith("http") || safeSrc.startsWith("data:");

  return (
    <Image
      src={safeSrc}
      alt={alt || "Track artwork"}
      width={size}
      height={size}
      priority={priority}
      unoptimized={safeSrc.endsWith(".svg") || isExternal}
      className={`shrink-0 object-cover w-full h-full ${className || ""}`}
    />
  );
}
