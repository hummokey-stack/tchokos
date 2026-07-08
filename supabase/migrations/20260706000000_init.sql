-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text check (role in ('super_admin', 'admin_produit', 'admin_commandes', 'admin_stock', 'moderateur')),
  created_at timestamptz default now()
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 2. Categories Table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  family text not null check (family in ('revendu', 'chaussure_locale', 'sac_local')),
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

-- 3. Products Table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  price_retail numeric(10, 2) not null check (price_retail >= 0),
  price_wholesale numeric(10, 2) not null check (price_wholesale >= 0),
  min_wholesale_qty integer not null default 12 check (min_wholesale_qty > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'out_of_stock')),
  is_new boolean not null default false,
  is_featured boolean not null default false,
  main_image_url text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

-- 4. Product Variants Table
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  created_at timestamptz default now()
);

alter table public.product_variants enable row level security;

-- 5. Orders Table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  order_type text not null check (order_type in ('detail', 'gros', 'devis')),
  fulfillment text not null check (fulfillment in ('retrait_magasin', 'livraison')),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

-- 6. Order Items Table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0)
);

alter table public.order_items enable row level security;

-- 7. Stock Movements Table
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment')),
  quantity integer not null check (quantity <> 0),
  reason text not null,
  created_at timestamptz default now()
);

alter table public.stock_movements enable row level security;

-- 8. Settings Table
create table public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz default now()
);

alter table public.settings enable row level security;


-- ==================== RLS Policies & Roles Helpers ====================

-- Check if user has one of the specified roles
create or replace function public.has_role(required_roles text[])
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(required_roles)
  );
end;
$$ language plpgsql security definer;

-- Check if user is an admin of any kind
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role is not null
  );
end;
$$ language plpgsql security definer;


-- Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and (role is null or role = (select role from public.profiles where id = auth.uid())));

create policy "Super admin can manage all profiles"
  on public.profiles for all
  using (public.has_role(array['super_admin']));


-- Categories Policies
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admins with product role can manage categories"
  on public.categories for all
  using (public.has_role(array['super_admin', 'admin_produit']));


-- Products Policies
create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Admins with product role can manage products"
  on public.products for all
  using (public.has_role(array['super_admin', 'admin_produit']));


-- Product Variants Policies
create policy "Anyone can view product variants"
  on public.product_variants for select
  using (true);

create policy "Admins with product or stock role can manage product variants"
  on public.product_variants for all
  using (public.has_role(array['super_admin', 'admin_produit', 'admin_stock']));


-- Orders Policies
create policy "Anyone can insert orders"
  on public.orders for insert
  with check (true);

create policy "Admins with order role can view orders"
  on public.orders for select
  using (public.has_role(array['super_admin', 'admin_commandes', 'admin_stock']));

create policy "Admins with order role can update orders"
  on public.orders for update
  using (public.has_role(array['super_admin', 'admin_commandes']))
  with check (public.has_role(array['super_admin', 'admin_commandes']));


-- Order Items Policies
create policy "Anyone can insert order items"
  on public.order_items for insert
  with check (true);

create policy "Admins with order role can view order items"
  on public.order_items for select
  using (public.has_role(array['super_admin', 'admin_commandes', 'admin_stock']));

create policy "Admins with order role can update order items"
  on public.order_items for update
  using (public.has_role(array['super_admin', 'admin_commandes']))
  with check (public.has_role(array['super_admin', 'admin_commandes']));


-- Stock Movements Policies
create policy "Admins with stock role can view stock movements"
  on public.stock_movements for select
  using (public.has_role(array['super_admin', 'admin_stock', 'admin_commandes']));

create policy "Admins with stock role can insert stock movements"
  on public.stock_movements for insert
  with check (public.has_role(array['super_admin', 'admin_stock']));


-- Settings Policies
create policy "Anyone can view settings"
  on public.settings for select
  using (true);

create policy "Super admin or moderators can manage settings"
  on public.settings for all
  using (public.has_role(array['super_admin', 'moderateur']));


-- ==================== Triggers & Functions ====================

-- Trigger to create profile after insert on auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Nouvel Administrateur'),
    case 
      when (select count(*) from public.profiles) = 0 then 'super_admin'::text -- first user becomes super_admin
      else (new.raw_user_meta_data->>'role')
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
