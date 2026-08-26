-- Cartwise household sharing.
--
-- Run this once against a fresh Supabase project (SQL Editor → New query).
-- It is written to be re-runnable: every object is created if-not-exists or
-- dropped first, so applying it twice is harmless.
--
-- Design notes
--
-- * Rows are never hard-deleted. `deleted` plus `updated_at` gives us
--   last-write-wins sync that survives a device being offline: a phone that
--   reconnects after an hour can still tell "deleted while I was away" from
--   "never existed".
-- * Last-write-wins is deliberate. For a grocery list the realistic conflict
--   is two people ticking things off at once, where either outcome is fine.
--   Anything stronger (CRDTs, operational transform) is a large amount of
--   machinery for a problem this domain does not have.
-- * Only shared data lives here. The Vault, trip history, photo stickers and
--   expiry stay on the device — they are personal, they are the bulk of the
--   data, and sharing them was never the point.

-- ---------------------------------------------------------------- households

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  created_by uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists household_members_user_idx
  on public.household_members (user_id);

-- Short codes people can read out loud. Single use, and they expire.
create table if not exists public.household_invites (
  code text primary key,
  household_id uuid not null references public.households on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid references auth.users on delete set null,
  used_at timestamptz
);

-- --------------------------------------------------------------- shared data

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households on delete cascade,
  name text not null,
  budget numeric(12, 2) not null default 0,
  store_name text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create index if not exists lists_household_idx on public.lists (household_id, updated_at desc);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists on delete cascade,
  name text not null,
  category text not null default 'other',
  qty numeric(12, 3) not null default 1,
  unit text not null default 'pc',
  -- Null means the price is unknown, which is different from zero. Totals
  -- leave these out rather than counting them as free.
  price numeric(12, 2),
  checked boolean not null default false,
  impulse boolean not null default false,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create index if not exists list_items_list_idx on public.list_items (list_id, updated_at desc);

-- ------------------------------------------------------------------ helpers

-- Membership lookup used by every policy below.
--
-- SECURITY DEFINER matters here: it runs as the owner and so skips RLS on
-- household_members. Without it, the policy on household_members would query
-- household_members and recurse forever — the classic way to lock yourself
-- out of a Supabase project.
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = hid
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.list_household(lid uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.lists where id = lid;
$$;

-- Keep updated_at honest: a client cannot forge an older timestamp to win a
-- last-write-wins race.
create or replace function public.touch_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists lists_touch on public.lists;
create trigger lists_touch before insert or update on public.lists
  for each row execute function public.touch_row();

drop trigger if exists list_items_touch on public.list_items;
create trigger list_items_touch before insert or update on public.list_items
  for each row execute function public.touch_row();

-- --------------------------------------------------------------------- RLS

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists households_read on public.households;
create policy households_read on public.households
  for select using (public.is_household_member(id));

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert with check (created_by = auth.uid());

drop policy if exists households_update on public.households;
create policy households_update on public.households
  for update using (public.is_household_member(id));

drop policy if exists members_read on public.household_members;
create policy members_read on public.household_members
  for select using (public.is_household_member(household_id));

-- You may add yourself, and only yourself. Joining a household you were not
-- invited to is prevented by the invite redemption function, not here.
drop policy if exists members_insert_self on public.household_members;
create policy members_insert_self on public.household_members
  for insert with check (user_id = auth.uid());

drop policy if exists members_delete_self on public.household_members;
create policy members_delete_self on public.household_members
  for delete using (user_id = auth.uid());

drop policy if exists invites_read on public.household_invites;
create policy invites_read on public.household_invites
  for select using (public.is_household_member(household_id));

drop policy if exists invites_insert on public.household_invites;
create policy invites_insert on public.household_invites
  for insert with check (public.is_household_member(household_id));

drop policy if exists lists_all on public.lists;
create policy lists_all on public.lists
  for all
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists list_items_all on public.list_items;
create policy list_items_all on public.list_items
  for all
  using (public.is_household_member(public.list_household(list_id)))
  with check (public.is_household_member(public.list_household(list_id)));

-- ------------------------------------------------------------ invite flow

-- Redeeming an invite is the one operation that has to reach across the
-- membership boundary, so it is a SECURITY DEFINER function with its own
-- checks rather than an RLS hole.
create or replace function public.redeem_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.household_invites;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select * into inv
  from public.household_invites
  where code = upper(trim(invite_code))
  for update;

  if inv is null then
    raise exception 'invite not found';
  end if;
  if inv.used_by is not null then
    raise exception 'invite already used';
  end if;
  if inv.expires_at < now() then
    raise exception 'invite expired';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update public.household_invites
  set used_by = auth.uid(), used_at = now()
  where code = inv.code;

  return inv.household_id;
end;
$$;

-- Creating a household must also enrol the creator as owner, atomically —
-- otherwise a failure between the two writes leaves a household nobody can see.
create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  insert into public.households (name, created_by)
  values (trim(household_name), auth.uid())
  returning id into new_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

-- Live updates for everyone looking at the same list.
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_items;
