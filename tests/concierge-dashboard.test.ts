import { describe, it, expect } from 'vitest';

/**
 * Tests for pure utility functions extracted from ConciergeDashboard.tsx
 * and ConciergeConversations.tsx (shared logic).
 */

// ─── Pure logic extraction ──────────────────────────────────────────

function formatTimeAgo(dateStr: string, now = Date.now()) {
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatResponseTime(seconds: number) {
  if (seconds === 0) return '--';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Conversations filter logic from ConciergeConversations.tsx
interface Conversation {
  guestName: string;
  lastMessageAt: string;
}

function filterConversations(
  conversations: Conversation[],
  search: string,
  timeFilter: 'all' | 'week' | 'today',
  now = Date.now()
): Conversation[] {
  return conversations.filter((conv) => {
    if (search && !conv.guestName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (timeFilter !== 'all') {
      const msgTime = new Date(conv.lastMessageAt).getTime();
      if (timeFilter === 'today' && now - msgTime > 86400000) return false;
      if (timeFilter === 'week' && now - msgTime > 604800000) return false;
    }
    return true;
  });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Dashboard utilities', () => {
  describe('formatTimeAgo', () => {
    const baseTime = new Date('2026-03-15T12:00:00Z').getTime();

    it('should return "just now" for < 1 minute', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 30000)).toBe('just now');
    });

    it('should return minutes for < 1 hour', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 15 * 60000)).toBe('15m ago');
    });

    it('should return hours for < 24 hours', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 3 * 3600000)).toBe('3h ago');
    });

    it('should return days for >= 24 hours', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 2 * 86400000)).toBe('2d ago');
    });

    it('should handle exactly 1 minute', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 60000)).toBe('1m ago');
    });

    it('should handle exactly 1 hour', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 3600000)).toBe('1h ago');
    });

    it('should handle exactly 1 day', () => {
      expect(formatTimeAgo('2026-03-15T12:00:00Z', baseTime + 86400000)).toBe('1d ago');
    });
  });

  describe('formatResponseTime', () => {
    it('should return "--" for 0 seconds', () => {
      expect(formatResponseTime(0)).toBe('--');
    });

    it('should return seconds for < 60', () => {
      expect(formatResponseTime(5)).toBe('5s');
      expect(formatResponseTime(59)).toBe('59s');
    });

    it('should return minutes for >= 60', () => {
      expect(formatResponseTime(60)).toBe('1m');
      expect(formatResponseTime(120)).toBe('2m');
    });

    it('should round minutes', () => {
      expect(formatResponseTime(90)).toBe('2m'); // 1.5 → 2
      expect(formatResponseTime(150)).toBe('3m'); // 2.5 → 3
    });
  });

  describe('getInitials', () => {
    it('should return first letters of each word (max 2)', () => {
      expect(getInitials('Priya Sharma')).toBe('PS');
    });

    it('should handle single name', () => {
      expect(getInitials('Priya')).toBe('P');
    });

    it('should handle three-word names', () => {
      expect(getInitials('Priya Kumar Sharma')).toBe('PK'); // slice(0, 2)
    });

    it('should uppercase', () => {
      expect(getInitials('priya sharma')).toBe('PS');
    });
  });
});

describe('Conversation filtering', () => {
  const baseTime = new Date('2026-03-15T12:00:00Z').getTime();

  const conversations: Conversation[] = [
    { guestName: 'Priya Sharma', lastMessageAt: '2026-03-15T11:00:00Z' },  // 1h ago
    { guestName: 'Raj Patel', lastMessageAt: '2026-03-14T10:00:00Z' },     // 26h ago (> 1 day)
    { guestName: 'Neha Kapoor', lastMessageAt: '2026-03-10T12:00:00Z' },   // 5 days ago
    { guestName: 'Arjun Mehta', lastMessageAt: '2026-03-01T12:00:00Z' },   // 14 days ago
  ];

  describe('search filter', () => {
    it('should filter by guest name (case-insensitive)', () => {
      const result = filterConversations(conversations, 'priya', 'all', baseTime);
      expect(result).toHaveLength(1);
      expect(result[0].guestName).toBe('Priya Sharma');
    });

    it('should match partial names', () => {
      const result = filterConversations(conversations, 'pat', 'all', baseTime);
      expect(result).toHaveLength(1);
      expect(result[0].guestName).toBe('Raj Patel');
    });

    it('should return all when search is empty', () => {
      expect(filterConversations(conversations, '', 'all', baseTime)).toHaveLength(4);
    });

    it('should return empty when no match', () => {
      expect(filterConversations(conversations, 'zzz', 'all', baseTime)).toHaveLength(0);
    });
  });

  describe('time filter', () => {
    it('should return all with "all" filter', () => {
      expect(filterConversations(conversations, '', 'all', baseTime)).toHaveLength(4);
    });

    it('should filter to today (< 24h)', () => {
      const result = filterConversations(conversations, '', 'today', baseTime);
      expect(result).toHaveLength(1);
      expect(result[0].guestName).toBe('Priya Sharma');
    });

    it('should filter to this week (< 7 days)', () => {
      const result = filterConversations(conversations, '', 'week', baseTime);
      expect(result).toHaveLength(3); // Priya (1h), Raj (1d), Neha (5d)
    });
  });

  describe('combined filters', () => {
    it('should apply both search and time filter', () => {
      const result = filterConversations(conversations, 'raj', 'today', baseTime);
      expect(result).toHaveLength(0); // Raj is 1 day ago, not today
    });

    it('should apply both search and week filter', () => {
      const result = filterConversations(conversations, 'neha', 'week', baseTime);
      expect(result).toHaveLength(1); // Neha is 5 days ago, within a week
    });
  });
});
