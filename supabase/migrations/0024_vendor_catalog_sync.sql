-- Vendor catalog sync tables

-- Add sync fields to products
alter table products
  add column if not exists external_sku text,
  add column if not exists external_source_id uuid,
  add column if not exists external_payload jsonb,
  add column if not exists sync_hash text,
  add column if not exists last_synced_at timestamptz;

-- Unique index for upsert by vendor_id + external_sku
create unique index if not exists idx_products_vendor_external_sku
  on products (vendor_id, external_sku)
  where external_sku is not null;

-- Catalog sources
create table if not exists vendor_catalog_sources (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  type text not null check (type in ('url_feed','api','sftp','manual_file')),
  name text not null default '',
  is_active boolean not null default true,
  file_format text check (file_format in ('csv','xml','json','xlsx')),
  sync_mode text not null default 'full' check (sync_mode in ('full','delta')),
  schedule_cron text,
  timezone text default 'Europe/Moscow',
  -- URL feed
  feed_url text,
  feed_method text default 'GET',
  feed_headers jsonb default '{}',
  -- API
  api_base_url text,
  api_catalog_endpoint text,
  api_auth_type text check (api_auth_type in ('none','bearer','basic','api_key')),
  api_credentials jsonb default '{}',
  api_delta_endpoint text,
  api_updated_since_field text,
  -- SFTP
  sftp_host text,
  sftp_port int default 22,
  sftp_username text,
  sftp_credentials jsonb default '{}',
  sftp_path text,
  -- Settings
  mapping_preset text default 'auto',
  default_currency text default 'RUB',
  locale text default 'ru',
  auto_activate_products boolean default true,
  deactivate_missing_products boolean default false,
  -- Status
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_job_id uuid,
  last_error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vcs_vendor on vendor_catalog_sources(vendor_id);
create index if not exists idx_vcs_vendor_active on vendor_catalog_sources(vendor_id, is_active);

-- Field mappings
create table if not exists vendor_catalog_field_mappings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references vendor_catalog_sources(id) on delete cascade,
  source_field text not null,
  target_field text not null,
  transform_rule text,
  is_required boolean default false,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vcfm_source on vendor_catalog_field_mappings(source_id);

-- Sync jobs
create table if not exists vendor_catalog_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references vendor_catalog_sources(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','fetching','validating','processing','completed','partial','failed','cancelled')),
  mode text not null default 'live' check (mode in ('dry_run','live')),
  sync_mode text not null default 'full' check (sync_mode in ('full','delta')),
  idempotency_key text,
  trigger_type text default 'manual' check (trigger_type in ('manual','schedule','retry')),
  rows_total int default 0,
  rows_valid int default 0,
  rows_created int default 0,
  rows_updated int default 0,
  rows_skipped int default 0,
  rows_failed int default 0,
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_vcsj_vendor on vendor_catalog_sync_jobs(vendor_id, created_at desc);
create index if not exists idx_vcsj_source_status on vendor_catalog_sync_jobs(source_id, status);

-- Sync errors (row-level)
create table if not exists vendor_catalog_sync_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references vendor_catalog_sync_jobs(id) on delete cascade,
  vendor_id uuid not null,
  row_number int,
  sku text,
  field_name text,
  error_code text not null,
  error_message text not null,
  raw_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_vcse_job on vendor_catalog_sync_errors(job_id);

-- Sync logs
create table if not exists vendor_catalog_sync_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references vendor_catalog_sync_jobs(id) on delete cascade,
  vendor_id uuid not null,
  level text not null default 'info' check (level in ('info','warn','error')),
  message text not null,
  context_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_vcsl_job on vendor_catalog_sync_logs(job_id);

-- Enable RLS
alter table vendor_catalog_sources enable row level security;
alter table vendor_catalog_field_mappings enable row level security;
alter table vendor_catalog_sync_jobs enable row level security;
alter table vendor_catalog_sync_errors enable row level security;
alter table vendor_catalog_sync_logs enable row level security;

-- RLS policies: vendors can only access their own data
create policy vcs_vendor_select on vendor_catalog_sources for select using (vendor_id = (select id from vendors where user_id = auth.uid()));
create policy vcs_vendor_insert on vendor_catalog_sources for insert with check (vendor_id = (select id from vendors where user_id = auth.uid()));
create policy vcs_vendor_update on vendor_catalog_sources for update using (vendor_id = (select id from vendors where user_id = auth.uid()));

create policy vcsj_vendor_select on vendor_catalog_sync_jobs for select using (vendor_id = (select id from vendors where user_id = auth.uid()));
create policy vcsj_vendor_insert on vendor_catalog_sync_jobs for insert with check (vendor_id = (select id from vendors where user_id = auth.uid()));

create policy vcse_vendor_select on vendor_catalog_sync_errors for select using (vendor_id = (select id from vendors where user_id = auth.uid()));
create policy vcsl_vendor_select on vendor_catalog_sync_logs for select using (vendor_id = (select id from vendors where user_id = auth.uid()));
