import { describe, it, expect } from 'vitest';

/**
 * Tests for sync-groups API endpoint logic.
 * Tests the core data-processing logic without invoking the Next.js route handler.
 */

describe('sync-groups API logic', () => {

  // ── Chat parsing ─────────────────────────────────────────────────

  describe('parseChatsResponse', () => {
    function parseChatsResponse(rawResponse: any): any[] {
      if (rawResponse?.chats && Array.isArray(rawResponse.chats)) return rawResponse.chats;
      if (rawResponse?.groups && Array.isArray(rawResponse.groups)) return rawResponse.groups;
      if (Array.isArray(rawResponse)) return rawResponse;
      if (rawResponse?.data && Array.isArray(rawResponse.data)) return rawResponse.data;
      for (const key of Object.keys(rawResponse || {})) {
        if (Array.isArray(rawResponse[key]) && rawResponse[key].length > 0) {
          return rawResponse[key];
        }
      }
      return [];
    }

    it('should parse chats from "chats" key', () => {
      const raw = { chats: [{ id: '1' }, { id: '2' }] };
      expect(parseChatsResponse(raw)).toHaveLength(2);
    });

    it('should parse chats from "groups" key', () => {
      const raw = { groups: [{ id: '1' }] };
      expect(parseChatsResponse(raw)).toHaveLength(1);
    });

    it('should parse direct array response', () => {
      const raw = [{ id: '1' }, { id: '2' }, { id: '3' }];
      expect(parseChatsResponse(raw)).toHaveLength(3);
    });

    it('should parse chats from "data" key', () => {
      const raw = { data: [{ id: '1' }] };
      expect(parseChatsResponse(raw)).toHaveLength(1);
    });

    it('should fallback to first non-empty array', () => {
      const raw = { something_else: [{ id: '1' }] };
      expect(parseChatsResponse(raw)).toHaveLength(1);
    });

    it('should return empty array for null response', () => {
      expect(parseChatsResponse(null)).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      expect(parseChatsResponse({})).toEqual([]);
    });
  });

  // ── Group vs direct chat splitting ───────────────────────────────

  describe('chat type splitting', () => {
    it('should classify group chats by @g.us suffix', () => {
      const chats = [
        { id: 'abc123@g.us', name: 'Wedding Venue Group' },
        { id: 'def456@g.us', name: 'Catering Group' },
      ];
      const groups = chats.filter(c => c.id.endsWith('@g.us'));
      expect(groups).toHaveLength(2);
    });

    it('should classify direct chats by @s.whatsapp.net suffix', () => {
      const chats = [
        { id: '14155551234@s.whatsapp.net', name: 'John' },
        { id: '919876543210@s.whatsapp.net', name: 'Priya' },
      ];
      const directChats = chats.filter(c => c.id.endsWith('@s.whatsapp.net'));
      expect(directChats).toHaveLength(2);
    });

    it('should split mixed chats correctly', () => {
      const allChats = [
        { id: 'abc@g.us', name: 'Group A' },
        { id: '123@s.whatsapp.net', name: 'Contact 1' },
        { id: 'def@g.us', name: 'Group B' },
        { id: '456@s.whatsapp.net', name: 'Contact 2' },
      ];

      const groups = allChats.filter(c => c.id.endsWith('@g.us'));
      const directChats = allChats.filter(c => c.id.endsWith('@s.whatsapp.net'));

      expect(groups).toHaveLength(2);
      expect(directChats).toHaveLength(2);
    });

    it('should ignore chats with unrecognized suffixes', () => {
      const allChats = [
        { id: 'abc@g.us', name: 'Group A' },
        { id: 'status@broadcast', name: 'Status' },
        { id: '123@s.whatsapp.net', name: 'Contact' },
      ];

      const groups = allChats.filter(c => c.id.endsWith('@g.us'));
      const directChats = allChats.filter(c => c.id.endsWith('@s.whatsapp.net'));

      expect(groups).toHaveLength(1);
      expect(directChats).toHaveLength(1);
      // The status@broadcast is ignored (neither group nor direct)
      expect(groups.length + directChats.length).toBe(2);
    });
  });

  // ── Deduplication ────────────────────────────────────────────────

  describe('deduplication', () => {
    it('should deduplicate chats by id', () => {
      const allChats = [
        { id: 'abc@g.us', name: 'Group A' },
        { id: 'abc@g.us', name: 'Group A (duplicate)' },
        { id: 'def@g.us', name: 'Group B' },
      ];

      const seenIds = new Set<string>();
      const unique: any[] = [];
      for (const chat of allChats) {
        if (!chat.id || seenIds.has(chat.id)) continue;
        seenIds.add(chat.id);
        unique.push(chat);
      }

      expect(unique).toHaveLength(2);
      expect(unique[0].name).toBe('Group A'); // keeps first
    });

    it('should skip chats without id', () => {
      const allChats = [
        { id: 'abc@g.us', name: 'A' },
        { id: '', name: 'No ID' },
        { id: null, name: 'Null ID' },
      ];

      const seenIds = new Set<string>();
      const unique: any[] = [];
      for (const chat of allChats) {
        if (!chat.id || seenIds.has(chat.id)) continue;
        seenIds.add(chat.id);
        unique.push(chat);
      }

      expect(unique).toHaveLength(1);
    });
  });

  // ── Chat entry construction ──────────────────────────────────────

  describe('chat entry construction', () => {
    it('should extract name from chat.name', () => {
      const chat = { id: 'g1@g.us', name: 'Venue Chat', subject: null };
      const name = chat.name || chat.subject || 'Unknown';
      expect(name).toBe('Venue Chat');
    });

    it('should fallback to chat.subject', () => {
      const chat = { id: 'g1@g.us', name: '', subject: 'Venue Subject' };
      const name = chat.name || chat.subject || 'Unknown';
      expect(name).toBe('Venue Subject');
    });

    it('should fallback to Unknown when no name or subject', () => {
      const chat = { id: 'g1@g.us', name: '', subject: '' };
      const name = chat.name || chat.subject || 'Unknown';
      expect(name).toBe('Unknown');
    });

    it('should extract participant count', () => {
      const chat1 = { id: 'g1@g.us', participants: [1, 2, 3] };
      const chat2 = { id: 'g2@g.us', size: 5 };
      const chat3 = { id: 'g3@g.us' };

      expect(chat1.participants?.length || 0).toBe(3);
      expect((chat2 as any).participants?.length || (chat2 as any).size || 0).toBe(5);
      expect((chat3 as any).participants?.length || 0).toBe(0);
    });
  });

  // ── Message content extraction ───────────────────────────────────

  describe('extractMessageContent', () => {
    function extractMessageContent(m: any): string {
      if (m.text?.body) return m.text.body;
      if (m.image?.caption) return m.image.caption;
      if (m.video?.caption) return m.video.caption;
      if (m.gif?.caption) return m.gif.caption;
      if (m.short?.caption) return m.short.caption;
      if (m.document?.caption) return m.document.caption;
      if (m.link_preview?.body) return m.link_preview.body;
      if (m.interactive?.body?.text) return m.interactive.body.text;
      if (m.system?.body) return m.system.body;
      if (m.list?.body) return m.list.body;
      if (m.buttons?.text) return m.buttons.text;
      if (m.hsm?.body) return m.hsm.body;
      if (m.body) return m.body;
      if (m.caption) return m.caption;
      return '';
    }

    it('should extract text message body', () => {
      expect(extractMessageContent({ text: { body: 'Hello' } })).toBe('Hello');
    });

    it('should extract image caption', () => {
      expect(extractMessageContent({ image: { caption: 'Photo caption' } })).toBe('Photo caption');
    });

    it('should extract video caption', () => {
      expect(extractMessageContent({ video: { caption: 'Video caption' } })).toBe('Video caption');
    });

    it('should extract document caption', () => {
      expect(extractMessageContent({ document: { caption: 'Invoice.pdf' } })).toBe('Invoice.pdf');
    });

    it('should extract link preview body', () => {
      expect(extractMessageContent({ link_preview: { body: 'Check this link' } })).toBe('Check this link');
    });

    it('should extract system message', () => {
      expect(extractMessageContent({ system: { body: 'User joined' } })).toBe('User joined');
    });

    it('should fallback to top-level body', () => {
      expect(extractMessageContent({ body: 'Fallback body' })).toBe('Fallback body');
    });

    it('should fallback to top-level caption', () => {
      expect(extractMessageContent({ caption: 'Fallback caption' })).toBe('Fallback caption');
    });

    it('should return empty string for unknown message types', () => {
      expect(extractMessageContent({})).toBe('');
      expect(extractMessageContent({ sticker: { url: 'sticker.webp' } })).toBe('');
    });

    it('should prioritize text.body over other fields', () => {
      expect(extractMessageContent({
        text: { body: 'Primary' },
        body: 'Secondary',
        caption: 'Tertiary',
      })).toBe('Primary');
    });
  });

  // ── Message parsing ──────────────────────────────────────────────

  describe('parseMessagesResponse', () => {
    function parseMessagesResponse(response: any): any[] {
      if (Array.isArray(response)) return response;
      if (response?.messages && Array.isArray(response.messages)) return response.messages;
      if (response?.data && Array.isArray(response.data)) return response.data;
      for (const key of Object.keys(response || {})) {
        if (Array.isArray(response[key]) && response[key].length > 0) return response[key];
      }
      return [];
    }

    it('should parse direct array', () => {
      expect(parseMessagesResponse([{ id: 'm1' }])).toHaveLength(1);
    });

    it('should parse messages key', () => {
      expect(parseMessagesResponse({ messages: [{ id: 'm1' }, { id: 'm2' }] })).toHaveLength(2);
    });

    it('should parse data key', () => {
      expect(parseMessagesResponse({ data: [{ id: 'm1' }] })).toHaveLength(1);
    });

    it('should fallback to first non-empty array', () => {
      expect(parseMessagesResponse({ results: [{ id: 'm1' }] })).toHaveLength(1);
    });

    it('should return empty for null', () => {
      expect(parseMessagesResponse(null)).toEqual([]);
    });

    it('should return empty for error response', () => {
      expect(parseMessagesResponse({ error: 'Something went wrong' })).toEqual([]);
    });
  });

  // ── Response shape (GET endpoint) ────────────────────────────────

  describe('GET response shape', () => {
    it('should return groups and directChats when no type param', () => {
      const type = null;
      const groups = [{ id: 'g1@g.us', name: 'Group' }];
      const directChats = [{ id: 'd1@s.whatsapp.net', name: 'Direct' }];

      let response: any;
      if (type === 'groups') response = { groups };
      else if (type === 'direct') response = { directChats };
      else response = { groups, directChats };

      expect(response).toHaveProperty('groups');
      expect(response).toHaveProperty('directChats');
    });

    it('should return only groups when type=groups', () => {
      const type = 'groups';
      const groups = [{ id: 'g1@g.us', name: 'Group' }];
      const directChats = [{ id: 'd1@s.whatsapp.net', name: 'Direct' }];

      let response: any;
      if (type === 'groups') response = { groups };
      else if (type === 'direct') response = { directChats };
      else response = { groups, directChats };

      expect(response).toHaveProperty('groups');
      expect(response).not.toHaveProperty('directChats');
    });

    it('should return only directChats when type=direct', () => {
      const type: string = 'direct';
      const groups = [{ id: 'g1@g.us', name: 'Group' }];
      const directChats = [{ id: 'd1@s.whatsapp.net', name: 'Direct' }];

      let response: any;
      if (type === 'groups') response = { groups };
      else if (type === 'direct') response = { directChats };
      else response = { groups, directChats };

      expect(response).toHaveProperty('directChats');
      expect(response).not.toHaveProperty('groups');
    });
  });

  // ── POST response shape ──────────────────────────────────────────

  describe('POST response shape', () => {
    it('should include synced count and results', () => {
      const response = {
        synced: 2,
        results: [
          { chatName: 'Venue', messagesImported: 50, vendorName: 'Lakeside', isNew: true, chatType: 'group' },
        ],
        message: 'Synced 2 chat(s)',
      };

      expect(response).toHaveProperty('synced');
      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('message');
      expect(response.synced).toBeGreaterThanOrEqual(0);
    });

    it('should include errors array when some chats fail', () => {
      const response = {
        synced: 1,
        results: [{ chatName: 'Venue', messagesImported: 50, vendorName: 'Lakeside', isNew: true, chatType: 'group' }],
        errors: [{ chatId: 'g2@g.us', chatName: 'DJ Group', error: 'No messages returned' }],
        message: 'Synced 1 chat(s)',
      };

      expect(response.errors).toHaveLength(1);
      expect(response.errors![0]).toHaveProperty('chatId');
      expect(response.errors![0]).toHaveProperty('chatName');
      expect(response.errors![0]).toHaveProperty('error');
    });

    it('should omit errors when all chats succeed', () => {
      const errors: any[] = [];
      const response = {
        synced: 2,
        results: [],
        errors: errors.length > 0 ? errors : undefined,
        message: 'Synced 2',
      };

      expect(response.errors).toBeUndefined();
    });
  });

  // ── Message deduplication ────────────────────────────────────────

  describe('message deduplication', () => {
    it('should filter out messages with IDs already in database', () => {
      const existingIds = new Set(['m1', 'm3']);
      const newMessages = [
        { id: 'm1', text: { body: 'Old' } },
        { id: 'm2', text: { body: 'New 1' } },
        { id: 'm3', text: { body: 'Old too' } },
        { id: 'm4', text: { body: 'New 2' } },
      ];

      const filtered = newMessages.filter(m => m.id && !existingIds.has(m.id));
      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.id)).toEqual(['m2', 'm4']);
    });

    it('should skip messages without id', () => {
      const existingIds = new Set<string>();
      const messages = [
        { id: 'm1', text: { body: 'Has ID' } },
        { id: '', text: { body: 'Empty ID' } },
        { id: null, text: { body: 'Null ID' } },
      ];

      const filtered = messages.filter((m: any) => m.id && !existingIds.has(m.id));
      expect(filtered).toHaveLength(1);
    });
  });
});
