'use client';

/**
 * FeatureStepper Step 03 mock — "Save-the-dates, invites, and a 24/7 reply bot."
 *
 * Mirrors the dark "24/7 concierge" panel's phone EXACTLY — same
 * IPhoneMockup chrome (status bar, dynamic island, side buttons),
 * same WhatsAppConcierge props (hideNotch, dense, scripted,
 * CONCIERGE_MESSAGES). Just sized a touch smaller so the whole device
 * fits inside the FeatureStepper's tinted viewport (~496px tall).
 * The aspect ratio (9/19) is fixed inside IPhoneMockup so reducing the
 * width naturally scales the height to match.
 *
 * The default IPhoneMockup drop shadow is muted via the sx override —
 * on the dark concierge panel the shadow blends into the background,
 * but on the FeatureStepper's light tinted card it would read as a
 * halo. The inset edge highlight is preserved for the metallic edge.
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
      }}
    >
      <IPhoneMockup
        // Step 03 panel is capped at 640px square; once the FeatureStepper
        // inset is applied, the inner area is ~580px tall. We size the
        // phone smaller than the 24/7 concierge panel below so it sits
        // comfortably with margin top + bottom (status bar + home indicator
        // visible). Widths are roughly 80% of the concierge panel's.
        width={{ xs: '200px', sm: '220px', md: '236px', lg: '256px' }}
        sx={{
          mx: 'auto',
          boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.4)',
        }}
      >
        <WhatsAppConcierge
          hideNotch
          dense
          compact
          scripted
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
  );
}
