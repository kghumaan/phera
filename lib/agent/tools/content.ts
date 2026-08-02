import { WeddingService } from '@/lib/supabase/wedding-service';
import type { AgentToolDefinition } from '../types';

export const contentTools: AgentToolDefinition[] = [
  {
    name: 'get_site_content',
    label: 'Reading website content',
    risk: 'read',
    description:
      'Get the wedding website\'s supporting content: FAQs, registry items, and shopping recommendations. Call this when the user asks what guests will see or before adding/updating an FAQ.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const [faqs, registry, shops] = await Promise.all([
        service.getFAQs(ctx.weddingUuid),
        service.getRegistry(ctx.weddingUuid),
        service.getShops(ctx.weddingUuid),
      ]);
      return {
        faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
        registry: registry.map((r) => ({ id: r.id, title: (r as Record<string, unknown>).title ?? (r as Record<string, unknown>).name })),
        shops: shops.map((s) => ({ id: s.id, name: (s as Record<string, unknown>).name })),
      };
    },
  },
  {
    name: 'add_faq',
    label: 'Adding an FAQ',
    risk: 'write',
    description:
      'Add a question/answer to the wedding website FAQ. Call this when the user wants guests to know something — dress code guidance, weather advice ("it will be hot, pack linen"), travel tips, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
      },
      required: ['question', 'answer'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const created = await service.createFAQ({
        wedding_id: ctx.weddingUuid,
        question: input.question as string,
        answer: input.answer as string,
      } as never);
      if (!created) throw new Error('Failed to create FAQ');
      // Re-fetch the full list so the review panel reflects the new total (a chat
      // edit like "add one about parking" re-emits the fresh list to the panel).
      const all = await service.getFAQs(ctx.weddingUuid);
      return {
        created: { id: created.id, question: created.question },
        faqReview: all.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
      };
    },
  },
  {
    name: 'propose_faqs',
    label: 'Drafting your FAQs',
    risk: 'write',
    description:
      'Draft several guest FAQs at once and save them live (unpublished) for the couple to review on the right. Call this once the destination city/venue is known to set up a guest FAQ section covering the city, travel, and logistics questions guests always ask (parking, weather/what to pack, getting from the airport, visa basics, dress code, kids). Provide 5–8 question/answer pairs; the couple edits or approves them in the review panel.',
    inputSchema: {
      type: 'object',
      properties: {
        faqs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
            },
            required: ['question', 'answer'],
            additionalProperties: false,
          },
        },
      },
      required: ['faqs'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const incoming = (input.faqs ?? []) as { question: string; answer: string }[];
      if (!Array.isArray(incoming) || incoming.length === 0) {
        throw new Error('propose_faqs needs a non-empty "faqs" array');
      }
      const service = new WeddingService(ctx.supabase as never);
      for (const f of incoming) {
        await service.createFAQ({
          wedding_id: ctx.weddingUuid,
          question: f.question,
          answer: f.answer,
        } as never);
      }
      // Re-fetch the full list (incl. any prior FAQs) for the review panel.
      const all = await service.getFAQs(ctx.weddingUuid);
      return {
        created: incoming.length,
        faqReview: all.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
      };
    },
  },
  {
    name: 'update_faq',
    label: 'Updating an FAQ',
    risk: 'write',
    description:
      'Update an existing FAQ\'s question or answer. Call this when the user corrects or rewords guest-facing info. Get the id from get_site_content.',
    inputSchema: {
      type: 'object',
      properties: {
        faq_id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
      },
      required: ['faq_id'],
      additionalProperties: false,
    },
    captureBefore: async (input, ctx) => {
      const { data: faq } = await ctx.supabase
        .from('wedding_faqs')
        .select('question, answer')
        .eq('wedding_id', ctx.weddingUuid)
        .eq('id', input.faq_id as string)
        .maybeSingle();
      if (!faq) return null;
      return {
        restore: 'update',
        table: 'wedding_faqs',
        match: { id: input.faq_id as string },
        values: faq,
      };
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      if (input.question !== undefined) updates.question = input.question;
      if (input.answer !== undefined) updates.answer = input.answer;
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const service = new WeddingService(ctx.supabase as never);
      const updated = await service.updateFAQ(input.faq_id as string, updates as never);
      if (!updated) throw new Error('Failed to update FAQ');
      // Re-fetch so a chat edit ("make #2 shorter") re-emits the fresh list and
      // the review panel updates before approval.
      const all = await service.getFAQs(ctx.weddingUuid);
      return {
        updated: { id: updated.id, question: updated.question },
        faqReview: all.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
        summary: `FAQ "${updated.question}" updated`,
      };
    },
  },
  {
    name: 'get_tasks',
    label: 'Reading the task board',
    risk: 'read',
    description:
      'Get the planning task board (todo / doing / done). Call this when the user asks what is left to do or before creating tasks.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async (_input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const tasks = await service.getTasks(ctx.weddingUuid);
      return {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          column: t.column,
          tags: t.tags,
        })),
      };
    },
  },
  {
    name: 'create_task',
    label: 'Creating a task',
    risk: 'write',
    description:
      'Add a task to the planning board. Call this when something actionable comes up in conversation that the couple should not forget ("book the mehndi artist", "confirm shuttle times").',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
      additionalProperties: false,
    },
    execute: async (input, ctx) => {
      const service = new WeddingService(ctx.supabase as never);
      const created = await service.createTask({
        wedding_id: ctx.weddingUuid,
        title: input.title as string,
        description: (input.description as string) ?? undefined,
        tags: (input.tags as string[]) ?? undefined,
        column: 'todo',
      });
      if (!created) throw new Error('Failed to create task');
      return { created: { id: created.id, title: created.title }, summary: `Task added: ${created.title}` };
    },
  },
  {
    name: 'update_task',
    label: 'Updating a task',
    risk: 'write',
    description:
      'Update a planning task: move it between columns (todo/doing/done) or edit its title/description. Call when the user says something is started or finished.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        column: { type: 'string', enum: ['todo', 'doing', 'done'] },
        title: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
    captureBefore: async (input, ctx) => {
      const { data: task } = await ctx.supabase
        .from('wedding_tasks')
        .select('column, title, description')
        .eq('wedding_id', ctx.weddingUuid)
        .eq('id', input.task_id as string)
        .maybeSingle();
      if (!task) return null;
      return {
        restore: 'update',
        table: 'wedding_tasks',
        match: { id: input.task_id as string },
        values: task,
      };
    },
    execute: async (input, ctx) => {
      const updates: Record<string, unknown> = {};
      for (const f of ['column', 'title', 'description'] as const) {
        if (input[f] !== undefined) updates[f] = input[f];
      }
      if (Object.keys(updates).length === 0) throw new Error('No updatable fields provided');
      const service = new WeddingService(ctx.supabase as never);
      const updated = await service.updateTask(input.task_id as string, updates as never);
      if (!updated) throw new Error('Failed to update task');
      return {
        updated: { id: updated.id, title: updated.title, column: updated.column },
        summary: `${updated.title} → ${updated.column}`,
      };
    },
  },
];
