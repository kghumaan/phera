import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks (must be before imports) ──────────────────────────────────

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return actual;
});

const mockSupabaseSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSupabaseSingle,
    })),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─── Import after mocks ──────────────────────────────────────────────

import ConciergeKnowledgeBase from '@/components/admin/concierge/ConciergeKnowledgeBase';

// ─── Tests ───────────────────────────────────────────────────────────

describe('ConciergeKnowledgeBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default: venue location exists
    mockSupabaseSingle.mockResolvedValue({
      data: { venue_location: 'Mumbai, India' },
      error: null,
    });
  });

  function mockFetchEntries(entries: any[] = []) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entries }),
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════

  describe('loading', () => {
    it('should show loading spinner initially', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <ConciergeKnowledgeBase weddingId="w-123" />
      );

      const spinner = container.querySelector('.MuiCircularProgress-root');
      expect(spinner).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════════════════════════════════

  describe('empty state', () => {
    it('should show empty message when no entries exist', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('No knowledge base entries yet.')).toBeTruthy();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // GENERATE CITY GUIDE BUTTON
  // ══════════════════════════════════════════════════════════════════

  describe('generate city guide', () => {
    it('should show "Generate City Guide" button when no auto entries exist and venue is set', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Generate City Guide')).toBeTruthy();
      });
    });

    it('should show "Regenerate City Guide" when auto entries already exist', async () => {
      mockFetchEntries([
        { id: '1', title: 'Dining', content: 'Food...', category: 'dining', is_active: true, order_index: 0, source: 'auto_generated' },
      ]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Regenerate City Guide')).toBeTruthy();
      });
    });

    it('should show info text when venue location is missing', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { venue_location: null },
        error: null,
      });

      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Add your venue location/)).toBeTruthy();
      });
    });

    it('should not show generate button when isViewOnly is true', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" isViewOnly />);

      await waitFor(() => {
        expect(screen.getByText('No knowledge base entries yet.')).toBeTruthy();
      });

      expect(screen.queryByText('Generate City Guide')).toBeNull();
    });

    it('should show regeneration confirmation dialog when clicking Regenerate', async () => {
      mockFetchEntries([
        { id: '1', title: 'Dining', content: 'Food...', category: 'dining', is_active: true, order_index: 0, source: 'auto_generated' },
      ]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Regenerate City Guide')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Regenerate City Guide'));

      expect(screen.getByText('Regenerate City Guide?')).toBeTruthy();
      expect(screen.getByText(/replace all AI-generated entries/)).toBeTruthy();
      expect(screen.getByText(/Manual entries won't be affected/)).toBeTruthy();
    });

    it('should call generate API when Generate City Guide is clicked', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Generate City Guide')).toBeTruthy();
      });

      // Mock generate endpoint + reload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [{ id: '1', title: 'Test', content: 'C', category: 'dining' }], count: 1 }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ entries: [{ id: '1', title: 'Test', content: 'C', category: 'dining', is_active: true, order_index: 0, source: 'auto_generated' }] }),
      });

      fireEvent.click(screen.getByText('Generate City Guide'));

      await waitFor(() => {
        // Should have called generate endpoint
        const generateCall = mockFetch.mock.calls.find(
          (call: any[]) => call[0] === '/api/concierge/knowledge/generate'
        );
        expect(generateCall).toBeTruthy();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // ADD ENTRY FORM
  // ══════════════════════════════════════════════════════════════════

  describe('add entry form', () => {
    it('should show add form when "Add Entry" is clicked', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Add Entry')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Add Entry'));

      expect(screen.getByLabelText('Title')).toBeTruthy();
      expect(screen.getByLabelText('Content')).toBeTruthy();
    });

    it('should hide add form when Cancel is clicked', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Add Entry')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Add Entry'));
      expect(screen.getByLabelText('Title')).toBeTruthy();

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByLabelText('Title')).toBeNull();
      });
    });

    it('should disable Add button when fields are empty', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Add Entry')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Add Entry'));

      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });

    it('should not show Add Entry button in view-only mode', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" isViewOnly />);

      await waitFor(() => {
        expect(screen.getByText('No knowledge base entries yet.')).toBeTruthy();
      });

      expect(screen.queryByText('Add Entry')).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // ENTRIES DISPLAY
  // ══════════════════════════════════════════════════════════════════

  describe('entries display', () => {
    it('should render manual entries', async () => {
      mockFetchEntries([
        { id: '1', title: 'Best Restaurants', content: 'Try the local biryani...', category: 'dining', is_active: true, order_index: 0, source: 'manual' },
        { id: '2', title: 'Getting Around', content: 'Auto-rickshaws are cheap...', category: 'transportation', is_active: true, order_index: 1, source: 'manual' },
      ]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Best Restaurants')).toBeTruthy();
        expect(screen.getByText('Getting Around')).toBeTruthy();
      });
    });

    it('should render mix of manual and auto-generated entries', async () => {
      mockFetchEntries([
        { id: '1', title: 'My Custom Tip', content: 'This is manual...', category: 'local_tips', is_active: true, order_index: 0, source: 'manual' },
        { id: '2', title: 'AI Dining Guide', content: 'Auto content...', category: 'dining', is_active: true, order_index: 1, source: 'auto_generated' },
      ]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('My Custom Tip')).toBeTruthy();
        expect(screen.getByText('AI Dining Guide')).toBeTruthy();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EXPANDED CATEGORIES
  // ══════════════════════════════════════════════════════════════════

  describe('expanded categories', () => {
    it('should render entries with new category types', async () => {
      mockFetchEntries([
        { id: '1', title: 'Weather Info', content: 'Warm...', category: 'weather', is_active: true, order_index: 0, source: 'auto_generated' },
        { id: '2', title: 'Emergency Info', content: 'Hospital nearby...', category: 'emergency', is_active: true, order_index: 1, source: 'auto_generated' },
      ]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText('Weather Info')).toBeTruthy();
        expect(screen.getByText('Emergency Info')).toBeTruthy();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // DESCRIPTION TEXT
  // ══════════════════════════════════════════════════════════════════

  describe('description', () => {
    it('should always show description text', async () => {
      mockFetchEntries([]);

      render(<ConciergeKnowledgeBase weddingId="w-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Add local knowledge that your concierge/)).toBeTruthy();
      });
    });
  });
});
