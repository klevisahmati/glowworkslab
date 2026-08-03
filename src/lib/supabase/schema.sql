create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_id text unique not null,
  full_name text not null,
  email text unique not null,
  phone text,
  address text,
  loyalty_tier text not null default 'standard',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text unique not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  vin text unique,
  plate text unique,
  purchase_date date,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_id text unique not null,
  name text not null,
  category text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_days int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installations (
  id uuid primary key default gen_random_uuid(),
  installation_id text unique not null,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  installed_at timestamptz not null default now(),
  technician text,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  warranty_id text unique not null,
  installation_id uuid not null references public.installations(id) on delete cascade,
  coverage_type text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active',
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  gallery_id text unique not null,
  title text not null,
  description text,
  image_url text,
  category text not null default 'project',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  discount_id text unique not null,
  code text unique not null,
  description text,
  percentage numeric(5,2) not null default 0,
  valid_from date not null,
  valid_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_id text unique not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  appointment_date timestamptz not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  admin_id text unique not null,
  full_name text not null,
  email text unique not null,
  role text not null default 'manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_customer_id on public.vehicles(customer_id);
create index if not exists idx_installations_vehicle_id on public.installations(vehicle_id);
create index if not exists idx_installations_service_id on public.installations(service_id);
create index if not exists idx_warranties_installation_id on public.warranties(installation_id);
create index if not exists idx_appointments_customer_id on public.appointments(customer_id);
create index if not exists idx_appointments_vehicle_id on public.appointments(vehicle_id);
create index if not exists idx_gallery_featured on public.gallery(is_featured);
create index if not exists idx_discounts_active on public.discounts(is_active);

alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.services enable row level security;
alter table public.installations enable row level security;
alter table public.warranties enable row level security;
alter table public.gallery enable row level security;
alter table public.discounts enable row level security;
alter table public.appointments enable row level security;
alter table public.admins enable row level security;

create policy if not exists "Allow public read access to services" on public.services
  for select using (true);

create policy if not exists "Allow public read access to gallery" on public.gallery
  for select using (true);

create policy if not exists "Allow public read access to discounts" on public.discounts
  for select using (true);

create policy if not exists "Allow authenticated users to manage their own data" on public.customers
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy if not exists "Allow authenticated users to manage their own vehicles" on public.vehicles
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy if not exists "Allow authenticated users to manage their own appointments" on public.appointments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy if not exists "Allow authenticated users to manage their own installations" on public.installations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy if not exists "Allow authenticated users to manage their own warranties" on public.warranties
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
