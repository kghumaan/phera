# WhatsApp Groups & Broadcasts — Setup & Operator Notes

The Phera Agent can now create a wedding's WhatsApp **group** and **broadcast** to
guests, driven from the planner chat. This is a **hybrid** model:

- **Couple's own number (paired via QR)** — for creating the guest group and
  sending personal broadcasts. Feels native to guests, protects Phera's shared
  number, and their contacts add to groups more reliably.
- **Phera's shared number** — unchanged, still powers the 24/7 concierge + the
  vendor coordinator. We deliberately do **not** route group blasts through it.
- **wa.me** — zero-setup fallback (couple taps to send themselves).

Gated to **paid plans** and provisioned **on opt-in**, with teardown after the wedding.

---

## 1. Prerequisites (blocks live use)

Live channel creation + pairing **cannot run** until these exist. All the code is
inert without them (it never fires), so the app is safe to ship before this is done.

### Env vars
| Var | What | Where |
|-----|------|-------|
| `WHAPI_PARTNER_TOKEN` | Whapi **Partner** bearer token (Manager API) | Whapi Partner dashboard |
| `WHAPI_PROJECT_ID` | Project under which per-couple channels are created | Whapi Partner dashboard |
| `WHATSAPP_GROUP_SEED_PHONE` | Optional. One seed number for new groups (WhatsApp needs ≥1 participant at creation). Falls back to `COORDINATOR_PHONE_NUMBER`. International, no `+`. | — |

`WHAPI_API_TOKEN` (the existing shared number) is unchanged.

### Whapi Partner enrollment
1. Enroll in Whapi's Partner / white-label program → get the Partner token + a Project.
2. Per-couple channel cost ≈ **$29/mo** (less with annual/volume/partner pricing).
   We create on opt-in and **delete after the wedding** (`teardownChannel`) to stop billing.

### Database migration (run manually, both envs)
`migrations/20260630_wedding_whatsapp_channels.sql` — creates the service-role-only
`wedding_whatsapp_channels` table (holds the per-couple channel token).
Apply to **phera-test first**, then production (per project policy — do not run from CLI).

---

## 2. Confirm against the live Partner dashboard

A few Whapi response field names weren't fully documented; the code parses them
defensively and is marked `// CONFIRM`. Verify once the Partner account exists:

- `lib/whatsapp/whapi-manager.ts` — `createChannel` response: channel **id** (`id`/`channel_id`) and **token** (`token`/`api_token`).
- `lib/vendors/whapi-client.ts` — `createGroup` group id (`group_id`/`id`), `getInviteLink` shape (`invite_link`/`link`/`invite_code`), `getLoginQr` base64 field (`base64`/`qr`/`image`), `getHealth` status (`status.text`/`status`).

---

## 3. How it flows (agent tools)

1. `get_whatsapp_connection` — is the couple paired? group exists?
2. `connect_whatsapp` → opens the QR pairing panel; couple scans in WhatsApp ›
   Linked Devices → channel becomes `auth`.
3. `create_guest_whatsapp_group` (gated) → creates the group on their number
   (they're admin), returns a join link.
4. `broadcast_message` → drafts a message + opens the review panel; couple
   confirms the audience and sends from their number / Phera's number / wa.me.

**Safety baked in:** never mass-add guests to a group (risks the couple's number
+ WhatsApp privacy settings block it) — broadcast the **join link** so they
self-join. Keep volume sane; get consent before messaging.

---

## 4. Routes
- `POST /api/whatsapp/connect` — provision channel (paid) · `GET` — poll status
- `GET /api/whatsapp/connect/qr` — base64 QR (token never leaves the server)
- `POST /api/whatsapp/send` — send broadcast (`via: couple | phera`)
- `POST /api/whatsapp/disconnect` — delete channel, clear token (teardown)
