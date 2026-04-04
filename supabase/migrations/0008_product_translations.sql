-- Migration 0008: Product translations for i18n (8 languages from DreamLove)

create table if not exists public.product_translations (
  id             uuid primary key default uuid_generate_v4(),
  product_id     uuid references public.products(id) on delete cascade not null,
  locale         text not null,  -- e.g. 'en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'nl'
  name           text,
  description    text,
  long_description text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(product_id, locale)
);

create index if not exists product_translations_product_id_idx on public.product_translations(product_id);
create index if not exists product_translations_locale_idx on public.product_translations(locale);

-- RLS
alter table public.product_translations enable row level security;

create policy "Anyone can view product translations"
  on public.product_translations for select using (true);

create policy "Admins can manage product translations"
  on public.product_translations for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
