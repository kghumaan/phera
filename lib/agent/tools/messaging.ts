import type { AgentToolDefinition, WhatsAppBroadcastDraft } from '../types';
import { guestMatchesTags } from '@/lib/utils/guest-tags';
import {
  getChannelRecord,
  refreshAndGetStatus,
  createWeddingGuestGroup,
} from '@/lib/whatsapp/groups-service';

/** User-facing paid-feature name (gates connect / group / broadcast for Basic). */
const WHATSAPP_FEATURE = 'Guest WhatsApp messaging';

type GuestRow = { id: string; name: string; phone: string | null; logistics_data: unknown };

export const messagingTools: AgentToolDefinition[] = [
  {
    name: 'get_whatsapp_connection',
    label: 'Checking WhatsApp connection',
    risk: 'read',
    // Intentionally NOT proFeature-gated: a harmless status read the agent uses
    // to decide whether to OFFER pairing. The paid gate kicks in on connect/send.
    description:
      "Check whether the couple's own WhatsApp is connected (paired) to Phera, and whether their guest WhatsApp group exists yet. Call this BEFORE offering to create a group or send a broadcast, so you know whether to first walk them through connecting. Returns connection status, the guest-group invite link if any, and the paired phone.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const view = await refreshAndGetStatus(ctx.weddingSlug);
      const connected = view.status === 'auth';
      return {
        connected,
        status: view.status,
        has_group: view.hasGroup,
        group_link: view.groupLink,
        paired_phone: view.pairedPhone,
        note: connected
          ? 'Connected — you can create the guest group and send broadcasts from their own number.'
          : "Not connected. To message guests from the couple's OWN number, they first connect WhatsApp (connect_whatsapp). They can still send from Phera's number or via wa.me links without connecting.",
      };
    },
  },
  {
    name: 'connect_whatsapp',
    label: 'Opening WhatsApp pairing',
    risk: 'write',
    proFeature: WHATSAPP_FEATURE,
    description:
      "Open the WhatsApp pairing panel so the couple can connect their OWN WhatsApp number to Phera by scanning a QR code (WhatsApp > Linked Devices), exactly like WhatsApp Web. Once connected, Phera can create their guest group and send on their behalf. Call this when the couple wants to create a group or send as themselves and get_whatsapp_connection shows they're not connected. Does NOT send anything.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const view = await refreshAndGetStatus(ctx.weddingSlug);
      return {
        whatsappPairing: { status: view.status },
        status: view.status,
        connected: view.status === 'auth',
        note:
          view.status === 'auth'
            ? "Already connected — no need to pair again. You can proceed to create the group or broadcast."
            : "A pairing panel is now open on the right. The couple taps Connect, then scans the QR in WhatsApp > Linked Devices. Tell them in one short line; do not claim it's connected yet.",
      };
    },
  },
  {
    name: 'create_guest_whatsapp_group',
    label: 'Creating the wedding WhatsApp group',
    risk: 'gated',
    proFeature: WHATSAPP_FEATURE,
    description:
      "Call this to create the wedding's guest WhatsApp group from the couple's OWN connected number (they become the admin). Requires WhatsApp to be connected first. After creating it, you'll get a join (invite) link — then OFFER to broadcast that link to guests so they self-join (we do NOT auto-add hundreds of people; that risks the couple's number). Pass a friendly group subject like 'Priya & Rahul Wedding 💍'.",
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: "Group name, e.g. 'Priya & Rahul Wedding'. Keep it short and warm.",
        },
      },
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const subject = ((input.subject as string) || '').trim() || 'Wedding Guests';
      const { groupId, inviteLink } = await createWeddingGuestGroup(ctx.weddingSlug, { subject });
      return {
        created: true,
        group_id: groupId,
        invite_link: inviteLink,
        note: inviteLink
          ? 'Group created on the couple\'s number. Now OFFER to broadcast this join link to guests (broadcast_message) so they self-join — do not auto-add everyone.'
          : 'Group created, but the invite link is not available yet. Try get_whatsapp_connection shortly to fetch it.',
      };
    },
  },
  {
    name: 'broadcast_message',
    label: 'Drafting a guest broadcast',
    risk: 'write',
    proFeature: WHATSAPP_FEATURE,
    description:
      "Draft a WhatsApp broadcast to the couple's guests and open a review panel where they confirm the audience and choose how to send: from their OWN connected number, from Phera's number, or as wa.me links they tap to send themselves. Use audience 'all' for everyone, 'tags' with tag names for a segment, or 'specific' with guest_ids. This DRAFTS only — the couple sends from the panel. Write the message warmly, as the couple. Never claim it was sent.",
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message body. Warm and personal, as the couple. Include any link (e.g. the group join link) inline.',
        },
        audience: {
          type: 'string',
          enum: ['all', 'tags', 'specific'],
          description: "'all' = every guest with a phone; 'tags' = guests carrying any of the given tags; 'specific' = the listed guest_ids.",
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag names when audience = tags.' },
        guest_ids: { type: 'array', items: { type: 'string' }, description: 'Guest ids when audience = specific.' },
      },
      required: ['message', 'audience'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const message = ((input.message as string) || '').trim();
      if (!message) throw new Error('A non-empty message is required.');
      const audience = (input.audience as WhatsAppBroadcastDraft['audience']) || 'all';
      const tags = Array.isArray(input.tags) ? (input.tags as string[]) : [];
      const guestIds = Array.isArray(input.guest_ids) ? (input.guest_ids as string[]) : [];

      const { data, error } = await ctx.supabase
        .from('guests')
        .select('id, name, phone, logistics_data')
        .eq('wedding_id', ctx.weddingSlug);
      if (error) throw new Error(error.message);

      let recipients = ((data ?? []) as GuestRow[]).filter((g) => g.phone);
      if (audience === 'tags') {
        if (!tags.length) throw new Error('audience "tags" needs at least one tag.');
        recipients = recipients.filter((g) => guestMatchesTags(g.logistics_data, tags));
      } else if (audience === 'specific') {
        const wanted = new Set(guestIds);
        recipients = recipients.filter((g) => wanted.has(g.id));
      }

      const channel = await getChannelRecord(ctx.weddingSlug);
      const draft: WhatsAppBroadcastDraft = {
        message,
        audience,
        tags,
        guestIds,
        count: recipients.length,
        sampleNames: recipients.slice(0, 5).map((g) => g.name).filter(Boolean),
        connected: channel?.status === 'auth',
      };

      return {
        broadcastReview: draft,
        count: draft.count,
        note:
          draft.count === 0
            ? 'No guests matched that audience (they need a phone number). Tell the couple; do not send.'
            : `Drafted a broadcast to ${draft.count} guest(s). A review panel is open on the right where the couple confirms and chooses how to send (their own number${draft.connected ? '' : ' — not connected yet'}, Phera's number, or wa.me links). Do NOT claim it was sent.`,
      };
    },
  },
];
