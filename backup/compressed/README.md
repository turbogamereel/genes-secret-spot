# Compressed source backup

GitHub's connector cannot directly upload the local binary archive, so two large editable text files are stored here as gzip-compressed base64 parts:

- `src/ui.tsx`
- `assets/scene/main.composite`

Restore both files from the repository root with:

```bash
python scripts/restore-compressed-backup.py
```

The matching full scene ZIP remains the authoritative archive for GLB, PNG, JPG, CRDT, and other binary assets. Use `BACKUP_MANIFEST.sha256` to verify restored or copied files.
