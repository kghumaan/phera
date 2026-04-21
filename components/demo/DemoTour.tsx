'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, IconButton, alpha, useMediaQuery, useTheme } from '@mui/material';
import { Close, ArrowForward, ArrowBack } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { COLORS } from '@/lib/theme/tokens';

interface TourStep {
  target: string;
  title: string;
  description: string;
  /** Extra sentence rendered only on mobile, below the main description. */
  mobileNote?: string;
  noSpotlight?: boolean;
  navigateTo?: string;
  expandGroup?: string; // group id (e.g. 'website', 'guest-responses')
  sidebarCutout?: boolean; // cut out entire sidebar instead of single element
  tooltipPosition?: 'right' | 'below-target' | 'left-of-target';
  extraTargets?: string[]; // additional data-tour targets to union into the spotlight
  /** Force the tooltip to pin to the top of the viewport on mobile. */
  mobileTopPin?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'tour-overview',
    title: 'Welcome to Phera',
    description: 'This is your wedding command center. Everything you need to plan, coordinate, and run your celebration lives here.',
    mobileNote: 'For the full experience we recommend viewing Phera on a desktop.',
  },
  {
    target: 'tour-wedding-website',
    title: 'Your Wedding Website',
    description: "Build a beautiful, bespoke site for your guests — schedule, FAQ, registry, travel info, and more. Design it yourself, let AI build it, or work with our team.",
    navigateTo: '/details',
    expandGroup: 'wedding-website',
  },
  {
    target: 'tour-preview',
    title: 'Live Preview',
    description: 'See your wedding website update in real time as you make changes. Toggle between Desktop and Mobile views to see exactly what your guests will experience.',
    tooltipPosition: 'left-of-target',
  },
  {
    target: 'tour-pins',
    title: 'Event Access',
    description: 'Set PIN codes to control who sees what. Restrict sensitive events to close family, decide who gets a plus-one, and manage access levels — all from here.',
    expandGroup: 'wedding-website',
  },
  {
    target: 'tour-guests-group',
    title: 'Guest Management',
    description: "Import your guest list, track RSVPs, dietary needs, plus-ones, and every detail your guests share — collected and organized in one dashboard.",
    expandGroup: 'guests-group',
  },
  {
    target: 'tour-rooms',
    title: 'Travel, Rooms & Shuttles',
    description: "Hotel blocks, room assignments, flight details, airport pickups, and shuttle routes — all coordinated so no one gets stranded. We collect travel plans from every guest and optimize the logistics.",
    expandGroup: 'guests-group',
    extraTargets: ['tour-transportation'],
  },
  {
    target: 'tour-concierge',
    title: 'WhatsApp Agent',
    description: "Your guests' 24/7 agent on WhatsApp. Answers schedule, venue, dress code, and local questions instantly — in English or Hindi, in their timezone.",
    expandGroup: 'guests-group',
  },
  {
    target: 'tour-task-manager',
    title: 'Task Manager',
    description: "Organize your entire planning process on a Kanban board. Ramble with voice about what's on your mind and we'll keep track — vendors, to-dos, deadlines, all of it.",
    expandGroup: 'planning',
  },
  {
    target: 'tour-coordinator',
    title: 'Vendor Coordinator',
    description: "Add our Agent to your WhatsApp groups with caterers, florists, and decorators. It summarizes threads, extracts action items, and flags risks so nothing slips.",
    expandGroup: 'planning',
  },
  {
    target: 'tour-collaborators',
    title: 'Collaborators',
    description: "Invite your partner, family members, or planner to help. Add them as admins so they can contribute, edit details, and manage things alongside you.",
    mobileTopPin: true,
  },
  {
    target: 'tour-cta',
    title: 'Ready to plan your wedding?',
    description: '',
    noSpotlight: true,
  },
];

const SESSION_KEY = 'demo-tour-step';
const PADDING = 8;
const TOOLTIP_WIDTH = 340;

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface DemoTourProps {
  weddingSlug: string;
}

export default function DemoTour({ weddingSlug }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [isActive, setIsActive] = useState(true);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [sidebarRect, setSidebarRect] = useState<TargetRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const pathname = usePathname();

  const step = TOUR_STEPS[currentStep];
  const totalSteps = TOUR_STEPS.filter(s => !s.noSpotlight).length;

  // Persist step to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, String(currentStep));
  }, [currentStep]);

  const endTour = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsActive(false);
  }, []);

  // Measure the sidebar drawer
  const measureSidebar = useCallback(() => {
    const drawer = document.querySelector('.MuiDrawer-paper');
    if (!drawer) return;
    const rect = drawer.getBoundingClientRect();
    setSidebarRect({
      top: 0,
      left: rect.left,
      width: rect.width,
      height: window.innerHeight,
    });
  }, []);

  const measureTarget = useCallback(() => {
    if (!step || step.noSpotlight) {
      setTargetRect(null);
      return;
    }

    // Resolve all targets (primary + extras) to DOM rects
    const resolve = (sel: string) =>
      document.querySelector(`[data-tour="${sel}"]`) ||
      document.querySelector(`[data-tour-group="${sel.replace('tour-', '').replace('-group', '')}"]`);

    const rects: DOMRect[] = [];
    const primaryEl = resolve(step.target);
    if (primaryEl) rects.push(primaryEl.getBoundingClientRect());
    if (step.extraTargets) {
      for (const extra of step.extraTargets) {
        const el = resolve(extra);
        if (el) rects.push(el.getBoundingClientRect());
      }
    }

    if (rects.length === 0) {
      setTargetRect(null);
      return;
    }

    // Union all rects into a single bounding box
    const top = Math.min(...rects.map(r => r.top));
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));
    const bottom = Math.max(...rects.map(r => r.bottom));

    setTargetRect({
      top: top - PADDING,
      left: left - PADDING,
      width: (right - left) + PADDING * 2,
      height: (bottom - top) + PADDING * 2,
    });

    if (step.sidebarCutout) {
      measureSidebar();
    }
  }, [step, measureSidebar]);

  // Expand a sidebar group by clicking its header if subitems aren't visible
  const expandSidebarGroup = useCallback((groupId: string) => {
    // The sidebar uses id="sidebar-items-{groupId}" on the subitems container.
    // With unmountOnExit, this element only exists when expanded.
    const itemsContainer = document.getElementById(`sidebar-items-${groupId}`);
    if (itemsContainer) return; // Already expanded

    // Click the group header to expand
    const groupEl = document.querySelector(`[data-tour="tour-${groupId}"]`);
    if (groupEl) {
      (groupEl as HTMLElement).click();
    }
  }, []);

  // On mobile, the sidebar is a temporary drawer. Most tour steps point at a
  // sidebar item — those elements live in the DOM (keepMounted) but sit
  // translated off-screen when the drawer is closed, so the spotlight lands
  // outside the viewport. Ask the admin layout to open/close the drawer based
  // on whether the current step actually targets a sidebar element.
  //
  // The effect depends on `pathname` so it re-fires after every navigation
  // (step 2 navigates to /details), and the 60ms delay lets the layout's own
  // `[pathname]` effect (which blanket-closes the drawer) run first. Without
  // that, the drawer would flash open and immediately close again as the
  // layout's close wins the race.
  useEffect(() => {
    if (!isActive || !step || !isMobile) return;
    const t = setTimeout(() => {
      const targetEl = document.querySelector(`[data-tour="${step.target}"]`);
      const isInSidebar = !!targetEl?.closest('.MuiDrawer-paper');
      window.dispatchEvent(new CustomEvent(
        isInSidebar ? 'phera:open-mobile-sidebar' : 'phera:close-mobile-sidebar'
      ));
    }, 60);
    return () => clearTimeout(t);
  }, [currentStep, isActive, step, isMobile, pathname]);

  // Handle step changes: navigation, sidebar expansion
  useEffect(() => {
    if (!isActive || !step) return;

    // Navigate if needed
    if (step.navigateTo) {
      const targetPath = `/admin/${weddingSlug}${step.navigateTo}`;
      if (!pathname.endsWith(step.navigateTo) && !pathname.endsWith(step.navigateTo + '/')) {
        router.push(targetPath + '?tour=true');
        return; // Will re-mount after navigation
      }
    }

    // Expand sidebar group if needed (with retries for DOM readiness)
    if (step.expandGroup) {
      // Try immediately, then retry after delays for DOM to settle
      expandSidebarGroup(step.expandGroup);
      const t1 = setTimeout(() => expandSidebarGroup(step.expandGroup!), 150);
      const t2 = setTimeout(() => expandSidebarGroup(step.expandGroup!), 400);

      // Measure after expansion animation completes
      const t3 = setTimeout(measureTarget, 600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // No group expansion needed, measure right away.
    // Delay slightly longer on mobile to let the sidebar drawer transition in
    // (MUI default ~225ms) before we compute the spotlight rect.
    const timer = setTimeout(measureTarget, isMobile ? 300 : 150);

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(measureTarget);
    observerRef.current.observe(document.body);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [currentStep, isActive, measureTarget, step, router, weddingSlug, pathname, expandSidebarGroup]);

  // Keep measuring after expansion settles (separate effect for resize/scroll)
  useEffect(() => {
    if (!isActive || !step) return;

    observerRef.current?.disconnect();
    observerRef.current = new ResizeObserver(measureTarget);
    observerRef.current.observe(document.body);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isActive, step, measureTarget]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      // Clear the old rect so the new step's tooltip doesn't flash at the
      // previous step's position while we wait for measureTarget to resolve.
      setTargetRect(null);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setTargetRect(null);
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive) return null;

  // Determine cutout rect
  const cutoutRect = step.sidebarCutout && sidebarRect ? sidebarRect : targetRect;

  // Tooltip positioning — always TOOLTIP_WIDTH
  const getTooltipPosition = (): React.CSSProperties => {
    if (step.noSpotlight || !targetRect) {
      return {
        top: `calc(50vh - 150px)`,
        left: `calc(50vw - ${TOOLTIP_WIDTH / 2}px)`,
        width: TOOLTIP_WIDTH,
      };
    }

    if (isMobile) {
      // Pin the tooltip to the viewport's horizontal center using `left`
      // arithmetic rather than a CSS `transform` — framer-motion owns the
      // `transform` property during the enter/exit animation and would
      // clobber any `translateX(-50%)` we set here, pushing the card off to
      // the right.
      const horizontalPad = 16;
      const tooltipW = Math.min(TOOLTIP_WIDTH, window.innerWidth - horizontalPad * 2);
      const tooltipH = 280; // approximate; used to pick a side with room
      const topSafe = 84; // AdminTopNav + small gap
      const bottomSafe = 16;

      // Per-step override (e.g. Collaborators sits low in the sidebar on
      // mobile and the auto-placed tooltip ends up outside the visible
      // drawer area).
      if (step.mobileTopPin) {
        return {
          top: topSafe,
          left: `calc(50vw - ${tooltipW / 2}px)`,
          width: tooltipW,
        };
      }

      const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height) - bottomSafe;
      const spaceAbove = targetRect.top - topSafe;

      // Prefer placing the tooltip below the target. If the target sits low
      // in the viewport (e.g. "Event Access" at the bottom of an expanded
      // group) and the below-target position would overflow, flip to above
      // the target instead — that keeps the spotlighted row visible and the
      // tooltip from overlapping it. Fall back to pinning near the top when
      // neither side has enough room.
      if (spaceBelow >= tooltipH) {
        return {
          top: targetRect.top + targetRect.height + 16,
          left: `calc(50vw - ${tooltipW / 2}px)`,
          width: tooltipW,
        };
      }
      if (spaceAbove >= tooltipH) {
        return {
          top: targetRect.top - tooltipH - 16,
          left: `calc(50vw - ${tooltipW / 2}px)`,
          width: tooltipW,
        };
      }
      return {
        top: topSafe,
        left: `calc(50vw - ${tooltipW / 2}px)`,
        width: tooltipW,
      };
    }

    // Preview panel: below target, centered
    if (step.tooltipPosition === 'below-target') {
      return {
        top: Math.min(targetRect.top + targetRect.height + 16, window.innerHeight - 280),
        left: targetRect.left + (targetRect.width / 2) - (TOOLTIP_WIDTH / 2),
        width: TOOLTIP_WIDTH,
      };
    }

    // Left of target (e.g. preview panel)
    if (step.tooltipPosition === 'left-of-target') {
      return {
        top: Math.max(targetRect.top + (targetRect.height / 2) - 140, 80),
        left: targetRect.left - TOOLTIP_WIDTH - 16,
        width: TOOLTIP_WIDTH,
      };
    }

    // Sidebar cutout: tooltip to the right of the sidebar
    if (step.sidebarCutout && sidebarRect) {
      return {
        top: Math.max(targetRect.top, 80),
        left: sidebarRect.left + sidebarRect.width + 16,
        width: TOOLTIP_WIDTH,
      };
    }

    // Default: to the right of target element
    return {
      top: Math.max(targetRect.top, 80),
      left: targetRect.left + targetRect.width + 16,
      width: TOOLTIP_WIDTH,
    };
  };

  return (
    <>
      {/* Dark overlay — single box-shadow cutout (pixel-perfect, no gaps) */}
      {cutoutRect ? (
        <>
          {/* Visual spotlight: a transparent box with a massive shadow that
              paints the darkened overlay around it. Because the shadow is
              rendered as one continuous paint, there are no seam/gap
              artifacts between strips. pointer-events:none lets the user
              still interact with the underlying element if they want. */}
          <Box
            sx={{
              position: 'fixed',
              top: cutoutRect.top,
              left: cutoutRect.left,
              width: cutoutRect.width,
              height: cutoutRect.height,
              zIndex: 9998,
              pointerEvents: 'none',
              boxShadow: '0 0 0 100vmax rgba(0,0,0,0.6)',
              transition: 'all 0.3s ease',
            }}
          />
          {/* Transparent click-catchers for endTour on the four surrounding
              areas. Visual is already handled above; these only carry the
              click handler. Gaps here are invisible. */}
          <Box
            onClick={endTour}
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, cutoutRect.top), zIndex: 9998, cursor: 'pointer' }}
          />
          <Box
            onClick={endTour}
            sx={{ position: 'fixed', top: cutoutRect.top + cutoutRect.height, left: 0, right: 0, bottom: 0, zIndex: 9998, cursor: 'pointer' }}
          />
          <Box
            onClick={endTour}
            sx={{ position: 'fixed', top: cutoutRect.top, left: 0, width: Math.max(0, cutoutRect.left), height: cutoutRect.height, zIndex: 9998, cursor: 'pointer' }}
          />
          <Box
            onClick={endTour}
            sx={{ position: 'fixed', top: cutoutRect.top, left: cutoutRect.left + cutoutRect.width, right: 0, height: cutoutRect.height, zIndex: 9998, cursor: 'pointer' }}
          />
        </>
      ) : (
        /* No cutout — full overlay */
        <Box
          onClick={endTour}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            bgcolor: 'rgba(0,0,0,0.6)',
            cursor: 'pointer',
          }}
        />
      )}

      {/* Tooltip — hold opacity at 0 until the spotlight target has been
          measured so the card doesn't flash at the centered fallback on
          every step change. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: (targetRect || step.noSpotlight) ? 1 : 0, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: (targetRect || step.noSpotlight) ? 'auto' : 'none',
            ...getTooltipPosition(),
          }}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              p: 3,
              position: 'relative',
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={endTour}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: COLORS.text.faint,
                '&:hover': { color: COLORS.text.subtle },
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            {/* Step indicator */}
            {!step.noSpotlight && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: COLORS.brand.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  mb: 1,
                }}
              >
                Step {currentStep + 1} of {totalSteps}
              </Typography>
            )}

            {/* Title */}
            <Typography
              sx={{
                fontSize: step.noSpotlight ? '1.5rem' : '1.1rem',
                fontWeight: 700,
                color: COLORS.text.strong,
                mb: 1,
                pr: 3,
                fontFamily: step.noSpotlight ? 'var(--font-instrument-serif)' : undefined,
                fontStyle: step.noSpotlight ? 'italic' : undefined,
                textAlign: step.noSpotlight ? 'center' : undefined,
              }}
            >
              {step.title}
            </Typography>

            {/* Description */}
            {step.description && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: COLORS.text.subtle,
                  lineHeight: 1.6,
                  mb: step.mobileNote && isMobile ? 1.25 : 2.5,
                  textAlign: step.noSpotlight ? 'center' : undefined,
                }}
              >
                {step.description}
              </Typography>
            )}

            {/* Mobile-only note, e.g. recommending desktop on the welcome step */}
            {step.mobileNote && isMobile && (
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: COLORS.brand.primary,
                  lineHeight: 1.5,
                  mb: 2.5,
                }}
              >
                {step.mobileNote}
              </Typography>
            )}

            {/* CTA step */}
            {step.noSpotlight ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', mt: 2 }}>
                <Button
                  onClick={endTour}
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: COLORS.brand.primary,
                    color: COLORS.text.inverse,
                    px: 5,
                    py: 1.5,
                    borderRadius: '32px',
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: COLORS.brand.primaryHover },
                  }}
                >
                  Continue Exploring
                </Button>
                <Button
                  component={Link}
                  href="/auth/login"
                  variant="text"
                  sx={{
                    color: COLORS.text.faint,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { color: COLORS.text.subtle, bgcolor: 'transparent' },
                  }}
                >
                  Start Planning Free
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  onClick={endTour}
                  variant="text"
                  size="small"
                  sx={{
                    color: COLORS.text.faint,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { color: COLORS.text.subtle, bgcolor: 'transparent' },
                  }}
                >
                  Skip tour
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {currentStep > 0 && (
                    <IconButton
                      onClick={handleBack}
                      size="small"
                      sx={{
                        color: COLORS.text.subtle,
                        border: '1px solid',
                        borderColor: alpha(COLORS.text.strong, 0.12),
                        '&:hover': { bgcolor: alpha(COLORS.text.strong, 0.04) },
                      }}
                    >
                      <ArrowBack fontSize="small" />
                    </IconButton>
                  )}
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: '1rem !important' }} />}
                    sx={{
                      bgcolor: COLORS.brand.primary,
                      color: 'white',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2,
                      '&:hover': { bgcolor: COLORS.brand.primaryHover },
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {/* Progress dots */}
            {!step.noSpotlight && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 2 }}>
                {TOUR_STEPS.filter(s => !s.noSpotlight).map((_, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: idx === currentStep ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: idx === currentStep ? COLORS.brand.primary : alpha(COLORS.brand.primary, 0.2),
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
