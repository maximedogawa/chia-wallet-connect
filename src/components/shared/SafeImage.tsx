'use client'

interface SafeImageProps {
  src: string
  width: number
  height?: number
  alt: string
  className?: string
  unoptimized?: boolean
}

/**
 * SafeImage component that handles both local and external images.
 * Uses standard img tag for cross-platform compatibility (works in any React app, not just Next.js).
 */
export default function SafeImage({ src, width, height, alt, className, unoptimized }: SafeImageProps) {
  return (
    <img
      src={src}
      width={width}
      height={height || width}
      alt={alt}
      className={className}
    />
  )
}
