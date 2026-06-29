import type { AgentToolDefinition } from '../types';

/**
 * DPDPA consent logging. The agent must obtain an explicit opt-in (via ask_user)
 * before collecting any personal guest data, then call this to record it. The
 * dispatcher's agent_actions audit row — tool_name, input {scope, language},
 * wedding_id, conversation_id, created_at — IS the durable, timestamped consent
 * record, so no separate table is needed for v1.
 */
export const consentTools: AgentToolDefinition[] = [
  {
    name: 'record_consent',
    label: 'Recording consent',
    risk: 'write',
    description:
      "Log the couple's explicit consent to collect and process personal guest data (passport name, visa status, arrival/departure, emergency contact, etc.) under India's DPDPA. HARD RULE — before you collect ANY of that data you MUST first get a clear opt-in: call ask_user with ONE single_select, prompt e.g. \"Okay to collect your guests' travel & ID details?\", and put the notice in the hint: \"We'll store passport name, visa status, arrival/departure and emergency contact only to coordinate your wedding — stored securely, used only for your wedding, and deletable anytime. (Hindi: हम ये जानकारी केवल आपकी शादी के समन्वय के लिए सुरक्षित रूप से रखेंगे; कभी भी हटाई जा सकती है।)\", options [\"I agree\",\"Not now\"]. ONLY if they pick \"I agree\", call record_consent and proceed. If \"Not now\", do NOT collect logistics data. Never collect personal data without recording consent first. Don't re-ask within the same session once recorded.",
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          description: 'What the consent covers, e.g. "guest travel & ID logistics"',
        },
        language: {
          type: 'string',
          enum: ['en', 'hi', 'en+hi'],
          description: 'Language(s) the notice was shown in. Default en+hi.',
        },
      },
      required: ['scope'],
      additionalProperties: false,
    },
    execute: async (input) => {
      const scope = String(input.scope ?? '').trim() || 'guest personal data';
      const language = ['en', 'hi', 'en+hi'].includes(String(input.language))
        ? String(input.language)
        : 'en+hi';
      return {
        recorded: true,
        scope,
        language,
        given_at: new Date().toISOString(),
        note: 'Consent logged (audit trail written). You may now collect this scope of personal data. Do not ask for consent again this session.',
      };
    },
  },
];
