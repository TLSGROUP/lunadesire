-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ADDRESSES
-- ============================================================
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text,
  street text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'US',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  parent_id uuid references public.categories(id),
  dreamlove_id text unique,
  created_at timestamptz default now()
);

-- ============================================================
-- BRANDS
-- ============================================================
create table public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  dreamlove_id text unique,
  created_at timestamptz default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  dreamlove_id text unique not null,
  ean text,
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  brand text,
  supplier_price numeric(10,2) not null default 0,
  retail_price numeric(10,2) not null default 0,
  markup_pct numeric(5,2) not null default 40,
  stock_quantity integer not null default 0,
  stock_last_checked_at timestamptz,
  images jsonb default '[]'::jsonb,
  attributes jsonb default '{}'::jsonb,
  is_active boolean default true,
  is_adult boolean default true,
  weight_grams integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
create table public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  dreamlove_variant_id text,
  name text not null,
  sku text,
  stock_quantity integer default 0,
  price_adjustment numeric(10,2) default 0,
  attributes jsonb default '{}'::jsonb
);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  dreamlove_order_id text,
  dreamlove_status text,
  shipping_address jsonb not null,
  billing_address jsonb,
  subtotal numeric(10,2) not null,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'EUR',
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  payment_provider text,
  payment_reference text,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  variant_id uuid references public.product_variants(id),
  dreamlove_id text not null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  supplier_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

-- ============================================================
-- CART (server-side, tied to user session)
-- ============================================================
create table public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id, variant_id)
);

-- ============================================================
-- SYNC LOGS
-- ============================================================
create table public.sync_logs (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('catalog','prices','brands','categories','full')),
  status text not null check (status in ('running','success','error')),
  products_synced integer default 0,
  products_updated integer default 0,
  products_deactivated integer default 0,
  error_message text,
  raw_response text,           -- store raw data snippet for debugging
  started_at timestamptz default now(),
  finished_at timestamptz
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
-- NOTE: no "Admins can view all profiles" policy — it causes infinite recursion.
-- Admin reads use the service role key which bypasses RLS entirely.

alter table public.addresses enable row level security;
create policy "Users manage own addresses"
  on public.addresses for all using (auth.uid() = user_id);

alter table public.categories enable row level security;
create policy "Anyone can view categories"
  on public.categories for select using (true);
create policy "Admins can manage categories"
  on public.categories for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.brands enable row level security;
create policy "Anyone can view brands"
  on public.brands for select using (true);
create policy "Admins can manage brands"
  on public.brands for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.products enable row level security;
create policy "Anyone can view active products"
  on public.products for select using (is_active = true);
create policy "Admins can manage products"
  on public.products for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.product_variants enable row level security;
create policy "Anyone can view product variants"
  on public.product_variants for select using (true);
create policy "Admins can manage product variants"
  on public.product_variants for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.orders enable row level security;
create policy "Users view own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Users create own orders"
  on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins manage all orders"
  on public.orders for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.order_items enable row level security;
create policy "Users view own order items"
  on public.order_items for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins manage order items"
  on public.order_items for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter table public.cart_items enable row level security;
create policy "Users manage own cart"
  on public.cart_items for all using (auth.uid() = user_id);

alter table public.sync_logs enable row level security;
create policy "Admins view sync logs"
  on public.sync_logs for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calculate retail price from supplier price
create or replace function public.calculate_retail_price(supplier_price numeric, markup_pct numeric)
returns numeric language sql immutable as $$
  select round(supplier_price * (1 + markup_pct / 100), 2);
$$;

-- Updated_at auto-update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- INDEXES (performance)
-- ============================================================
create index products_dreamlove_id_idx on public.products(dreamlove_id);
create index products_slug_idx on public.products(slug);
create index products_category_id_idx on public.products(category_id);
create index products_is_active_idx on public.products(is_active);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index cart_items_user_id_idx on public.cart_items(user_id);
create index sync_logs_started_at_idx on public.sync_logs(started_at desc);
