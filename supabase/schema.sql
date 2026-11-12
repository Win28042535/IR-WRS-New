-- ═══════════════════════════════════════════════════════════════
-- IR PLUS · WRS — Supabase schema
-- Run in Supabase Studio → SQL Editor (once), then add keys to .env.local
-- ═══════════════════════════════════════════════════════════════

-- Requirements stored as JSONB documents (mirrors lib/types.ts → Requirement).
-- Top-level columns (status/company/industry) are denormalised for fast filtering.
create table if not exists public.requirements (
  id          text primary key,
  data        jsonb not null,
  status      text,
  company     text,
  industry    text,
  updated_at  timestamptz not null default now()
);

create index if not exists requirements_status_idx     on public.requirements (status);
create index if not exists requirements_updated_at_idx on public.requirements (updated_at desc);

-- Row Level Security
alter table public.requirements enable row level security;

-- ⚠️ DEMO policies = open access. For production, replace with auth-based policies
-- (e.g. tie rows to org/user via auth.uid() and a memberships table).
drop policy if exists "wrs_read"   on public.requirements;
drop policy if exists "wrs_insert" on public.requirements;
drop policy if exists "wrs_update" on public.requirements;
drop policy if exists "wrs_delete" on public.requirements;
create policy "wrs_read"   on public.requirements for select using (true);
create policy "wrs_insert" on public.requirements for insert with check (true);
create policy "wrs_update" on public.requirements for update using (true);
create policy "wrs_delete" on public.requirements for delete using (true);

-- Realtime (so Client Mode ↔ Internal Mode reflect changes live)
alter publication supabase_realtime add table public.requirements;


-- ═══════════════════════════════════════════════════════════════
-- PHASE 1 · Authentication + RBAC + RLS (run when enabling Supabase Auth)
-- Replaces the DEMO-open policies above with role-aware Row-Level Security.
-- ═══════════════════════════════════════════════════════════════

-- 1 profile per auth user, holds the role.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'client'
             check (role in ('admin','sales','client','pm','executive','designer','developer')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- helper: current user's role
create or replace function public.current_role() returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ownership columns on requirements
alter table public.requirements add column if not exists owner       uuid;  -- client who owns it
alter table public.requirements add column if not exists assigned_pm uuid;

-- swap demo policies → role-aware
drop policy if exists "wrs_read"   on public.requirements;
drop policy if exists "wrs_insert" on public.requirements;
drop policy if exists "wrs_update" on public.requirements;
drop policy if exists "wrs_delete" on public.requirements;

-- internal roles see everything; clients see only their own rows
create policy "req_read" on public.requirements for select using (
  public.current_role() in ('admin','sales','pm','executive','designer','developer')
  or owner = auth.uid()
);
create policy "req_insert" on public.requirements for insert with check (
  owner = auth.uid() or public.current_role() in ('admin','sales')
);
-- clients edit own drafts; pm/exec/admin can change status/approvals
create policy "req_update" on public.requirements for update using (
  owner = auth.uid() or public.current_role() in ('admin','sales','pm','executive')
);
create policy "req_delete" on public.requirements for delete using (
  public.current_role() = 'admin'
);

-- projects: sales/admin manage; others read
create table if not exists public.projects (
  id text primary key, data jsonb not null, updated_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "proj_read"  on public.projects for select using (auth.role() = 'authenticated');
create policy "proj_write" on public.projects for all
  using (public.current_role() in ('admin','sales'))
  with check (public.current_role() in ('admin','sales'));

-- contact_messages: homepage "ฝากเรื่อง" form. Anyone may leave a message (insert only);
-- internal roles read and manage them.
create table if not exists public.contact_messages (
  id text primary key,
  name text, company text, contact text, topic text, message text,
  created_at timestamptz default now()
);
alter table public.contact_messages enable row level security;
create policy "msg_insert" on public.contact_messages for insert with check (true);
create policy "msg_read" on public.contact_messages for select using (
  public.current_role() in ('admin','sales','pm','executive')
);
create policy "msg_delete" on public.contact_messages for delete using (
  public.current_role() in ('admin','sales')
);
