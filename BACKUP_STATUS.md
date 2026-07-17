# Backup status

Checkpoint: first working persistent cloud-save build.

## Confirmed working

- Supabase requests return HTTP 200.
- Player wallet row is created in `public.player_progress`.
- XP, coins, and energy were confirmed in the database.
- Decentraland signed-request validation uses parcel `-77,139`.
- Signature validation uses `/functions/v1/player-progress`.

## GitHub source backup

The repository contains the editable SDK source, scene configuration, text-based scene data, database migration, Edge Function, and setup documentation.

Large generated media and GLB/PNG/JPG binary assets are listed in `BACKUP_MANIFEST.sha256`. Keep the downloadable full scene ZIP as the matching binary archive.
