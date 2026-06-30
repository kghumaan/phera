-- Planner requests queue
-- ───────────────────────────────────────────────────────────────────────────
-- Durable store for things the AI Planner hands to the Phera team: MANAGED
-- service briefs (venue/vendor sourcing, photo album, save-the-dates) and
-- UNSUPPORTED asks (features we don't do yet). The `submit_request` agent tool
-- writes here AND emails contact@phera.io; this table is the queryable queue.
--
-- The tool is resilient to this table not existing (it still emails + audits),
-- so running this is what upgrades "we got notified" → "we have a real queue".
-- Apply to the TEST project first, verify, then production. Do NOT run via CLI.

create table if not exists public.planner_requests (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  text not null,                              -- slug, matches the app-wide TEXT pattern
  kind        text not null check (kind in ('managed', 'unsupported')),
  service     text not null,
  details     text not null default '',
  budget      text,                                       -- sourcing requests only; internal-only
  status      text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  created_by  uuid,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists planner_requests_wedding_idx on public.planner_requests (wedding_id);
create index if not exists planner_requests_status_idx  on public.planner_requests (status);

alter table public.planner_requests enable row level security;

-- Owners/admins of the wedding can read & manage their own requests. The agent
-- writes via the server (service role) which bypasses RLS; these policies cover
-- any authenticated-user path and keep one wedding from seeing another's.
create policy "planner_requests owner select" on public.planner_requests
  for select using (public.is_wedding_owner_or_admin_by_slug(wedding_id));

create policy "planner_requests owner insert" on public.planner_requests
  for insert with check (public.is_wedding_owner_or_admin_by_slug(wedding_id));

create policy "planner_requests owner update" on public.planner_requests
  for update using (public.is_wedding_owner_or_admin_by_slug(wedding_id));
