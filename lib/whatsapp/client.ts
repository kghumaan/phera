/**
 * WhatsApp Business Cloud API Client
 * Handles communication with Meta's Graph API for WhatsApp messaging
 */

interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
    fbtrace_id: string;
  };
}

interface MessageStatusResponse {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

/**
 * WhatsApp Cloud API client wrapper
 */
export class WhatsAppClient {
  private baseUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.baseUrl = `https://graph.facebook.com/${apiVersion}/${this.phoneNumberId}`;

    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('⚠️ WhatsApp credentials not configured. Messages will not be sent.');
    }
  }

  /**
   * Send a text message to a phone number
   */
  async sendMessage(to: string, body: string): Promise<WhatsAppMessageResponse | null> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        console.error('WhatsApp credentials missing. Skipping message send.');
        return null;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/[^0-9]/g, ''), // Remove non-numeric characters
          type: 'text',
          text: {
            preview_url: false,
            body,
          },
        }),
      });

      if (!response.ok) {
        const error: WhatsAppError = await response.json();
        console.error('WhatsApp API Error:', error);
        throw new Error(
          `WhatsApp API error: ${error.error.message} (Code: ${error.error.code})`
        );
      }

      const data: WhatsAppMessageResponse = await response.json();
      console.log('✅ WhatsApp message sent:', data.messages[0].id);
      return data;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send a template message with parameters
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    parameters: string[] = []
  ): Promise<WhatsAppMessageResponse | null> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        console.error('WhatsApp credentials missing. Skipping template send.');
        return null;
      }

      // Build components array with parameters
      const components = parameters.length > 0 ? [
        {
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param,
          })),
        },
      ] : [];

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/[^0-9]/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
            components,
          },
        }),
      });

      if (!response.ok) {
        const error: WhatsAppError = await response.json();
        console.error('WhatsApp Template API Error:', error);
        throw new Error(
          `WhatsApp template error: ${error.error.message} (Code: ${error.error.code})`
        );
      }

      const data: WhatsAppMessageResponse = await response.json();
      console.log('✅ WhatsApp template sent:', data.messages[0].id);
      return data;
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Get the status of a sent message
   */
  async getMessageStatus(messageId: string): Promise<MessageStatusResponse | null> {
    try {
      if (!this.phoneNumberId || !this.accessToken) {
        console.error('WhatsApp credentials missing. Cannot get message status.');
        return null;
      }

      const response = await fetch(
        `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v23.0'}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error: WhatsAppError = await response.json();
        console.error('WhatsApp Status API Error:', error);
        throw new Error(
          `Failed to get message status: ${error.error.message}`
        );
      }

      const data: MessageStatusResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get message status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient();
