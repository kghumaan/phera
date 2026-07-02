'use client';

/**
 * Floating, dismissible launch announcement on the landing page.
 *
 * The landing header is `position: fixed` over the hero, so a top strip would
 * collide with it — instead this floats bottom-center, above page content but
 * below modals. Dismissal persists in localStorage so it shows once per visitor
 * (until they clear storage). Copy frames the early-access offer without naming
 * it "beta": we're onboarding the first couples & planners hands-on, for free.
 */

import { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

const DISMISS_KEY = 'phera_launch_banner_dismissed_v1';

export default function LandingAnnouncementBar() {
  // Start hidden; reveal only after we've confirmed it wasn't dismissed, so a
  // returning visitor never sees a flash of the banner.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) !== '1') setVisible(true);
    } catch {
      setVisible(true); // storage blocked — still show it
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage blocked — session-only dismissal is fine */
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          role="status"
          sx={{
            position: 'fixed',
            zIndex: 1200,
            bottom: { xs: 12, md: 96 },
            left: { xs: 12, md: 'auto' },
            right: { xs: 12, md: 32 },
            width: { xs: 'auto', md: 'min(450px, calc(100vw - 48px))' },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.25, md: 1.75 },
            bgcolor: COLORS.bg.white,
            border: `1px solid ${COLORS.brand.primaryBorder}`,
            borderRadius: RADII.dialog,
            boxShadow: SHADOWS.dialog,
            px: { xs: 1.75, md: 2.5 },
            py: { xs: 1.25, md: 1.5 },
          }}
        >
          {/* <Box
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: RADII.pill,
              bgcolor: COLORS.brand.primarySubtle,
              color: COLORS.brand.primary,
            }}
          >
            <AutoAwesome sx={{ fontSize: 18 }} />
          </Box> */}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="div"
              sx={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text.strong, lineHeight: 1.35 }}
            >
              We&apos;re building custom features free — for our first 10 couples &amp; planners
            </Typography>
            <Typography
              component="div"
              sx={{ fontSize: '0.875rem', color: COLORS.text.muted, lineHeight: 1.45, mt: 0.25}}
            >
              <Box
                component="a"
                href="https://cal.com/simmetry-studios/phera?overlayCalendar=true"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: COLORS.brand.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                See how we can help →
              </Box>
            </Typography>
          </Box>

          <IconButton
            aria-label="Dismiss announcement"
            onClick={dismiss}
            size="small"
            sx={{ flexShrink: 0, color: COLORS.text.faint, alignSelf: 'flex-start' }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </AnimatePresence>
  );
}
