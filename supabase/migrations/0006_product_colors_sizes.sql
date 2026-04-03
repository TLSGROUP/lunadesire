-- Migration 0006: Product colors and sizes from DreamLove option/size groups

alter table public.products
  add column if not exists colors jsonb default '[]'::jsonb,
  add column if not exists sizes  jsonb default '[]'::jsonb;

comment on column public.products.colors is
  'Array of {id, name, code} objects from DreamLove product_options';
comment on column public.products.sizes is
  'Array of {id, name, code} objects from DreamLove product_sizes';
