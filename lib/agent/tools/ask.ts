import type { AgentToolDefinition } from '../types';

/**
 * ask_user is special-cased in dispatchTool — its execute() never runs.
 * It parks the questions; the chat renders one input per question (text,
 * date picker, single/multi-select) and the answers return as the next
 * message. Use it whenever you need specific inputs from the user.
 */
export const askTools: AgentToolDefinition[] = [
  {
    name: 'ask_user',
    label: 'Asking for details',
    risk: 'read',
    description:
      'Use this to ask the user one or more specific questions and collect typed answers via proper input fields (shown one at a time). ALWAYS prefer calling this over asking for structured info in prose — names, dates, a choice from options, etc. Group related questions into one call. Types: "text" (short answer), "textarea" (long answer), "date" (date picker), "single_select" (pick one of options), "multi_select" (pick several of options). Provide "options" for the select types.',
    inputSchema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          description: 'The questions to ask, in order.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Short stable key, e.g. "couple_names"' },
              prompt: { type: 'string', description: 'The question shown to the user' },
              type: { type: 'string', enum: ['text', 'textarea', 'date', 'single_select', 'multi_select'] },
              options: { type: 'array', items: { type: 'string' }, description: 'Choices for select types' },
              allowOther: { type: 'boolean', description: 'For select types: let the user add their own option(s) too' },
              placeholder: { type: 'string' },
              optional: { type: 'boolean', description: 'If true, the user may skip it' },
            },
            required: ['id', 'prompt', 'type'],
            additionalProperties: false,
          },
        },
      },
      required: ['questions'],
      additionalProperties: false,
    },
    // Never invoked — dispatchTool intercepts ask_user by name.
    execute: async () => ({ parked: true }),
  },
];
