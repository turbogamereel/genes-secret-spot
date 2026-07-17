# Gene's Secret Spot

Decentraland SDK7 fishing, social-event and parkour scene.

## Latest working checkpoint

This backup branch tracks the build with:

- Supabase wallet-based cloud saves
- Top 10 level leaderboard
- Daily challenges
- Smart-item parkour start and finish triggers
- Fastest-time parkour leaderboard
- End Run control
- Parkour focus mode that leaves only the timer visible
- Updated Gene's Secret Spot thumbnail

Scene base parcel: `-77,139`.

## Backed up here

The repository contains the current scene configuration, fishing entry logic, smart-trigger parkour logic, Supabase Edge Function, SQL migrations and setup documentation.

The complete Builder-ready ZIP contains the large UI source, scene composite and binary GLB/image assets. Its exact SHA-256 is recorded in `BACKUP_MANIFEST.md` so the matching archive can be verified.

## Supabase

The active Edge Function is:

```text
supabase/functions/player-progress/index.ts
```

Keep **Verify JWT with legacy secret** switched off. Decentraland `signedFetch` verification is performed inside the function.
