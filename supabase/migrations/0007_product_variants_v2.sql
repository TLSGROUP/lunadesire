-- Migration 0007: Per-product variant fields and group key for sibling linking

alter table public.products
  add column if not exists variant_color      text,          -- e.g. "VIOLETA"
  add column if not exists variant_color_code text,          -- e.g. "VIOLET"
  add column if not exists variant_size       text,          -- e.g. "M"
  add column if not exists variant_size_code  text,          -- e.g. "M"
  add column if not exists product_group_key  text;          -- normalized name used to group siblings

-- Drop old broad jsonb columns that were incorrectly storing global option lists
alter table public.products
  drop column if exists colors,
  drop column if exists sizes;

create index if not exists products_group_key_idx on public.products(product_group_key)
  where product_group_key is not null;
