'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

interface OptimizedBackgroundProps {
  src: string;
  alt: string;
  children?: ReactNode;
  className?: string;
  priority?: boolean;
  overlay?: string;
  overlayOpacity?: number;
}

export default function OptimizedBackground({
  src,
  alt,
  children,
  className = '',
  priority = false,
  overlay,
  overlayOpacity = 0.3
}: OptimizedBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={85}
        sizes="100vw"
        className="object-cover object-center"
        style={{
          zIndex: -2,
        }}
      />
      
      {/* Overlay Image */}
      {overlay && (
        <Image
          src={overlay}
          alt="Decorative overlay"
          fill
          priority={priority}
          quality={85}
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
          style={{
            zIndex: -1,
            opacity: overlayOpacity,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 