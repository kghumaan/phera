import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the concierge stats API response time algorithm.
 * Extracts the pure logic from app/api/concierge/stats/route.ts.
 */

// ─── Pure logic extraction ──────────────────────────────────────────

interface ChatMessage {
  id: string;
  guest_id: string;
  role: string;
  created_at: string;
}

function computeStats(allMessages: ChatMessage[]) {
  const userMessages = allMessages.filter((m) => m.role === 'user');
  const uniqueGuestIds = new Set(userMessages.map((m) => m.guest_id));
  const guestsReached = uniqueGuestIds.size;

  const assistantMessages = allMessages.filter((m) => m.role === 'assistant');
  const messagesHandled = assistantMessages.length;

  let totalResponseMs = 0;
  let responseCount = 0;

  for (let i = 0; i < allMessages.length; i++) {
    if (allMessages[i].role === 'user') {
      for (let j = i + 1; j < allMessages.length; j++) {
        if (allMessages[j].role === 'assistant') {
          const userTime = new Date(allMessages[i].created_at).getTime();
          const assistantTime = new Date(allMessages[j].created_at).getTime();
          const diff = assistantTime - userTime;
          if (diff > 0 && diff < 300000) {
            totalResponseMs += diff;
            responseCount++;
          }
          break;
        }
        if (allMessages[j].role === 'user') break;
      }
    }
  }

  const avgResponseTimeSec = responseCount > 0
    ? Math.round(totalResponseMs / responseCount / 1000)
    : 0;

  return { guestsReached, messagesHandled, avgResponseTimeSec, totalMessages: allMessages.length };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('concierge stats computation', () => {
  describe('guestsReached', () => {
    it('should count unique guests from user messages only', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g2', role: 'user', created_at: '2026-03-15T10:01:00Z' },
        { id: '4', guest_id: 'g2', role: 'assistant', created_at: '2026-03-15T10:01:03Z' },
        { id: '5', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:02:00Z' },
      ];

      const stats = computeStats(messages);
      expect(stats.guestsReached).toBe(2);
    });

    it('should return 0 for no messages', () => {
      expect(computeStats([]).guestsReached).toBe(0);
    });

    it('should not count assistant-only messages as guests', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:00Z' },
      ];
      expect(computeStats(messages).guestsReached).toBe(0);
    });
  });

  describe('messagesHandled', () => {
    it('should count assistant messages only', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:01:00Z' },
        { id: '4', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:01:03Z' },
      ];

      expect(computeStats(messages).messagesHandled).toBe(2);
    });
  });

  describe('avgResponseTimeSec', () => {
    it('should compute average response time correctly', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:10Z' }, // 10s
        { id: '3', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:01:00Z' },
        { id: '4', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:01:20Z' }, // 20s
      ];

      const stats = computeStats(messages);
      expect(stats.avgResponseTimeSec).toBe(15); // (10+20)/2
    });

    it('should return 0 when no responses exist', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:01:00Z' },
      ];

      expect(computeStats(messages).avgResponseTimeSec).toBe(0);
    });

    it('should ignore stale pairs (> 5 minutes)', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:06:00Z' }, // 6 min — stale
        { id: '3', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:10:00Z' },
        { id: '4', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:10:05Z' }, // 5s — valid
      ];

      const stats = computeStats(messages);
      expect(stats.avgResponseTimeSec).toBe(5);
    });

    it('should break on consecutive user messages (no response found)', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g2', role: 'user', created_at: '2026-03-15T10:00:02Z' }, // breaks search for msg 1
        { id: '3', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:05Z' }, // response for msg 2
      ];

      const stats = computeStats(messages);
      // msg 1: next is user → break, no response
      // msg 2: next is assistant → 3s response time
      expect(stats.avgResponseTimeSec).toBe(3);
    });

    it('should handle rapid-fire messages correctly', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00.000Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:02.000Z' }, // 2s
        { id: '3', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:03.000Z' },
        { id: '4', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:04.000Z' }, // 1s
        { id: '5', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:05.000Z' },
        { id: '6', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:08.000Z' }, // 3s
      ];

      const stats = computeStats(messages);
      expect(stats.avgResponseTimeSec).toBe(2); // (2+1+3)/3 = 2
    });

    it('should handle messages across multiple guests', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:10Z' }, // 10s
        { id: '3', guest_id: 'g2', role: 'user', created_at: '2026-03-15T10:00:15Z' },
        { id: '4', guest_id: 'g2', role: 'assistant', created_at: '2026-03-15T10:00:30Z' }, // 15s (but ordered by created_at, not guest)
      ];

      const stats = computeStats(messages);
      expect(stats.guestsReached).toBe(2);
      expect(stats.avgResponseTimeSec).toBe(13); // (10+15)/2 = 12.5 → 13
    });
  });

  describe('totalMessages', () => {
    it('should count all messages regardless of role', () => {
      const messages: ChatMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g1', role: 'system', created_at: '2026-03-15T10:00:06Z' },
      ];

      expect(computeStats(messages).totalMessages).toBe(3);
    });
  });
});
