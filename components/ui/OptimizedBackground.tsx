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
  useAppDefault?: boolean;
  variant?: 'default' | 'elegant' | 'natural';
}

export default function OptimizedBackground({
  src,
  alt = 'Background',
  children,
  className = '',
  priority = false,
  useAppDefault = false,
  variant = 'default'
}: OptimizedBackgroundProps) {
  const appConfig = useAppDefault ? getAppBackgroundConfig(variant) : null;
  const backgroundSrc = useAppDefault && appConfig ? appConfig.background : src;

  if (!backgroundSrc) {
    console.warn('OptimizedBackground: No background source provided');
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="fixed inset-0 -z-10"
        style={{
          // Ensure the container covers the entire viewport
          minHeight: '100svh', // Use svh to account for mobile browser chrome (address bar, nav buttons)
          minWidth: '100vw',
        }}
      >
        <Image
          src={backgroundSrc}
          alt={alt}
          fill
          priority={priority}
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 min-h-svh">
        {children}
      </div>
    </div>
  );
} 