-- 009_site_settings_logo_url.sql
-- Agrega soporte de logo dinamico gestionable desde /admin

alter table if exists public.site_settings
add column if not exists logo_url text;
