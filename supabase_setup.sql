-- Supabase SQL pour Coin Précieux
-- 1) Créer la table products

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  price integer,
  image_urls jsonb default '[]'::jsonb,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Activer le Row Level Security

alter table public.products enable row level security;

-- 3) Policy pour autoriser toute personne à lire les produits disponibles

create policy "public_can_select_available_products"
  on public.products
  for select
  using (available = true);

-- 4) Policy pour autoriser toute personne à insérer des produits (page admin locale sans connexion)

create policy "public_can_insert_products"
  on public.products
  for insert
  with check (true);

-- 5) Policy pour autoriser toute personne a mettre a jour/supprimer les produits (page admin locale sans connexion)

create policy "public_can_update_products"
  on public.products
  for update
  with check (true);

create policy "public_can_delete_products"
  on public.products
  for delete
  using (true);

-- 6) Donner les permissions au role anon pour gerer la table products

grant select, insert, update, delete on public.products to anon;
