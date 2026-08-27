-- CartWise community pricing.
--
-- Run this once against your Supabase project (SQL Editor → New query), after
-- schema.sql. It is re-runnable: every object is created if-not-exists or
-- dropped first, so applying it twice is harmless.
--
-- This table is a different shape from everything in schema.sql, and the
-- difference is the whole design problem. Household data is private and
-- scoped to members. This is the opposite: anyone may read it, and anyone may
-- write to it without an account. That combination is what makes it useful
-- and what makes it a target, so the guards below are load-bearing rather
-- than decorative.
--
-- Design notes
--
-- * `reported_on` is a DATE, not a timestamptz. The column type enforces the
--   privacy property rather than trusting the client to round: a precise time
--   plus a shop is a movement record, and here one cannot be stored even by a
--   caller that wants to.
-- * `created_at` is a real timestamp, needed to rate-limit and to age rows
--   out. It is deliberately NOT granted to anon, so it cannot be read back
--   and correlated with anything.
-- * Reads go through a consensus view, never the raw table. One person can
--   report milk at ₱1; a median over recent reports absorbs that, where
--   "newest wins" would hand the whole app a lie.
-- * Rows are immutable. No update or delete policy exists for anon, so a
--   report cannot be edited after the fact by whoever sent it or anyone else.

-- ------------------------------------------------------------------ reports

create table if not exists public.price_reports (
  id            uuid primary key default gen_random_uuid(),

  -- 'ean:4800361410816' when a barcode was scanned, 'name:alaska-condensed'
  -- otherwise. Only the first pools reliably between strangers, which is what
  -- exact_match records.
  product_key   text not null check (char_length(product_key) between 3 and 200),
  exact_match   boolean not null default false,
  product_name  text not null check (char_length(product_name) between 1 and 200),

  store_key     text not null check (char_length(store_key) between 3 and 200),
  store_name    text not null check (char_length(store_name) between 1 and 120),

  -- A price, not a total. The upper bound is a sanity guard, not a business
  -- rule: it exists so a fat finger or a hostile client cannot poison an
  -- average with 1e9.
  price         numeric(12, 2) not null check (price > 0 and price <= 100000),
  unit          text check (unit is null or char_length(unit) <= 24),
  currency      text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),

  -- Day granularity, enforced by the type. See the design note above.
  reported_on   date not null check (
    reported_on <= current_date and reported_on > current_date - interval '400 days'
  ),

  -- Server clock. Never granted to anon.
  created_at    timestamptz not null default now()
);

-- The query the app actually makes: everything for these products, recent
-- first. Without this it is a sequential scan over the whole pool.
create index if not exists price_reports_lookup
  on public.price_reports (product_key, store_key, reported_on desc);

create index if not exists price_reports_created
  on public.price_reports (created_at desc);

-- ---------------------------------------------------------------- consensus

-- What the app reads. Per product and shop: the median of the last 30 days of
-- reports, how many back it, and how recent the freshest one is.
--
-- Median rather than mean: a single ₱1 report shifts a mean of four prices by
-- a quarter, and shifts a median not at all. `percentile_cont` interpolates,
-- which is the behaviour you want for an even number of reports.
drop view if exists public.price_consensus;
create view public.price_consensus as
select
  product_key,
  exact_match,
  store_key,
  -- The most commonly reported spelling, so the UI has something to print.
  mode() within group (order by store_name)   as store_name,
  mode() within group (order by product_name) as product_name,
  mode() within group (order by unit)         as unit,
  currency,
  percentile_cont(0.5) within group (order by price)::numeric(12, 2) as price,
  count(*)                                    as sightings,
  max(reported_on)                            as last_reported_on,
  min(price)                                  as lowest,
  max(price)                                  as highest
from public.price_reports
where reported_on > current_date - interval '30 days'
group by product_key, exact_match, store_key, currency
-- One person's word is not a consensus, but it is all there is at the start,
-- so it is published with its count and the client decides how to show it.
having count(*) >= 1;

-- --------------------------------------------------------------------- RLS

alter table public.price_reports enable row level security;

-- Nobody reads the raw table. Everything goes through the view, which cannot
-- expose created_at and cannot be used to pull one person's submissions.
drop policy if exists price_reports_no_read on public.price_reports;

-- Anonymous insert, shape-checked. Everything a client can get wrong is
-- already a CHECK constraint above; this policy exists to allow the insert at
-- all, and to refuse a row that claims to have been reported in the future.
drop policy if exists price_reports_insert on public.price_reports;
create policy price_reports_insert on public.price_reports
  for insert
  with check (reported_on <= current_date);

-- No update policy and no delete policy: a report is immutable once made.

-- ------------------------------------------------------------------ grants

revoke all on public.price_reports from anon, authenticated;

-- Insert only, and only these columns. created_at and id are the server's.
grant insert (
  product_key, exact_match, product_name,
  store_key, store_name,
  price, unit, currency, reported_on
) on public.price_reports to anon, authenticated;

grant select on public.price_consensus to anon, authenticated;

-- --------------------------------------------------------------- retention

-- Reports older than a year are neither useful nor ours to keep. Schedule
-- with pg_cron if the extension is enabled:
--   select cron.schedule('cartwise-prune', '0 3 * * *',
--     $$ select public.prune_price_reports() $$);
create or replace function public.prune_price_reports()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.price_reports
  where reported_on < current_date - interval '365 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.prune_price_reports() from anon, authenticated;

-- ------------------------------------------------------------------- notes
--
-- NOT DONE HERE, and it matters:
--
-- Rate limiting. Postgres RLS cannot see the caller's IP, so a determined
-- client can insert as fast as the API allows. Doing this properly means
-- putting an Edge Function in front of the insert, where the request headers
-- are visible, and revoking the direct anon grant above. Until then the
-- guards are the CHECK constraints and the median in the view, which bound
-- how much damage a flood can do to what users see but not how many rows it
-- can create.
