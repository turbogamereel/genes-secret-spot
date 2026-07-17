# Gene's Secret Spot

Decentraland SDK7 fishing and event-hangout scene.

## Stable checkpoint

This source backup matches the first confirmed working cloud-save deployment on July 16, 2026.

- Live parcel: `-77,139`
- Supabase Edge Function: `player-progress`
- Signed request path: `/functions/v1/player-progress`
- Saved data: level, XP, coins, energy, inventory, collections, and completed sets
- Wallet-based saves verified with Decentraland signed identity headers

## Run locally

```bash
npm install
npm run start
```

## Production build

```bash
npm run build
```

See `CLOUD_SAVE_SETUP.md` and `SUPABASE_SETUP.md` for backend setup details.
