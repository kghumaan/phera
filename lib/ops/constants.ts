/**
 * Observability (/ops) dashboard constants.
 * PIN-gated internal dashboard for the Phera builder.
 */

export const OPS_COOKIE_NAME = 'ops_session';
export const OPS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

const DEFAULT_PIN_FALLBACK = '109910';
const DEFAULT_SECRET_FALLBACK = 'phera-ops-dev-secret-change-me';

export function getOpsPin(): string {
  return process.env.OPS_PIN || DEFAULT_PIN_FALLBACK;
}

export function getOpsCookieSecret(): string {
  return process.env.OPS_COOKIE_SECRET || DEFAULT_SECRET_FALLBACK;
}

/**
 * Tables to wipe when deleting a wedding. Order matters — children before parents.
 * `key` = column name holding the wedding reference.
 * `keyType`:
 *   - 'slug'   → column is TEXT slug (weddings.slug)
 *   - 'uuid'   → column is UUID pointing at weddings.id
 *   - 'schedule_child' → deleted via subquery on wedding_schedule.wedding_id (UUID)
 */
export type OpsTable = {
  table: string;
  key: string;
  keyType: 'slug' | 'uuid' | 'schedule_child';
};

export const OPS_DELETE_TABLES: OpsTable[] = [
  // schedule_items is keyed via wedding_schedule (must delete before wedding_schedule)
  { table: 'schedule_items', key: 'schedule_id', keyType: 'schedule_child' },

  // slug-keyed tables
  { table: 'rsvps', key: 'wedding_id', keyType: 'slug' },
  { table: 'comments', key: 'wedding_id', keyType: 'slug' },
  { table: 'rsvp_custom_questions', key: 'wedding_id', keyType: 'slug' },
  { table: 'guest_flights', key: 'wedding_id', keyType: 'slug' },
  { table: 'guest_hotels', key: 'wedding_id', keyType: 'slug' },
  { table: 'guest_visas', key: 'wedding_id', keyType: 'slug' },
  { table: 'guest_checklist_items', key: 'wedding_id', keyType: 'slug' },
  { table: 'travel_bus_signups', key: 'wedding_id', keyType: 'slug' },
  { table: 'wedding_rooms', key: 'wedding_id', keyType: 'slug' },
  { table: 'milestones', key: 'wedding_id', keyType: 'slug' },
  { table: 'coordination_issues', key: 'wedding_id', keyType: 'slug' },
  { table: 'concierge_broadcast_recipients', key: 'wedding_id', keyType: 'slug' },
  { table: 'concierge_broadcasts', key: 'wedding_id', keyType: 'slug' },
  { table: 'outreach_events', key: 'wedding_id', keyType: 'slug' },
  { table: 'outreach_escalations', key: 'wedding_id', keyType: 'slug' },
  { table: 'outreach_sequences', key: 'wedding_id', keyType: 'slug' },
  { table: 'pin_access', key: 'wedding_id', keyType: 'slug' },
  { table: 'vendor_messages', key: 'wedding_id', keyType: 'slug' },
  { table: 'vendor_insights', key: 'wedding_id', keyType: 'slug' },
  { table: 'vendor_conversations', key: 'wedding_id', keyType: 'slug' },
  { table: 'conversation_members', key: 'wedding_id', keyType: 'slug' },
  { table: 'vendors', key: 'wedding_id', keyType: 'slug' },
  { table: 'whatsapp_broadcasts', key: 'wedding_id', keyType: 'slug' },
  { table: 'whatsapp_messages', key: 'wedding_id', keyType: 'slug' },
  { table: 'whatsapp_opt_ins', key: 'wedding_id', keyType: 'slug' },
  // agent_messages + agent_feedback cascade from agent_conversations (FK ON DELETE CASCADE)
  { table: 'agent_conversations', key: 'wedding_id', keyType: 'slug' },
  { table: 'agent_actions', key: 'wedding_id', keyType: 'slug' },
  { table: 'agent_knowledge', key: 'wedding_id', keyType: 'slug' },
  { table: 'guests', key: 'wedding_id', keyType: 'slug' },

  // uuid-keyed tables (must delete before weddings row)
  { table: 'transportation_vehicles', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_vehicle_types', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_pickup_locations', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_time_ranges', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_reservations', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_groups', key: 'wedding_id', keyType: 'uuid' },
  { table: 'transportation_settings', key: 'wedding_id', keyType: 'uuid' },
  { table: 'travel_sections', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_schedule', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_events', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_faqs', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_shops', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_registry', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_travel_cards', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_invites', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_tasks', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_settings', key: 'wedding_id', keyType: 'uuid' },
  { table: 'wedding_admins', key: 'wedding_id', keyType: 'uuid' },
  { table: 'whatsapp_chat_history', key: 'wedding_id', keyType: 'uuid' },
  { table: 'concierge_knowledge_base', key: 'wedding_id', keyType: 'uuid' },
  { table: 'feature_requests', key: 'wedding_id', keyType: 'uuid' },
];
