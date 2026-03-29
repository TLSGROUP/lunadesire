-- Migration 0003: add countries_csv to shipping_methods
alter table public.shipping_methods
  add column if not exists countries_csv text;  -- e.g. 'ESP,PRT,FRA'
