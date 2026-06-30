# Agent Knowledge Base

`agent_knowledge` is the curated data layer behind the planner agent's
`search_knowledge` tool: vendor directories, venue notes, seasonal and
cultural guidance, city logistics. The agent searches it before answering
local-recommendation questions so answers come from Phera's data, not model
memory.

## Scopes

| scope     | meaning                                  | required column |
|-----------|------------------------------------------|-----------------|
| `global`  | applies everywhere (e.g. e-Visa guidance) | —              |
| `city`    | one city/region                           | `city`         |
| `wedding` | one wedding only                          | `wedding_id` (slug) |

Categories: `vendor`, `venue`, `seasonal`, `cultural`, `logistics`.

RLS: `global`/`city` rows are readable by all authenticated users but only
writable via the service role / SQL editor — load curated data there.
`wedding` rows are owner/admin-scoped like everything else.

## Loading data (SQL editor, both envs)

```sql
INSERT INTO agent_knowledge (scope, city, category, title, content, metadata) VALUES
  ('city', 'Udaipur', 'vendor', 'Mehndi artists — Udaipur',
   'Phera-vetted: Rani Mehndi Studio (+91 98... , books 3-4 months out, ₹15-40k for bridal). '
   || 'Lakecity Henna Collective (large parties, travels to venue). Ask for the wedding-party day rate.',
   '{"vetted": true}'),
  ('city', 'Udaipur', 'seasonal', 'Udaipur in January',
   'Cool season: ~25°C days, single-digit °C evenings. Outdoor night events need heaters/shawls; '
   || 'advise guests to pack layers. No monsoon risk.',
   NULL),
  ('global', NULL, 'logistics', 'India e-Visa for wedding guests',
   'Most foreign guests need an Indian e-Visa (tourist). Online application, typically approved in '
   || '72h but advise applying 3-4 weeks out. Passport must be valid 6+ months with 2 blank pages.',
   NULL);
```

The agent scopes city matches to the wedding's own `venue_location` by
default, so a "Udaipur" entry surfaces automatically for Udaipur weddings.

## Roadmap

Current retrieval is filter + ilike — fine for hundreds of entries. When the
corpus grows (full vendor directories per city), add a pgvector embedding
column and swap the tool's query for semantic search; the tool's interface
won't need to change.
