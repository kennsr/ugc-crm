# Drive Sync

## How it works

Google Drive acts as the file source. Each top-level folder in the root sync folder = one campaign. Inside each campaign folder, videos live in the folder itself (not an `exports` subfolder).

On every sync:
1. Lists all top-level folders (skips folders starting with `_`)
2. For each campaign folder: finds or creates the campaign record
3. For each video file in the folder: matches it against existing DB records, then creates or links

## Priority rules (data takes precedence)

**Existing in DB with matching `fileName`**
→ Link to Drive file. Never touch the name, title, or any other field.

**Existing in DB without `driveFileId` (fuzzy name match)**
→ Link to Drive file. Never touch the name, title, or any other field.
Fuzzy matching strips brand prefixes (`insforge `, `ugc engine `) to handle files renamed by Insforge.

**In Drive but not in DB**
→ Create a new video record with `status: backlog`.

**In DB but not in Drive**
→ Left alone. Not deleted or modified.

## Drive file requirements

- Files must be video formats: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`
- Image formats (`.jpg`, `.jpeg`, `.png`, `.gif`) are also synced
- Files inside nested subfolders are not synced — only files directly in the campaign folder

## Skipped folders

Folders starting with `_` are ignored during sync (e.g. `_ugc_backup`). Use these for non-campaign storage.

## Status workflow

```
backlog → shooting → editing → link_required → posted
       → revision (from link_required or posted)
       → not_accepted
```

- **Link Required** — creator must submit the video link
- **Posted** — sets `uploadedAt` to today's date automatically
- **Not Accepted** — creator was not paid

## Drive folder structure

```
Root Sync Folder/
├── _ugc_backup/          ← ignored by sync, used for DB backups
├── CampaignName/         ← each campaign
│   ├── video1.mp4
│   ├── video2.mov
│   └── exports/           ← ignored (for Insforge exports)
└── AnotherCampaign/
    └── ...
```
