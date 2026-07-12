import type { AgentToolDefinition } from '../types';

/**
 * request_signup is special-cased in dispatchTool — its execute() never runs.
 * It tells the chat to render the inline create-account card (email+password or
 * Google) so an anonymous landing-page visitor can sign up without leaving the
 * conversation. Only meaningful on anonymous sessions; harmless otherwise.
 */
export const signupTools: AgentToolDefinition[] = [
  {
    name: 'request_signup',
    label: 'Offering to save their account',
    risk: 'read',
    description:
      'ANONYMOUS sessions only (snapshot Account line says ANONYMOUS): show the inline create-account card in the chat so the visitor can sign up and keep everything you\'ve set up together. Call it once, at the natural signup moment — after you know their names and what they want. Never ask for an email or password in prose.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async () => ({ shown: true }),
  },
];
