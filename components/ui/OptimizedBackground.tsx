'use client';

import Image from 'next/image';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { getAppBackgroundConfig } from '@/lib/constants/images';

interface OptimizedBackgroundProps {
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
  priority?: boolean;
  overlay?: string;
  overlayOpacity?: number;
  useAppDefault?: boolean;
  variant?: 'default' | 'elegant' | 'natural';
}

export default function OptimizedBackground({
  src,
  alt = 'Background',
  children,
  className = '',
  priority = false,
  overlay,
  overlayOpacity,
  useAppDefault = false,
  variant = 'default'
}: OptimizedBackgroundProps) {
  const appConfig = useAppDefault ? getAppBackgroundConfig(variant) : null;
  const backgroundSrc = useAppDefault && appConfig ? appConfig.background : src;
  const overlaySrc = useAppDefault && appConfig ? appConfig.overlay : overlay;
  const opacity = useAppDefault && appConfig ? appConfig.overlayOpacity : (overlayOpacity ?? 0.3);

  if (!backgroundSrc) {
    console.warn('OptimizedBackground: No background source provided');
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -2,
        }}
      >
        <Image
          src={backgroundSrc}
          alt={alt}
          fill
          priority={priority}
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
          style={{
            backgroundAttachment: 'fixed',
          }}
        />
      </motion.div>
      
      {/* Overlay Image */}
      {overlaySrc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            backgroundImage: `url(${overlaySrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            opacity: opacity,
            pointerEvents: 'none',
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