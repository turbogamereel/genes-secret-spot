# Supabase cloud save setup

The scene is already configured for this project:

- Project ref: `lqsoatamutwszjgdfzco`
- Edge Function: `player-progress`
- Table: `public.player_progress`

## One-time dashboard setup

### 1. Create the database table

Open **Supabase Dashboard → SQL Editor → New query**.

Paste and run:

`supabase/migrations/20260717000000_create_player_progress.sql`

### 2. Deploy the Edge Function

Open **Edge Functions → Deploy a new function → Via Editor**.

Name it exactly:

`player-progress`

Paste the contents of:

`supabase/functions/player-progress/index.ts`

Turn **Verify JWT with legacy secret** off for this function. Decentraland Signed Fetch is verified inside the function instead.

Deploy the function.

## What gets saved

Wallet-connected players automatically save:

- Level and XP
- Coins
- Energy and regeneration timestamp
- Fish, materials and junk inventory
- Completed material sets
- Completed fish sets

Guest players are not given permanent saves because their guest identity is not stable between visits.

## Security model

The scene calls the Edge Function with Decentraland `signedFetch`. The function verifies the player authentication chain and only accepts requests signed from the scene at parcel `-77,139`. Signature verification uses the public path `/functions/v1/player-progress`. The database table is not exposed to the public Supabase Data API.
