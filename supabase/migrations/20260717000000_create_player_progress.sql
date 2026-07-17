create table if not exists public.player_progress (
  wallet_address text primary key,
  state_version integer not null default 1,
  level integer not null default 1 check (level between 1 and 100),
  current_xp bigint not null default 0 check (current_xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  current_energy integer not null default 10 check (current_energy >= 0),
  last_energy_update_ms bigint not null default 0 check (last_energy_update_ms >= 0),
  inventory jsonb not null default '{"fish":{},"materials":{},"junk":{}}'::jsonb,
  material_sets jsonb not null default '{}'::jsonb,
  fish_sets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_progress_wallet_format check (wallet_address ~ '^0x[0-9a-f]{40}$')
);

alter table public.player_progress enable row level security;

-- The public Data API cannot read or write player progress directly.
-- The verified Edge Function uses the server-side service role instead.
revoke all on table public.player_progress from anon, authenticated;
grant all on table public.player_progress to service_role;

create index if not exists player_progress_level_idx
  on public.player_progress (level desc, current_xp desc);
