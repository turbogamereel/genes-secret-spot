create table if not exists public.parkour_records (
  wallet_address text primary key,
  display_name text not null default '',
  best_time_ms integer check (best_time_ms is null or best_time_ms between 5000 and 1800000),
  best_time_at timestamptz,
  active_run_id uuid,
  active_run_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parkour_records_wallet_format check (wallet_address ~ '^0x[0-9a-f]{40}$'),
  constraint parkour_records_display_name_length check (char_length(display_name) <= 32)
);

alter table public.parkour_records enable row level security;

revoke all on table public.parkour_records from anon, authenticated;
grant all on table public.parkour_records to service_role;

create index if not exists parkour_records_fastest_idx
  on public.parkour_records (best_time_ms asc, best_time_at asc)
  where best_time_ms is not null;

comment on table public.parkour_records is
  'Server-timed parkour runs and each wallet''s fastest verified finish.';
