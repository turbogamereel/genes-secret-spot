# Gene's Secret Spot cloud-save setup

The scene is already configured for this Supabase project:

- Project reference: `lqsoatamutwszjgdfzco`
- Edge Function: `player-progress`

The publishable key is safe to include in the scene. Never place the service-role key or database password in the Decentraland project.

## 1. Create the database table

In Supabase, open **SQL Editor**, create a new query, paste the contents of:

`supabase/migrations/20260717000000_create_player_progress.sql`

Run it once.

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

The deployed function verifies Decentraland signed identity headers for parcel `-77,139` and the signed path `/functions/v1/player-progress`.

## 3. Test

1. Enter the scene with a wallet-connected Decentraland account.
2. Catch or sell a fish.
3. Wait a few seconds.
4. Leave and re-enter the scene.
5. Confirm level, XP, coins, energy, inventory, and completed sets reload.

Guest accounts can play but do not receive permanent cloud saves.
