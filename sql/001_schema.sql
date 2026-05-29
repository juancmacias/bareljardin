-- 001_schema.sql
-- Estructura principal para contenido de Bar Jardin en Supabase

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  logo_url text,
  address_line_1 text not null,
  address_line_2 text,
  phone text not null,
  maps_link text,
  maps_embed_url text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  route_label text not null,
  href text not null,
  image_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_label text not null,
  hours_text text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

create trigger trg_menu_cards_updated_at
before update on public.menu_cards
for each row
execute function public.set_updated_at();

create trigger trg_testimonials_updated_at
before update on public.testimonials
for each row
execute function public.set_updated_at();

create trigger trg_business_hours_updated_at
before update on public.business_hours
for each row
execute function public.set_updated_at();

create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();
