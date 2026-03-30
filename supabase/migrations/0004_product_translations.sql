-- Migration 0004: Product translations
-- Stores multilingual title/description from DreamLove <internationalization> section

create table if not exists public.product_translations (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references public.products(id) on delete cascade not null,
  lang        text not null,  -- e.g. 'en-UK', 'es-ES', 'de-DE'
  title       text,
  description text,
  html_description text,
  unique(product_id, lang)
);

alter table public.product_translations enable row level security;

create policy "Anyone can view translations"
  on public.product_translations for select using (true);

create policy "Admins manage translations"
  on public.product_translations for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Index for fast lookup by product + lang
create index if not exists product_translations_product_lang_idx
  on public.product_translations(product_id, lang);
