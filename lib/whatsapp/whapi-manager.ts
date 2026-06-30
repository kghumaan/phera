/**
 * Whapi.Cloud PARTNER (Manager) API client — manager.whapi.cloud.
 *
 * This is separate from the per-channel gate.whapi.cloud client
 * (lib/vendors/whapi-client.ts). The Partner API lets us provision one WhatsApp
 * channel PER COUPLE so they can pair their own device (QR) and we operate as
 * their number for group creation + personal sends — without ever routing that
 * volume through Phera's shared production number.
 *
 * Auth: WHAPI_PARTNER_TOKEN (partner bearer token).
 * Channels are created under WHAPI_PROJECT_ID.
 *
 * PREREQ: requires enrollment in Whapi's Partner program. Inert (and `configured`
 * is false) until both env vars are set, so importing this never fires anything.
 *
 * Docs: https://whapi-partner.readme.io/reference/createchannel
 *
 * NOTE: a few response field names below are parsed defensively and marked
 * CONFIRM — verify them against the live Partner dashboard / Swagger once the
 * partner account exists; the parsing tolerates either name in the meantime.
 */

const MANAGER_BASE = 'https://manager.whapi.cloud';

export interface CreateChannelResult {
  /** Manager channel id (used for delete / status). */
  channelId: string | null;
  /** The channel's gate.whapi.cloud API token — SENSITIVE (full WhatsApp access). */
  token: string | null;
  raw: unknown;
}

export class WhapiManagerClient {
  private partnerToken: string;
  private projectId: string;

  constructor() {
    this.partnerToken = process.env.WHAPI_PARTNER_TOKEN || '';
    this.projectId = process.env.WHAPI_PROJECT_ID || '';
  }

  /** True only when both the partner token and project id are configured. */
  get configured(): boolean {
    return Boolean(this.partnerToken && this.projectId);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.partnerToken) {
      throw new Error('WHAPI_PARTNER_TOKEN not configured — Whapi Partner API unavailable.');
    }
    const response = await fetch(`${MANAGER_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.partnerToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Whapi Manager API error: ${response.status} - ${body}`);
    }
    return response.json() as Promise<T>;
  }

  /**
   * Create a new channel under the configured project. Returns the channel id
   * and its gate token. The caller stores the token server-side (encrypted /
   * service-role only) and uses whapiClientForToken(token) for that couple.
   */
  async createChannel(name: string): Promise<CreateChannelResult> {
    if (!this.projectId) {
      throw new Error('WHAPI_PROJECT_ID not configured — cannot create a channel.');
    }
    const raw = await this.request<Record<string, unknown>>('/channels', {
      method: 'PUT',
      body: JSON.stringify({ name, projectId: this.projectId }),
    });
    return {
      // CONFIRM field names against Partner Swagger (id / channel_id, token / api_token).
      channelId: (raw?.id as string) ?? (raw?.channel_id as string) ?? null,
      token: (raw?.token as string) ?? (raw?.api_token as string) ?? null,
      raw,
    };
  }

  /** Delete a channel (teardown after the wedding) to stop billing. */
  async deleteChannel(channelId: string): Promise<void> {
    await this.request(`/channels/${channelId}`, { method: 'DELETE' });
  }

  /** Fetch a channel's metadata/status from the Manager API. */
  async getChannel(channelId: string): Promise<unknown> {
    return this.request(`/channels/${channelId}`);
  }
}

export const whapiManager = new WhapiManagerClient();
