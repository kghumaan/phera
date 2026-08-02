import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { WEBSITE_TEMPLATES } from '@/lib/constants/website-templates';
import { BACKGROUND_UI_OPTIONS, FRAME_UI_OPTIONS, BACKGROUNDS, FRAMES } from '@/lib/constants/images';
import { COUPLE_NAME_FONTS } from '@/lib/constants/fonts';
import {
  THEME_COLOR_OPTIONS,
  themeColorValue,
  designUsesProAssets,
} from '@/lib/constants/design-options';
import WebsiteTemplateGallery from '@/components/admin/WebsiteTemplateGallery';

// ─── Data integrity: every template must use real, selectable options ──

describe('WEBSITE_TEMPLATES data integrity', () => {
  const bgUrls = new Set<string>(BACKGROUND_UI_OPTIONS.map((b) => b.url));
  const frameUrls = new Set<string>(FRAME_UI_OPTIONS.map((f) => f.url));
  const fontIds = new Set<string>(COUPLE_NAME_FONTS.map((f) => f.id));
  const colorValues = new Set<string>(THEME_COLOR_OPTIONS.map((c) => c.value));

  it('has exactly 6 templates with unique ids', () => {
    expect(WEBSITE_TEMPLATES).toHaveLength(6);
    const ids = WEBSITE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(WEBSITE_TEMPLATES)('template "$id" only references existing options', (template) => {
    expect(bgUrls.has(template.config.background_image)).toBe(true);
    expect(frameUrls.has(template.config.frame_image_url)).toBe(true);
    expect(fontIds.has(template.config.couple_name_font)).toBe(true);
    expect(colorValues.has(template.config.primary_color)).toBe(true);
    expect(template.name.length).toBeGreaterThan(0);
    expect(template.description.length).toBeGreaterThan(0);
  });
});

// ─── Pro-tier detection mirrors the editor gating ──────────────────────

describe('designUsesProAssets', () => {
  it('treats the all-free Timeless combo as free', () => {
    expect(
      designUsesProAssets({
        background_image: BACKGROUNDS.BLUE_CLOUDS,
        primary_color: themeColorValue('Rose'),
        frame_image_url: FRAMES.FRAME_4,
      }),
    ).toBe(false);
  });

  it('flags a Pro background', () => {
    expect(
      designUsesProAssets({
        background_image: BACKGROUNDS.MARBLE_GOLD, // not in the first 4
        primary_color: themeColorValue('Rose'),
        frame_image_url: FRAMES.FRAME_4,
      }),
    ).toBe(true);
  });

  it('flags a Pro colour', () => {
    expect(
      designUsesProAssets({
        background_image: BACKGROUNDS.BLUE_CLOUDS,
        primary_color: themeColorValue('Amber'), // beyond free count
        frame_image_url: FRAMES.FRAME_4,
      }),
    ).toBe(true);
  });

  it('flags a Pro frame', () => {
    expect(
      designUsesProAssets({
        background_image: BACKGROUNDS.BLUE_CLOUDS,
        primary_color: themeColorValue('Rose'),
        frame_image_url: FRAMES.FRAME_11, // Pro frame
      }),
    ).toBe(true);
  });

  it('never counts a custom uploaded background as Pro', () => {
    expect(
      designUsesProAssets({
        background_image: 'https://cdn.example.com/my-photo.jpg',
        hasCustomBackground: true,
        primary_color: themeColorValue('Rose'),
        frame_image_url: FRAMES.FRAME_4,
      }),
    ).toBe(false);
  });
});

// ─── Gallery interaction: non-destructive preview + explicit apply ─────

describe('WebsiteTemplateGallery', () => {
  const baseProps = {
    coupleNames: 'Simran & Karanvir',
    sampleImageUrl: null,
    isPro: true,
    previewId: null as string | null,
    appliedId: null as string | null,
    onPreview: vi.fn(),
    onApply: vi.fn(),
  };

  it('renders a card for every template', () => {
    render(<WebsiteTemplateGallery {...baseProps} />);
    for (const t of WEBSITE_TEMPLATES) {
      expect(screen.getByText(t.name)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: `Preview the ${t.name} template` }),
      ).toBeInTheDocument();
    }
  });

  it('previews a template on click (does not apply it)', () => {
    const onPreview = vi.fn();
    const onApply = vi.fn();
    render(<WebsiteTemplateGallery {...baseProps} onPreview={onPreview} onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview the Timeless template' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview.mock.calls[0][0]).toMatchObject({ id: 'timeless' });
  });

  it('clicking the active card again clears the preview', () => {
    const onPreview = vi.fn();
    render(
      <WebsiteTemplateGallery {...baseProps} previewId="timeless" onPreview={onPreview} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview the Timeless template' }));
    expect(onPreview).toHaveBeenCalledWith(null);
  });

  it('shows an action bar while previewing and applies on confirm', () => {
    const onApply = vi.fn();
    const onPreview = vi.fn();
    render(
      <WebsiteTemplateGallery
        {...baseProps}
        previewId="timeless"
        onApply={onApply}
        onPreview={onPreview}
      />,
    );

    expect(screen.getByText(/not saved yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply this look/i }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({ id: 'timeless' });

    fireEvent.click(screen.getByRole('button', { name: /back to my design/i }));
    expect(onPreview).toHaveBeenCalledWith(null);
  });

  it('shows PRO badges only for Pro templates when the user is not Pro', () => {
    const proCount = WEBSITE_TEMPLATES.filter((t) => designUsesProAssets(t.config)).length;
    expect(proCount).toBeGreaterThan(0);

    const { rerender } = render(<WebsiteTemplateGallery {...baseProps} isPro={false} />);
    expect(screen.getAllByText('PRO')).toHaveLength(proCount);

    rerender(<WebsiteTemplateGallery {...baseProps} isPro={true} />);
    expect(screen.queryAllByText('PRO')).toHaveLength(0);
  });
});
