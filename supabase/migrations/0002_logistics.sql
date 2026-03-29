-- ============================================================
-- Migration 0002: Logistics, pricing, profit tracking
-- Run in Supabase SQL editor
-- ============================================================

-- ============================================================
-- 1. Products — add price fields from DreamLove catalog
-- ============================================================
alter table public.products
  add column if not exists price_ex_vat     numeric(10,2) not null default 0,
  add column if not exists price_with_vat   numeric(10,2) not null default 0,
  add column if not exists supplier_shipping numeric(10,2) not null default 0;

-- supplier_price now = price_with_vat (worst-case cost, used for retail price calc)
-- price_ex_vat kept for profit calc on non-EU orders

-- ============================================================
-- 2. Shipping methods — synced from DreamLove getLogisticsFiles
-- ============================================================
create table if not exists public.shipping_methods (
  id            uuid primary key default uuid_generate_v4(),
  dl_code       text unique not null,   -- DreamLove rate code e.g. '0144'
  description   text not null,          -- e.g. 'NACEX 24H Spain'
  dl_price      numeric(10,2) not null default 0,  -- what DreamLove charges us
  free_from     numeric(10,2),          -- free shipping threshold (gratis_desde)
  is_active     boolean not null default true,
  synced_at     timestamptz default now()
);

-- ============================================================
-- 3. Countries — EU flag for profit calculation
-- ============================================================
create table if not exists public.countries (
  code    text primary key,   -- ISO alpha-2 e.g. 'DE', 'US'
  name    text not null,
  is_eu   boolean not null default false
);

-- Seed EU countries (ISO alpha-2)
insert into public.countries (code, name, is_eu) values
  ('AT', 'Austria',        true),
  ('BE', 'Belgium',        true),
  ('BG', 'Bulgaria',       true),
  ('CY', 'Cyprus',         true),
  ('CZ', 'Czech Republic', true),
  ('DE', 'Germany',        true),
  ('DK', 'Denmark',        true),
  ('EE', 'Estonia',        true),
  ('ES', 'Spain',          true),
  ('FI', 'Finland',        true),
  ('FR', 'France',         true),
  ('GR', 'Greece',         true),
  ('HR', 'Croatia',        true),
  ('HU', 'Hungary',        true),
  ('IE', 'Ireland',        true),
  ('IT', 'Italy',          true),
  ('LT', 'Lithuania',      true),
  ('LU', 'Luxembourg',     true),
  ('LV', 'Latvia',         true),
  ('MT', 'Malta',          true),
  ('NL', 'Netherlands',    true),
  ('PL', 'Poland',         true),
  ('PT', 'Portugal',       true),
  ('RO', 'Romania',        true),
  ('SE', 'Sweden',         true),
  ('SI', 'Slovenia',       true),
  ('SK', 'Slovakia',       true),
  -- Non-EU common destinations
  ('US', 'United States',  false),
  ('GB', 'United Kingdom', false),
  ('CA', 'Canada',         false),
  ('AU', 'Australia',      false),
  ('CH', 'Switzerland',    false),
  ('NO', 'Norway',         false),
  ('JP', 'Japan',          false),
  ('MX', 'Mexico',         false),
  ('BR', 'Brazil',         false),
  ('UA', 'Ukraine',        false),
  ('RU', 'Russia',         false)
on conflict (code) do nothing;

-- ============================================================
-- 4. Orders — add profit tracking and shipping method
-- ============================================================
alter table public.orders
  add column if not exists shipping_method_code text,   -- DreamLove dl_code
  add column if not exists supplier_cost numeric(10,2), -- what we pay DreamLove
  add column if not exists profit       numeric(10,2),  -- total - supplier_cost
  add column if not exists is_eu_order  boolean;        -- EU/non-EU flag at time of order

-- ============================================================
-- 5. Order items — track per-item cost basis
-- ============================================================
alter table public.order_items
  add column if not exists price_ex_vat   numeric(10,2),
  add column if not exists price_with_vat numeric(10,2);

-- ============================================================
-- 6. RLS for new tables
-- ============================================================
alter table public.shipping_methods enable row level security;
create policy "Anyone can view shipping methods"
  on public.shipping_methods for select using (true);
create policy "Admins manage shipping methods"
  on public.shipping_methods for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

alter table public.countries enable row level security;
create policy "Anyone can view countries"
  on public.countries for select using (true);
create policy "Admins manage countries"
  on public.countries for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 7. sync_logs — add 'logistics' type
-- ============================================================
alter table public.sync_logs
  drop constraint if exists sync_logs_type_check;
alter table public.sync_logs
  add constraint sync_logs_type_check
    check (type in ('catalog','prices','brands','categories','logistics','full'));
