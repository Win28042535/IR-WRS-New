# IR PLUS · WRS — Authentication, RBAC & RLS Plan (Phase 1)

Goal: a single source of truth where every stakeholder collaborates on the same project
but only sees data relevant to their role.

## Status
- **Now (no backend):** RBAC runs in the UI as a *mock role switcher* (`lib/roleStore.ts` +
  `lib/rbac.ts` + `RoleGate`). Pages are gated by capability. This mirrors the production
  model exactly so it ports 1:1.
- **To enable real auth:** create a Supabase project → run `supabase/schema.sql` (it now
  includes the Auth + RLS section) → add keys to `.env.local` → swap the mock role for the
  signed-in user's `profiles.role`.

## Roles & Capabilities (source of truth = `lib/rbac.ts`)

| Role | Capabilities |
|------|--------------|
| **admin** | everything (users, packages, workflows, permissions, assets) |
| **sales** | sales workspace, dashboard, summary, invite clients (clientFlow) |
| **client** | own client flow + own project preview/comments/approvals |
| **pm** | pm validation, dashboard, summary |
| **executive** | executive review, dashboard, summary |
| **designer** | design workspace, dashboard, summary |
| **developer** | dev handover, dashboard, summary |

Route guards (UI): `/sales`→sales · `/pm`→pm · `/executive`→executive · `/design`→design ·
`/dashboard`→dashboard · `/summary`→summary · `/flow*`,`/status`,`/`→client-open.

## Database (see schema.sql)
- `profiles(id→auth.users, role)` — role per user; `current_role()` SQL helper.
- `requirements.owner` / `assigned_pm` — ownership columns for RLS.
- **RLS:** internal roles read all; clients read only `owner = auth.uid()`. Writes scoped by
  role (clients edit own drafts; pm/exec/admin change status & approvals; admin deletes).

## Migration steps (1 sprint)
1. Enable Supabase Auth (email magic-link or OAuth).
2. Trigger to insert a `profiles` row on signup (default role `client`); admin assigns roles.
3. Replace `useRole()` reads with the session profile role (keep `RoleGate`/`can()` as-is).
4. Set `requirements.owner = auth.uid()` on submit; set `assigned_pm` from Sales/PM.
5. Run the Auth+RLS block in `schema.sql` (drops the demo-open policies).

## Workflow status model (used by PM & Executive)
`draft → submitted → (PM) in_review|collecting → (Executive) frozen|change_request → archived`
- **PM**: validate → *Approve* (→ in_review, to Executive) or *Request Info* (→ collecting).
- **Executive**: review → *Approve & Freeze* (→ frozen) or *Request Revision* (→ change_request).
