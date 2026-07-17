# Gene's Secret Spot cloud-save setup

The scene is already configured for this Supabase project:

- Project reference: `lqsoatamutwszjgdfzco`
- Edge Function: `player-progress`

The publishable key is safe to include in the scene. Never place the service-role key or database password in the Decentraland project.

## 1. Create the database table

In Supabase, open **SQL Editor**, create a new query, paste the contents of:

`supabase/migrations/20260717000000_create_player_progress.sql`

Run it once.

For the level leaderboard, also paste and run:

`supabase/migrations/20260717010000_add_level_leaderboard.sql`

Then run the Daily Challenge migration:

`supabase/migrations/20260717020000_add_daily_challenge.sql`

Then run the parkour leaderboard migration:

`supabase/migrations/20260717030000_add_parkour_leaderboard.sql`

## 2. Deploy the Edge Function

The function source is located at:

`supabase/functions/player-progress/index.ts`

Using the Supabase CLI from this project folder:

```bash
npx supabase login
npx supabase link --project-ref lqsoatamutwszjgdfzco
npx supabase functions deploy player-progress --no-verify-jwt
```

Supabase automatically supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions. Do not add either value to the scene code or GitHub repository.

## 3. Test

1. Enter the scene with a wallet-connected Decentraland account.
2. Catch or sell a fish.
3. Wait a few seconds.
4. Leave and re-enter the scene.
5. Confirm level, XP, coins, energy, inventory, and completed sets reload.
6. Open the level leaderboard and confirm the saved player appears.
7. Start and finish the parkour and confirm the personal best and fastest-time leaderboard update.

Guest accounts can play but do not receive permanent cloud saves.

## Daily Challenge

The More menu includes a rotating Daily Challenge. One challenge is active for all players each UTC day:

- Catch 5 fish
- Sell 3 fish
- Convert 2 fish to XP

Rewards can be claimed once per wallet per UTC day. The scene stores progress in the `daily_challenge` JSON column and resets it automatically when the UTC date changes.

## Parkour

The timer begins from the `PARKOUR_START` Trigger Area and ends at `PARKOUR_FINISH` or the currently supported `PARKOUr_FINISH` spelling. During a run, the scene enters focus mode and shows only the timer and End Run control.
