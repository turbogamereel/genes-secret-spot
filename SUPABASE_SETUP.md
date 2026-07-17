# Supabase cloud save setup

The scene is already configured for this project:

- Project ref: `lqsoatamutwszjgdfzco`
- Edge Function: `player-progress`
- Player table: `public.player_progress`
- Parkour table: `public.parkour_records`

## One-time dashboard setup

Run these migrations in order:

1. `supabase/migrations/20260717000000_create_player_progress.sql`
2. `supabase/migrations/20260717010000_add_level_leaderboard.sql`
3. `supabase/migrations/20260717020000_add_daily_challenge.sql`
4. `supabase/migrations/20260717030000_add_parkour_leaderboard.sql`

## Deploy the Edge Function

Open **Edge Functions → player-progress → Code** and replace `index.ts` with:

`supabase/functions/player-progress/index.ts`

Keep **Verify JWT with legacy secret** off. Decentraland Signed Fetch is verified inside the function instead.

## What gets saved

Wallet-connected players automatically save:

- Level and XP
- Coins
- Energy and regeneration timestamp
- Fish, materials and junk inventory
- Completed material sets
- Completed fish sets
- Daily Challenge date, progress, and claimed reward status
- Parkour active attempt state and fastest verified finish

Guest players are not given permanent saves because their guest identity is not stable between visits.

## Security model

The scene calls the Edge Function with Decentraland `signedFetch`. The function verifies the player authentication chain, accepts the scene parcel `-77,139`, and verifies the exact signed path `/functions/v1/player-progress`. The database tables are not exposed to the public Supabase Data API.

## Leaderboards

The Edge Function returns:

- Top 10 players by level, then current XP
- Top 10 parkour times ordered from fastest to slowest

Player display names are saved with progress; blank names fall back to shortened wallet addresses in the UI.
