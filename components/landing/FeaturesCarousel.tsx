'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { ChevronLeft, ChevronRight, AutoAwesome } from '@mui/icons-material';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface FeatureItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  featureImage?: string;
  featureImage2?: string;
  customComponent?: React.ReactNode;
  frameType?: 'desktop' | 'desktop-stacked' | 'mobile' | 'none';
  isPro?: boolean;
}

interface FeaturesCarouselProps {
  items: FeatureItem[];
}

const SWIPE_DRAG_THRESHOLD = 60;

export default function FeaturesCarousel({ items }: FeaturesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const item = items[activeIndex];

  const goTo = (next: number) => {
    setDirection(next > activeIndex ? 1 : -1);
    setActiveIndex((next + items.length) % items.length);
  };

  const prev = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: COLORS.bg.subtle }}>
      <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, md: 4, lg: 6 } }}>
        {/* Arrows — absolute, vertically centered. Hidden on smallest screens to
            avoid clobbering content; the dots underneath drive nav there. */}
        <CarouselArrow side="left" onClick={prev} ariaLabel="Previous feature" />
        <CarouselArrow side="right" onClick={next} ariaLabel="Next feature" />

        <Box
          sx={{
            position: 'relative',
            mx: { xs: 0, md: 8, lg: 10 },
            // Fixed height on md+ so the layout never jumps when switching to
            // the tall phone-frame feature. xs stacks vertically and lets the
            // content size itself naturally.
            height: { md: 460 },
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={item.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_DRAG_THRESHOLD) next();
                else if (info.offset.x > SWIPE_DRAG_THRESHOLD) prev();
              }}
              style={{ touchAction: 'pan-y' }}
            >
              <FeatureCard item={item} />
            </motion.div>
          </AnimatePresence>
        </Box>

        <Stack
          direction="row"
          spacing={1.25}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: { xs: 4, md: 6 } }}
        >
          {items.map((it, idx) => {
            const active = idx === activeIndex;
            return (
              <Box
                key={it.id}
                role="button"
                tabIndex={0}
                aria-label={`Go to feature ${idx + 1}: ${it.title}`}
                onClick={() => goTo(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goTo(idx);
                  }
                }}
                sx={{
                  width: active ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: active ? COLORS.brand.primary : alpha(COLORS.brand.primary, 0.25),
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: active
                      ? COLORS.brand.primary
                      : alpha(COLORS.brand.primary, 0.5),
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${COLORS.brand.primary}`,
                    outlineOffset: 2,
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Mobile-friendly arrow row — visible only on xs since absolute arrows
            are hidden there to avoid covering content. */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mt: 3, display: { xs: 'flex', md: 'none' } }}
        >
          <CarouselArrow side="left" onClick={prev} ariaLabel="Previous feature" inline />
          <CarouselArrow side="right" onClick={next} ariaLabel="Next feature" inline />
        </Stack>
      </Container>
    </Box>
  );
}

interface CarouselArrowProps {
  side: 'left' | 'right';
  onClick: () => void;
  ariaLabel: string;
  inline?: boolean;
}

function CarouselArrow({ side, onClick, ariaLabel, inline = false }: CarouselArrowProps) {
  const sideSx = inline
    ? {}
    : {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side]: { md: 8, lg: 0 },
        display: { xs: 'none', md: 'flex' },
        zIndex: 5,
      };

  return (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        ...sideSx,
        bgcolor: COLORS.bg.white,
        border: '1px solid',
        borderColor: alpha('#000', 0.08),
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        width: 44,
        height: 44,
        color: COLORS.brand.primary,
        '&:hover': {
          bgcolor: COLORS.brand.primary,
          color: COLORS.text.inverse,
          borderColor: COLORS.brand.primary,
        },
      }}
    >
      {side === 'left' ? <ChevronLeft /> : <ChevronRight />}
    </IconButton>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  return (
    <Grid
      container
      spacing={{ xs: 4, md: 6 }}
      alignItems="center"
      sx={{ height: { md: '100%' } }}
    >
      <Grid size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 1 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 600,
                color: COLORS.text.strong,
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </Typography>
            {item.isPro && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.4,
                  bgcolor: alpha(COLORS.brand.primary, 0.08),
                  color: COLORS.brand.primary,
                  px: 1,
                  py: 0.4,
                  borderRadius: RADII.xl,
                  flexShrink: 0,
                }}
              >
                <AutoAwesome sx={{ fontSize: '0.8rem' }} />
                <Typography
                  sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}
                >
                  PRO
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            sx={{
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.6,
              color: COLORS.text.muted,
            }}
          >
            <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 600 }}>
              The problem:
            </Box>{' '}
            {item.problem}
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.6,
              color: COLORS.text.strong,
            }}
          >
            <Box component="span" sx={{ color: COLORS.brand.primary, fontWeight: 600 }}>
              Our solution:
            </Box>{' '}
            {item.solution}
          </Typography>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 2 }} sx={{ height: { md: '100%' } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: { xs: 'auto', md: '100%' },
            minHeight: { xs: 280, md: 0 },
          }}
        >
          <FeatureMedia item={item} />
        </Box>
      </Grid>
    </Grid>
  );
}

function FeatureMedia({ item }: { item: FeatureItem }) {
  if (item.frameType === 'mobile' && (item.featureImage || item.customComponent)) {
    return (
      <Box
        sx={{
          // Constrain by HEIGHT on md+ so the phone frame never blows past the
          // carousel's fixed height. Width auto-derives from the aspect ratio.
          height: { xs: 'auto', md: 420 },
          width: { xs: 220, sm: 240, md: 'auto' },
          aspectRatio: '9 / 18',
          borderRadius: '36px',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
          bgcolor: COLORS.text.strong,
          border: '10px solid #1a1a1a',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 84,
            height: 20,
            bgcolor: COLORS.text.strong,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            zIndex: 20,
          }}
        />
        <Box sx={{ borderRadius: '26px', overflow: 'hidden', lineHeight: 0, height: '100%' }}>
          {item.customComponent ? (
            item.customComponent
          ) : (
            <Image
              src={item.featureImage!}
              alt={item.title}
              fill
              sizes="300px"
              style={{ objectFit: 'cover', objectPosition: 'top' }}
            />
          )}
        </Box>
      </Box>
    );
  }

  if (item.frameType === 'desktop-stacked' && item.featureImage && item.featureImage2) {
    return (
      <Box sx={{ position: 'relative', width: '100%', maxWidth: { md: 520, lg: 600 } }}>
        <DesktopFrame src={item.featureImage} alt={item.title} />
        <Box
          sx={{
            position: 'absolute',
            right: { xs: -12, md: -32 },
            bottom: { xs: -24, md: -40 },
            width: { xs: '60%', md: '55%' },
            transform: 'rotate(2deg)',
          }}
        >
          <DesktopFrame src={item.featureImage2} alt={`${item.title} secondary`} small />
        </Box>
      </Box>
    );
  }

  if (item.frameType === 'desktop' && item.featureImage) {
    return (
      <Box sx={{ width: '100%', maxWidth: { xs: 360, sm: 480, md: 540, lg: 640 } }}>
        <DesktopFrame src={item.featureImage} alt={item.title} />
      </Box>
    );
  }

  // frameType === 'none' — render the custom component as-is, but cap its width.
  if (item.customComponent) {
    return (
      <Box sx={{ width: '100%', maxWidth: { xs: 360, sm: 460, md: 540 } }}>
        {item.customComponent}
      </Box>
    );
  }

  return null;
}

function DesktopFrame({ src, alt, small = false }: { src: string; alt: string; small?: boolean }) {
  return (
    <Box
      sx={{
        borderRadius: small ? '8px' : '12px',
        overflow: 'hidden',
        boxShadow: small
          ? '0 12px 28px rgba(0,0,0,0.14)'
          : '0 18px 40px rgba(0,0,0,0.14)',
        bgcolor: COLORS.bg.white,
        border: '1px solid',
        borderColor: alpha('#000', 0.08),
      }}
    >
      <Box
        sx={{
          height: small ? 22 : 30,
          bgcolor: COLORS.border.faint,
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.08),
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 0.75,
        }}
      >
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: COLORS.accent.danger }} />
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: COLORS.accent.warning }} />
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: COLORS.accent.success }} />
      </Box>
      <Box sx={{ width: '100%', lineHeight: 0, position: 'relative' }}>
        <Image
          src={src}
          alt={alt}
          width={2694}
          height={1302}
          quality={85}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>
    </Box>
  );
}
