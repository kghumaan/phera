/**
 * Whapi.Cloud API Client
 * Handles communication with Whapi.Cloud REST API for vendor WhatsApp group messaging
 */

interface WhapiMessageResponse {
  sent: boolean;
  message: {
    id: string;
    [key: string]: unknown;
  };
}

interface WhapiGroup {
  id: string;
  name: string;
  participants: Array<{ id: string; admin?: boolean }>;
  [key: string]: unknown;
}

export class WhapiClient {
  private baseUrl = 'https://gate.whapi.cloud';
  private apiToken: string;

  constructor(token?: string) {
    // Per-channel callers (a couple's own paired number) pass their channel
    // token; the shared singleton falls back to Phera's production env token.
    this.apiToken = token ?? process.env.WHAPI_API_TOKEN ?? '';
    if (!this.apiToken) {
      console.warn('⚠️ WHAPI_API_TOKEN not configured. Whapi.Cloud integration disabled.');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Whapi.Cloud API error [${response.status}]:`, error);
      throw new Error(`Whapi.Cloud API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Send a text message to a group chat
   */
  async sendMessage(chatId: string, body: string): Promise<WhapiMessageResponse> {
    return this.request<WhapiMessageResponse>('/messages/text', {
      method: 'POST',
      body: JSON.stringify({
        to: chatId,
        body,
      }),
    });
  }

  /**
   * Get list of groups the number is part of.
   * Returns raw response — caller handles flexible shape.
   */
  async getGroups(count: number = 100): Promise<any> {
    return this.request<any>(`/groups?count=${count}`);
  }

  /**
   * Get messages from a specific group.
   * Returns raw Whapi response — caller should handle the shape.
   */
  async getGroupMessages(
    chatId: string,
    count: number = 100
  ): Promise<any> {
    return this.request<any>(
      `/messages/list/${chatId}?count=${count}`
    );
  }

  /**
   * Get group info by ID
   */
  async getGroupInfo(groupId: string): Promise<WhapiGroup> {
    return this.request<WhapiGroup>(`/groups/${groupId}`);
  }

  /**
   * Get all chats (groups + direct) the number is part of.
   * Returns raw response — caller handles flexible shape.
   */
  async getChats(count: number = 100): Promise<any> {
    return this.request<any>(`/chats?count=${count}`);
  }

  /**
   * Get contact info by ID (e.g. "1234567890@s.whatsapp.net")
   */
  async getContactInfo(contactId: string): Promise<any> {
    return this.request<any>(`/contacts/${contactId}`);
  }

  // ── Group management — used by a couple's OWN paired channel ───────────────

  /**
   * Create a WhatsApp group. `participants` are phone numbers in international
   * format WITHOUT a leading '+'. At least one is required by WhatsApp. Returns
   * the new group's id (a "...@g.us" chat id) for follow-up sends / invite link.
   */
  async createGroup(
    subject: string,
    participants: string[],
  ): Promise<{ groupId: string | null; raw: unknown }> {
    const raw = await this.request<Record<string, unknown>>('/groups', {
      method: 'POST',
      body: JSON.stringify({ subject, participants }),
    });
    // CONFIRM field name against gate Swagger (group_id / id).
    const groupId = (raw?.group_id as string) ?? (raw?.id as string) ?? null;
    return { groupId, raw };
  }

  /**
   * Add participants to an existing group. Phones international, no '+'. Per
   * WhatsApp anti-spam policy some contacts can't be auto-added (privacy
   * settings) — share the invite link as the fallback.
   */
  async addParticipants(groupId: string, participants: string[]): Promise<unknown> {
    return this.request<Record<string, unknown>>(`/groups/${groupId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
  }

  /** Get the shareable invite link (https://chat.whatsapp.com/<code>) for a group. */
  async getInviteLink(groupId: string): Promise<string | null> {
    const raw = await this.request<Record<string, unknown>>(`/groups/${groupId}/invite`);
    // CONFIRM shape: Whapi returns an invite code and/or a full link.
    if (typeof raw?.invite_link === 'string') return raw.invite_link;
    if (typeof raw?.link === 'string') return raw.link;
    if (typeof raw?.invite_code === 'string') return `https://chat.whatsapp.com/${raw.invite_code}`;
    return null;
  }

  // ── Pairing (linked-device) — used during the couple's QR connect flow ─────

  /**
   * Linked-device login QR for THIS channel as a base64 image. Channel must be
   * in QR (unauthorized) state. `wakeup=true` launches the channel if asleep.
   */
  async getLoginQr(): Promise<{ qrBase64: string | null; raw: unknown }> {
    const raw = await this.request<Record<string, unknown>>('/users/login?wakeup=true');
    // CONFIRM field name (base64 / qr / image).
    const qrBase64 =
      (raw?.base64 as string) ?? (raw?.qr as string) ?? (raw?.image as string) ?? null;
    return { qrBase64, raw };
  }

  /**
   * Channel health/status — tells whether the couple's device is paired (AUTH)
   * or still waiting for the QR scan (QR/LAUNCHING). Returns the status text.
   */
  async getHealth(): Promise<{ status: string | null; raw: unknown }> {
    const raw = await this.request<Record<string, unknown>>('/health?wakeup=false');
    // CONFIRM shape: Whapi /health returns a nested status object.
    const statusVal = raw?.status as { text?: string } | string | undefined;
    const status = typeof statusVal === 'string' ? statusVal : statusVal?.text ?? null;
    return { status, raw };
  }
}

/**
 * Verify Whapi.Cloud webhook signature
 * Whapi uses a simple token-based verification
 */
export function verifyWhapiWebhook(
  requestToken: string | null
): boolean {
  const expectedToken = process.env.WHAPI_API_TOKEN;
  if (!expectedToken) return false;
  return requestToken === expectedToken;
}

// Export singleton instance (Phera's shared production number — concierge +
// vendor coordinator). Do NOT use this for per-couple group/personal sends.
export const whapiClient = new WhapiClient();

/**
 * Build a Whapi client bound to a SPECIFIC channel token — a couple's own
 * paired number. Use this for per-wedding group creation + personal sends so
 * that volume never touches Phera's shared production number.
 */
export function whapiClientForToken(token: string): WhapiClient {
  return new WhapiClient(token);
}
