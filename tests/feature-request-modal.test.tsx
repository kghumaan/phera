import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return actual;
});

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase/wedding-service', () => ({
  weddingService: {},
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─── Import after mocks ──────────────────────────────────────────────

import FeatureRequestModal from '@/components/admin/FeatureRequestModal';

// ─── Tests ───────────────────────────────────────────────────────────

describe('FeatureRequestModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    weddingId: 'w-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: 'user-123', email: 'test@example.com' } });
  });

  describe('rendering', () => {
    it('should show feature variant title by default', () => {
      render(<FeatureRequestModal {...defaultProps} />);
      expect(screen.getByText('Want to request a feature?')).toBeTruthy();
    });

    it('should show custom variant title', () => {
      render(<FeatureRequestModal {...defaultProps} variant="custom" />);
      expect(screen.getByText('Want something custom?')).toBeTruthy();
    });

    it('should show Submit Request button', () => {
      render(<FeatureRequestModal {...defaultProps} />);
      expect(screen.getByText('Submit Request')).toBeTruthy();
    });

    it('should not render when open is false', () => {
      render(<FeatureRequestModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Want to request a feature?')).toBeNull();
    });
  });

  describe('form interaction', () => {
    it('should disable Submit button when content is empty', () => {
      render(<FeatureRequestModal {...defaultProps} />);
      const submitButton = screen.getByText('Submit Request').closest('button') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('should enable Submit button when content has text', () => {
      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Add dark mode please!' } });

      const submitButton = screen.getByText('Submit Request').closest('button') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });

    it('should disable Submit for whitespace-only content', () => {
      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: '   ' } });

      const submitButton = screen.getByText('Submit Request').closest('button') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('submission', () => {
    it('should POST to /api/feature-request/submit on submit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Dark mode!' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feature-request/submit', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }));
      });

      // Verify body contents
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.userId).toBe('user-123');
      expect(callBody.weddingId).toBe('w-123');
      expect(callBody.content).toBe('Dark mode!');
      expect(callBody.userEmail).toBe('test@example.com');
    });

    it('should show success state after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Feature X' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(screen.getByText('Thank you!')).toBeTruthy();
      });
    });

    it('should show correct success message for feature variant', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(screen.getByText(/received your request/)).toBeTruthy();
      });
    });

    it('should show correct success message for custom variant', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<FeatureRequestModal {...defaultProps} variant="custom" />);

      const input = screen.getByPlaceholderText('Any requests?');
      fireEvent.change(input, { target: { value: 'Custom design' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(screen.getByText(/excited to make something special/)).toBeTruthy();
      });
    });

    it('should not submit when user is null', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(<FeatureRequestModal {...defaultProps} />);

      // Input should still be there but submit won't fire
      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Submit Request'));

      // Should not call fetch
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FeatureRequestModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        // Should NOT show success state
        expect(screen.queryByText('Thank you!')).toBeNull();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('close behavior', () => {
    it('should call onClose and reset state when closed after submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const onClose = vi.fn();
      render(<FeatureRequestModal {...defaultProps} onClose={onClose} />);

      const input = screen.getByPlaceholderText("Tell us what you're thinking...");
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(screen.getByText('Thank you!')).toBeTruthy();
      });

      // Click the Close button in success state
      fireEvent.click(screen.getByText('Close'));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
