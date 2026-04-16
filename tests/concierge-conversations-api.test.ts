import { describe, it, expect } from 'vitest';

/**
 * Tests for the concierge conversations API grouping/sorting logic.
 * Extracts the pure logic from app/api/concierge/conversations/route.ts.
 */

// ─── Pure logic extraction ──────────────────────────────────────────

interface RawMessage {
  id: string;
  guest_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  guestId: string;
  guestName: string;
  messages: { id: string; role: string; content: string; created_at: string }[];
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

function groupConversations(messages: RawMessage[], guestMap: Map<string, string>): Conversation[] {
  const conversationMap = new Map<string, Conversation>();

  for (const msg of messages) {
    if (!conversationMap.has(msg.guest_id)) {
      conversationMap.set(msg.guest_id, {
        guestId: msg.guest_id,
        guestName: guestMap.get(msg.guest_id) || 'Unknown Guest',
        messages: [],
        lastMessageAt: msg.created_at,
        lastMessagePreview: '',
        messageCount: 0,
      });
    }

    const conv = conversationMap.get(msg.guest_id)!;
    conv.messages.push({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
    });
    conv.lastMessageAt = msg.created_at;
    conv.lastMessagePreview = msg.content?.slice(0, 80) || '';
    conv.messageCount++;
  }

  return Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('concierge conversations grouping', () => {
  describe('message grouping by guest', () => {
    it('should group messages by guest_id', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'Hello', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', content: 'Hi!', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g2', role: 'user', content: 'Hey there', created_at: '2026-03-15T10:01:00Z' },
      ];
      const guestMap = new Map([['g1', 'Priya Sharma'], ['g2', 'Raj Patel']]);

      const result = groupConversations(messages, guestMap);

      expect(result).toHaveLength(2);
      const g1Conv = result.find(c => c.guestId === 'g1');
      const g2Conv = result.find(c => c.guestId === 'g2');
      expect(g1Conv!.messages).toHaveLength(2);
      expect(g2Conv!.messages).toHaveLength(1);
    });

    it('should use guest name from guestMap', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'Hi', created_at: '2026-03-15T10:00:00Z' },
      ];
      const guestMap = new Map([['g1', 'Priya Sharma']]);

      const result = groupConversations(messages, guestMap);
      expect(result[0].guestName).toBe('Priya Sharma');
    });

    it('should fallback to "Unknown Guest" when guest not in map', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g-unknown', role: 'user', content: 'Hi', created_at: '2026-03-15T10:00:00Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].guestName).toBe('Unknown Guest');
    });

    it('should return empty array for no messages', () => {
      expect(groupConversations([], new Map())).toHaveLength(0);
    });
  });

  describe('metadata computation', () => {
    it('should set lastMessageAt to the latest message timestamp', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'First', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', content: 'Reply', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g1', role: 'user', content: 'Follow up', created_at: '2026-03-15T10:01:00Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].lastMessageAt).toBe('2026-03-15T10:01:00Z');
    });

    it('should set lastMessagePreview to the last message content (truncated to 80 chars)', () => {
      const longContent = 'A'.repeat(120);
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'Short msg', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', content: longContent, created_at: '2026-03-15T10:00:05Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].lastMessagePreview).toHaveLength(80);
    });

    it('should count total messages per conversation', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'A', created_at: '2026-03-15T10:00:00Z' },
        { id: '2', guest_id: 'g1', role: 'assistant', content: 'B', created_at: '2026-03-15T10:00:05Z' },
        { id: '3', guest_id: 'g1', role: 'user', content: 'C', created_at: '2026-03-15T10:01:00Z' },
        { id: '4', guest_id: 'g1', role: 'assistant', content: 'D', created_at: '2026-03-15T10:01:05Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].messageCount).toBe(4);
    });

    it('should handle null content in lastMessagePreview', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: null as any, created_at: '2026-03-15T10:00:00Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].lastMessagePreview).toBe('');
    });
  });

  describe('sorting', () => {
    it('should sort conversations by most recent first', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'Old', created_at: '2026-03-14T10:00:00Z' },
        { id: '2', guest_id: 'g2', role: 'user', content: 'New', created_at: '2026-03-15T10:00:00Z' },
        { id: '3', guest_id: 'g3', role: 'user', content: 'Middle', created_at: '2026-03-14T20:00:00Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].guestId).toBe('g2'); // Most recent
      expect(result[1].guestId).toBe('g3');
      expect(result[2].guestId).toBe('g1'); // Oldest
    });

    it('should sort by last message, not first message', () => {
      const messages: RawMessage[] = [
        { id: '1', guest_id: 'g1', role: 'user', content: 'Old start', created_at: '2026-03-10T10:00:00Z' },
        { id: '2', guest_id: 'g2', role: 'user', content: 'New start', created_at: '2026-03-14T10:00:00Z' },
        { id: '3', guest_id: 'g1', role: 'assistant', content: 'Recent reply', created_at: '2026-03-15T10:00:00Z' },
      ];

      const result = groupConversations(messages, new Map());
      expect(result[0].guestId).toBe('g1'); // g1 has the most recent message despite starting earlier
    });
  });
});
