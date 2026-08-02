import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return actual;
});

// ─── Import after mocks ──────────────────────────────────────────────

import ConciergeKnowledgeEntry from '@/components/admin/concierge/ConciergeKnowledgeEntry';

// ─── Helpers ─────────────────────────────────────────────────────────

const baseEntry = {
  id: 'entry-1',
  title: 'Best Restaurants',
  content: 'Try the seafood at Trishna for the best local experience.',
  category: 'dining',
  is_active: true,
  order_index: 0,
};

const defaultProps = {
  entry: baseEntry,
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};

function getEditButton(container: HTMLElement) {
  // The component enters edit mode by clicking the Paper card itself (not a separate button)
  // Find the outermost Paper element which has the onClick handler
  const paper = container.querySelector('.MuiPaper-root') as HTMLElement;
  return paper;
}

function getDeleteButton(container: HTMLElement) {
  const deleteIcon = container.querySelector('[data-testid="DeleteIcon"]');
  return deleteIcon?.closest('button') as HTMLButtonElement;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('ConciergeKnowledgeEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════
  // RENDERING
  // ══════════════════════════════════════════════════════════════════

  describe('rendering', () => {
    it('should render entry title', () => {
      render(<ConciergeKnowledgeEntry {...defaultProps} />);
      expect(screen.getByText('Best Restaurants')).toBeTruthy();
    });

    it('should render entry content (truncated at 200 chars)', () => {
      render(<ConciergeKnowledgeEntry {...defaultProps} />);
      expect(screen.getByText(/Try the seafood at Trishna/)).toBeTruthy();
    });

    it('should truncate long content with ellipsis', () => {
      const longContent = 'A'.repeat(250);
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, content: longContent }}
        />
      );
      expect(screen.getByText(/\.\.\.$/)).toBeTruthy();
    });

    it('should render category chip', () => {
      render(<ConciergeKnowledgeEntry {...defaultProps} />);
      expect(screen.getByText('Dining')).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // AI GENERATED BADGE
  // ══════════════════════════════════════════════════════════════════

  describe('AI generated badge', () => {
    it('should show "AI Generated" chip for auto_generated entries', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, source: 'auto_generated' }}
        />
      );
      expect(screen.getByText('AI Generated')).toBeTruthy();
    });

    it('should NOT show "AI Generated" chip for manual entries', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, source: 'manual' }}
        />
      );
      expect(screen.queryByText('AI Generated')).toBeNull();
    });

    it('should NOT show "AI Generated" chip when source is undefined', () => {
      render(<ConciergeKnowledgeEntry {...defaultProps} />);
      expect(screen.queryByText('AI Generated')).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EXPANDED CATEGORIES
  // ══════════════════════════════════════════════════════════════════

  describe('expanded categories', () => {
    it('should display Weather category label', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'weather' }}
        />
      );
      expect(screen.getByText('Weather')).toBeTruthy();
    });

    it('should display Emergency category label', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'emergency' }}
        />
      );
      expect(screen.getByText('Emergency')).toBeTruthy();
    });

    it('should display Nightlife category label', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'nightlife' }}
        />
      );
      expect(screen.getByText('Nightlife')).toBeTruthy();
    });

    it('should display Shopping category label', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'shopping' }}
        />
      );
      expect(screen.getByText('Shopping')).toBeTruthy();
    });

    it('should display Cultural & Etiquette category label', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'cultural_etiquette' }}
        />
      );
      expect(screen.getByText('Cultural & Etiquette')).toBeTruthy();
    });

    it('should fall back to raw category string for unknown categories', () => {
      render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          entry={{ ...baseEntry, category: 'unknown_cat' }}
        />
      );
      expect(screen.getByText('unknown_cat')).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ══════════════════════════════════════════════════════════════════

  describe('edit mode', () => {
    it('should enter edit mode when edit button is clicked', () => {
      const { container } = render(<ConciergeKnowledgeEntry {...defaultProps} />);

      const editButton = getEditButton(container);
      expect(editButton).toBeTruthy();
      fireEvent.click(editButton);

      expect(screen.getByLabelText('Title')).toBeTruthy();
      expect(screen.getByLabelText('Content')).toBeTruthy();
    });

    it('should pre-fill edit form with current values', () => {
      const { container } = render(<ConciergeKnowledgeEntry {...defaultProps} />);

      fireEvent.click(getEditButton(container));

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
      expect(titleInput.value).toBe('Best Restaurants');
    });

    it('should call onUpdate with new values when Save is clicked', () => {
      const onUpdate = vi.fn();
      const { container } = render(
        <ConciergeKnowledgeEntry {...defaultProps} onUpdate={onUpdate} />
      );

      fireEvent.click(getEditButton(container));

      const titleInput = screen.getByLabelText('Title');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      fireEvent.click(screen.getByText('Save'));

      expect(onUpdate).toHaveBeenCalledWith('entry-1', {
        title: 'Updated Title',
        content: baseEntry.content,
        category: baseEntry.category,
      });
    });

    it('should cancel edit and restore original values', () => {
      const { container } = render(<ConciergeKnowledgeEntry {...defaultProps} />);

      fireEvent.click(getEditButton(container));

      const titleInput = screen.getByLabelText('Title');
      fireEvent.change(titleInput, { target: { value: 'Changed' } });

      fireEvent.click(screen.getByText('Cancel'));

      // Should be back in view mode with original title
      expect(screen.getByText('Best Restaurants')).toBeTruthy();
    });

    it('should allow editing AI-generated entries', () => {
      const onUpdate = vi.fn();
      const { container } = render(
        <ConciergeKnowledgeEntry
          {...defaultProps}
          onUpdate={onUpdate}
          entry={{ ...baseEntry, source: 'auto_generated' }}
        />
      );

      fireEvent.click(getEditButton(container));

      expect(screen.getByLabelText('Title')).toBeTruthy();

      fireEvent.click(screen.getByText('Save'));

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should disable Save button when title is empty', () => {
      const { container } = render(<ConciergeKnowledgeEntry {...defaultProps} />);

      fireEvent.click(getEditButton(container));

      const titleInput = screen.getByLabelText('Title');
      fireEvent.change(titleInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save').closest('button') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // VIEW ONLY MODE
  // ══════════════════════════════════════════════════════════════════

  describe('view only mode', () => {
    it('should not show edit/delete/toggle controls in view-only mode', () => {
      const { container } = render(
        <ConciergeKnowledgeEntry {...defaultProps} isViewOnly />
      );

      // Delete button should not exist
      expect(getDeleteButton(container)).toBeFalsy();
      expect(container.querySelector('input[type="checkbox"]')).toBeFalsy();

      // Clicking the card in view-only mode should NOT enter edit mode
      const paper = container.querySelector('.MuiPaper-root') as HTMLElement;
      if (paper) fireEvent.click(paper);
      expect(screen.queryByLabelText('Title')).toBeFalsy();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // ACTIVE/INACTIVE STATE
  // ══════════════════════════════════════════════════════════════════

  describe('active/inactive state', () => {
    it('should call onUpdate with is_active when switch is toggled', () => {
      const onUpdate = vi.fn();
      const { container } = render(
        <ConciergeKnowledgeEntry {...defaultProps} onUpdate={onUpdate} />
      );

      const switchInput = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(switchInput);

      expect(onUpdate).toHaveBeenCalledWith('entry-1', { is_active: false });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════════════════════════════

  describe('delete', () => {
    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      const { container } = render(
        <ConciergeKnowledgeEntry {...defaultProps} onDelete={onDelete} />
      );

      fireEvent.click(getDeleteButton(container));

      expect(onDelete).toHaveBeenCalledWith('entry-1');
    });
  });
});
