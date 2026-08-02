/**
 * WhatsApp Chat Export Parser
 * Parses .txt exports from WhatsApp (iOS & Android formats)
 * Uses whatsapp-chat-parser npm package with fallback regex parsing
 */

export interface ParsedMessage {
  timestamp: Date;
  sender: string;
  message: string;
}

/**
 * Parse a WhatsApp .txt chat export into structured messages.
 * Handles both iOS and Android export formats.
 */
export async function parseWhatsAppExport(text: string): Promise<ParsedMessage[]> {
  try {
    // Try using whatsapp-chat-parser first
    const parser = await import('whatsapp-chat-parser');
    const result = await parser.parseString(text);
    return result
      .filter((m: { author: string | null }) => m.author !== null) // Filter system messages
      .map((m: { date: Date; author: string | null; message: string }) => ({
        timestamp: m.date,
        sender: m.author || 'Unknown',
        message: m.message,
      }));
  } catch {
    // Fallback: manual regex parsing
    console.warn('whatsapp-chat-parser failed, using fallback regex parser');
    return fallbackParse(text);
  }
}

// ------------------------------------------------------------------
// Fallback regex parser for various WhatsApp export formats
// ------------------------------------------------------------------

// Common WhatsApp timestamp + sender patterns:
// Android: "1/15/24, 10:30 AM - John: Hello"
// iOS:     "[1/15/24, 10:30:15 AM] John: Hello"
// 24h:     "15/01/2024, 14:30 - John: Hello"
const LINE_PATTERNS = [
  // Android: MM/DD/YY, HH:MM AM/PM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-–]\s*(.+?):\s+([\s\S]*)/,
  // iOS: [MM/DD/YY, HH:MM:SS AM/PM] Sender: Message
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s*(.+?):\s+([\s\S]*)/,
  // DD/MM/YYYY, HH:MM - Sender: Message (European format)
  /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(.+?):\s+([\s\S]*)/,
];

function fallbackParse(text: string): ParsedMessage[] {
  const lines = text.split('\n');
  const messages: ParsedMessage[] = [];
  let current: ParsedMessage | null = null;

  for (const line of lines) {
    let matched = false;

    for (const pattern of LINE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Save previous message
        if (current) messages.push(current);

        const [, timestampStr, sender, message] = match;
        current = {
          timestamp: parseTimestamp(timestampStr),
          sender: sender.trim(),
          message: message.trim(),
        };
        matched = true;
        break;
      }
    }

    // Continuation of previous message (multi-line)
    if (!matched && current && line.trim()) {
      current.message += '\n' + line.trim();
    }
  }

  // Don't forget the last message
  if (current) messages.push(current);

  return messages;
}

function parseTimestamp(str: string): Date {
  // Clean up the string
  const cleaned = str.replace(/[\[\]]/g, '').trim();
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? new Date() : date;
}
