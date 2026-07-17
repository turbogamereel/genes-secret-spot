alter table public.player_progress
  add column if not exists daily_challenge jsonb not null
  default '{"date":"","progress":0,"claimed":false}'::jsonb;

comment on column public.player_progress.daily_challenge is
  'Current UTC daily challenge progress and claimed status for the wallet.';
