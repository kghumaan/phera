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

interface WhapiGroupMessage {
  id: string;
  from: string;
  from_name?: string;
  body: string;
  timestamp: number;
  type: string;
  has_media?: boolean;
  [key: string]: unknown;
}

export class WhapiClient {
  private baseUrl = 'https://gate.whapi.cloud';
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.WHAPI_API_TOKEN || '';
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

// Export singleton instance
export const whapiClient = new WhapiClient();
