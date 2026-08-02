import type { AgentToolDefinition } from '../types';

/**
 * request_upload is special-cased in dispatchTool — its execute() never runs.
 * It tells the chat to render an inline upload card (with the recommended file
 * format) so the user can attach a guest list or floor plan right in the chat.
 */
export const uploadTools: AgentToolDefinition[] = [
  {
    name: 'request_upload',
    label: 'Requesting an upload',
    risk: 'read',
    description:
      'Show the user an inline upload card so they can attach a file directly in the chat. Use this for bulk guest lists (kind "guests") or hotel floor plans (kind "rooms") instead of telling them to use a button or another page. The card includes the recommended format.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['guests', 'rooms'], description: 'What to upload' },
      },
      required: ['kind'],
      additionalProperties: false,
    },
    execute: async () => ({ shown: true }),
  },
];
