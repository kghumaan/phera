'use client';

/**
 * FeatureStepper "WhatsApp outreach" mock.
 *
 * The phone is scaled UP and the square stage clips it (overflow:hidden), so
 * the status bar + home indicator crop away and we zoom right into the chat —
 * bigger, more readable bubbles than a full-device shot. On mount (the
 * FeatureStepper remounts this when the step becomes active) it plays a quick
 * zoom-in, then the scripted conversation drips in at a slower `pace`.
 */

import { Box } from '@mui/material';
import IPhoneMockup from '@/components/ui/IPhoneMockup';
import WhatsAppConcierge from '@/components/ui/WhatsAppConcierge';
import { CONCIERGE_MESSAGES } from '../concierge-messages';

export default function WhatsAppBotMock() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        '@keyframes wa-zoom-in': {
          from: { transform: 'scale(1.06)', opacity: 0.2 },
          to: { transform: 'scale(1.42)', opacity: 1 },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& .wa-zoom': { animation: 'none', transform: 'scale(1.42)' },
        },
      }}
    >
      <Box
        className="wa-zoom"
        sx={{
          display: 'flex',
          // Zoom into the chat (scales the whole phone incl. text); the parent
          // clips the overflow so the top/bottom of the device crop away.
          transformOrigin: 'center',
          animation: 'wa-zoom-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <IPhoneMockup
          width={{ xs: '232px', sm: '250px', md: '264px', lg: '280px' }}
          sx={{
            mx: 'auto',
            boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.4)',
          }}
        >
          <WhatsAppConcierge
            hideNotch
            dense
            scripted
            pace={1.6}
            messages={CONCIERGE_MESSAGES}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 0,
            }}
          />
        </IPhoneMockup>
      </Box>
    </Box>
  );
}
