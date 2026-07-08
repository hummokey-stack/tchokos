-- 1. Permissions System
create table public.permissions (
  code text primary key,
  description text not null
);

create table public.role_permissions (
  role text not null,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key (role, permission_code)
);

-- Seed basic permissions
insert into public.permissions (code, description) values
('manage_admins', 'Gérer les comptes administrateurs'),
('edit_catalog', 'Ajouter/Modifier/Supprimer des produits et catégories'),
('manage_orders', 'Visualiser et modifier le statut des commandes'),
('adjust_stock', 'Ajuster les stocks manuellement et voir l''historique'),
('edit_settings', 'Modifier les configurations du site et bannières')
on conflict (code) do nothing;

-- Seed role permissions association
insert into public.role_permissions (role, permission_code) values
('super_admin', 'manage_admins'),
('super_admin', 'edit_catalog'),
('super_admin', 'manage_orders'),
('super_admin', 'adjust_stock'),
('super_admin', 'edit_settings'),
('admin_produit', 'edit_catalog'),
('admin_commandes', 'manage_orders'),
('admin_stock', 'adjust_stock'),
('moderateur', 'edit_settings')
on conflict (role, permission_code) do nothing;

-- Update is_admin function to verify role exists
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role is not null
  );
end;
$$ language plpgsql security definer;

-- Add check permission helper
create or replace function public.has_permission(p_permission text)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = auth.uid() and rp.permission_code = p_permission
  );
end;
$$ language plpgsql security definer;


-- 2. Promotions System
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  banner_image_url text,
  created_at timestamptz default now()
);

create table public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

-- Policies for promotions
create policy "Anyone can view promotions" on public.promotions for select using (true);
create policy "Anyone can view promo products" on public.promotion_products for select using (true);
create policy "Admins can manage promotions" on public.promotions for all using (public.has_permission('edit_catalog'));
create policy "Admins can manage promo products" on public.promotion_products for all using (public.has_permission('edit_catalog'));


-- 3. External Sync Queue (Outbox Pattern)
create table public.external_sync_queue (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'success', 'failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

alter table public.external_sync_queue enable row level security;

-- Policies for sync queue
create policy "Admins with stock access can view sync queue" on public.external_sync_queue for select using (public.has_permission('adjust_stock'));
create policy "Admins with stock access can update sync queue" on public.external_sync_queue for update using (public.has_permission('adjust_stock'));
