# Google Drive Integration Plan

## Context

Users want to sync video data from Google Drive folder structure. App is **READ-ONLY** - files are uploaded manually directly to Drive, app only scans/reads.

**Folder structure:**
```
Root Folder (user selects)
├── /neo                    ← Campaign (1st layer folder)
│   └── /exports           ← Videos folder
│       ├── video1.mp4
│       └── video2.mp4
├── /insforge              ← Another campaign
│   └── /exports
└── ...
```

**Key requirement**: Video entries can exist WITHOUT a file (placeholder for planned videos).

---

## Decisions

1. **Status**: Separate enum, manually changed by user (not auto-derived from Drive)
2. **Sync**: Manual only - user clicks "Sync" button
3. **Data**: Manually created entries auto-linked to Drive when folder is created
4. **App is READ-ONLY**: Never writes/deletes Drive files

---

## Implementation

### 1. Database Changes

Add fields to `Campaign` and `Video` models:

```prisma
model Campaign {
  // ... existing fields
  driveFolderId  String?   // Google Drive folder ID
}

model Video {
  // ... existing fields
  driveFileId    String?   // Google Drive file ID
  driveFolderId  String?   // Parent folder ID
}
```

### 2. OAuth Flow (Read-Only)

**Scopes**: `https://www.googleapis.com/auth/drive.readonly`

**API Routes:**
- `GET /api/drive/connect` → Initiate OAuth (read-only)
- `GET /api/drive/callback` → Handle callback, store tokens
- `GET /api/drive/status` → Check connection status
- `GET /api/drive/files` → List files from root folder
- `POST /api/drive/sync` → Scan folders, create/update DB
- `DELETE /api/drive/disconnect` → Remove connection

**Storage** (Config table):
- `google_drive_access_token`
- `google_drive_refresh_token`
- `google_drive_root_folder_id`
- `google_drive_last_synced`

### 3. Sync Logic

```
1. List root folder contents
2. For each subfolder (not /exports):
   - Create/update Campaign with driveFolderId
3. For each campaign folder:
   - Look for /exports subfolder
   - List video files (mp4, mov, etc.)
   - Create/update Video entries with driveFileId
4. Existing DB videos without driveFileId = placeholder entries
```

**No write operations**: App never creates/updates/deletes Drive files.

### 4. UI

**Settings page** (`/settings`):
- "Google Drive" section
- Connect/Disconnect button
- Folder picker
- "Sync Now" button + last synced time

**Videos page** (`/videos`):
- "Sync from Drive" button
- Drive icon on Drive-linked videos
- "Add placeholder video" button

---

## Files

### Create:
- `/src/app/api/drive/connect/route.ts`
- `/src/app/api/drive/callback/route.ts`
- `/src/app/api/drive/status/route.ts`
- `/src/app/api/drive/files/route.ts`
- `/src/app/api/drive/sync/route.ts`
- `/src/app/api/drive/disconnect/route.ts`
- `/src/components/DriveConnect.tsx`

### Modify:
- `/prisma/schema.prisma` - Add driveFolderId, driveFileId
- `/src/app/(app)/settings/page.tsx` - Drive section
- `/src/app/(app)/videos/page.tsx` - Sync/placeholder features

### Dependencies:
- `npm install googleapis`

---

## Verification

1. Settings → Connect Google Drive → Authorize
2. Select root folder
3. See campaigns auto-created from folder names
4. See videos from /exports files
5. Add placeholder video (no file) → appears
6. Create new folder in Drive → Sync → new campaign appears
7. Placeholder videos persist across syncs
