import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventDetailCarousel from '@/components/guest/EventDetailCarousel';
import type { CarouselSlide } from '@/lib/supabase/wedding-service';

vi.mock('react-datepicker/dist/react-datepicker.css', () => ({}));

const slides: CarouselSlide[] = [{ type: 'image', src: '/images/x.jpg' } as CarouselSlide];

describe('EventDetailCarousel title', () => {
  it('renders the eventName it is given as the title above the slides', () => {
    // The desktop schedule passes the (possibly renamed) schedule-item name here,
    // not the frozen wedding_events.name — so the title must reflect the prop.
    render(
      <EventDetailCarousel
        eventName="Morning Haldi"
        slides={slides}
        textColor="#ffffff"
        gradientBackground={null}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Morning Haldi')).toBeTruthy();
  });

  it('shows the updated name, never a stale one', () => {
    render(
      <EventDetailCarousel
        eventName="Renamed Reception"
        slides={slides}
        textColor="#ffffff"
        gradientBackground={null}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Renamed Reception')).toBeTruthy();
    expect(screen.queryByText('Reception')).toBeNull();
  });
});
