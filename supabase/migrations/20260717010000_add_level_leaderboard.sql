alter table public.player_progress
  add column if not exists display_name text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_progress_display_name_length'
      and conrelid = 'public.player_progress'::regclass
  ) then
    alter table public.player_progress
      add constraint player_progress_display_name_length
      check (char_length(display_name) <= 32);
  end if;
end $$;

create index if not exists player_progress_leaderboard_idx
  on public.player_progress (level desc, current_xp desc, updated_at asc);
