-- Vendor Directory
-- DO NOT RUN AUTOMATICALLY — provide to user for manual Supabase dashboard execution

create type vendor_category as enum (
  'photographer',
  'videographer',
  'dj',
  'live_band',
  'mehendi_artist',
  'makeup_hair',
  'decorator_florist',
  'wedding_planner',
  'catering',
  'designer'
);

create type vendor_source as enum (
  'google_places',
  'yelp',
  'self_submitted',
  'manual_curated'
);

create table vendor_directory (
  id                  uuid primary key default gen_random_uuid(),
  city                text not null,
  country_code        text not null,         -- ISO 3166-1 alpha-2 e.g. 'IN', 'TH', 'ID'
  category            vendor_category not null,
  name                text not null,
  description         text,                  -- AI-generated summary
  website             text,
  phone               text,
  email               text,
  instagram_handle    text,
  price_range_min     int,                   -- USD
  price_range_max     int,                   -- USD
  currency            text not null default 'USD',
  rating              numeric(3,2),          -- 0.00–5.00
  review_count        int,
  portfolio_urls      text[] default '{}',
  specialties         text[] default '{}',   -- e.g. ['NRI weddings', 'candid', 'destination']
  languages           text[] default '{}',   -- e.g. ['English', 'Hindi']
  has_nri_experience  boolean default false,
  source              vendor_source not null default 'manual_curated',
  source_id           text,                  -- Google Place ID or Yelp biz ID for dedup + refresh
  is_claimed          boolean default false, -- vendor has registered + confirmed their listing
  is_verified         boolean default false, -- Phera team has manually verified
  is_active           boolean default true,
  last_verified_at    timestamptz,
  enriched_at         timestamptz,           -- when AI enrichment last ran
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Dedup: one record per source_id
create unique index vendor_directory_source_id_idx
  on vendor_directory (source, source_id)
  where source_id is not null;

create index vendor_directory_city_category_idx on vendor_directory (city, category);
create index vendor_directory_country_category_idx on vendor_directory (country_code, category);
create index vendor_directory_active_idx on vendor_directory (is_active) where is_active = true;

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vendor_directory_updated_at
  before update on vendor_directory
  for each row execute function set_updated_at();

-- RLS: public read (vendor info is public), no direct writes from client
alter table vendor_directory enable row level security;

create policy "vendor_directory_public_read"
  on vendor_directory for select
  using (is_active = true);

-- Service role can do everything (used by ingestion scripts + API routes with service key)
