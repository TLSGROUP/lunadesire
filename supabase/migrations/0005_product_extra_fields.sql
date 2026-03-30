-- Migration 0005: Extra product fields from DreamLove catalog

alter table public.products
  add column if not exists public_id          text,         -- e.g. 'D-196690' (SKU)
  add column if not exists updated_at_supplier timestamptz, -- last modified at DreamLove
  add column if not exists release_date        date,
  add column if not exists min_units           integer not null default 1,
  add column if not exists max_units           integer not null default 999,
  add column if not exists vat_pct             numeric(5,2),
  add column if not exists is_sale             boolean not null default false,
  add column if not exists is_new              boolean not null default false,
  add column if not exists is_refrigerated     boolean not null default false,
  add column if not exists width_mm            integer,
  add column if not exists height_mm           integer,
  add column if not exists depth_mm            integer,
  add column if not exists hs_intrastat_code   text;

create index if not exists products_public_id_idx on public.products(public_id);
create index if not exists products_is_sale_idx   on public.products(is_sale);
create index if not exists products_is_new_idx    on public.products(is_new);
