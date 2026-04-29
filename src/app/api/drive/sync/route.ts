import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getDriveClient } from '@/lib/drive';
import { getCampaignColor } from '@/lib/color';
import { DEFAULT_VIDEO_STATUS } from '@/lib/const/default';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { rootFolderId } = body;
    if (!rootFolderId) return NextResponse.json({ error: 'rootFolderId required' }, { status: 400 });

    const { workspaceId } = auth;

    const configs = await prisma.config.findMany({ where: { workspaceId } });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    const accessToken = configMap['google_drive_access_token'];
    if (!accessToken) return NextResponse.json({ error: 'not connected' }, { status: 400 });

    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'google_drive_root_folder_id' } },
      create: { workspaceId, key: 'google_drive_root_folder_id', value: rootFolderId },
      update: { value: rootFolderId },
    });

    const drive = getDriveClient(accessToken, configMap['google_drive_refresh_token']);
    let campaignsCreated = 0;
    let videosCreated = 0;

    // Count existing campaigns to assign sequential colors from palette
    const existingCampaignCount = await prisma.campaign.count({ where: { workspaceId } });
    let colorIndex = existingCampaignCount;

    const rootContents = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and not name starts with '_'`,
      fields: 'files(id, name)',
      orderBy: 'name',
    });

    const rootFolders = rootContents.data.files || [];

    for (const folder of rootFolders) {
      if (folder.name?.toLowerCase() === 'exports') continue;

      const brandName = folder.name || 'Unnamed Campaign';

      // Prefer matching by brandName to avoid duplicates if campaign already exists
      let campaign = await prisma.campaign.findFirst({
        where: { brandName, workspaceId },
      });

      if (!campaign) {
        campaign = await prisma.campaign.create({
          data: {
            id: folder.id!,
            brandName,
            color: getCampaignColor(colorIndex),
            workspaceId,
            driveFolderId: folder.id!,
          },
        });
        campaignsCreated++;
        colorIndex++;
      } else {
        // Update driveFolderId if it changed
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { driveFolderId: folder.id! },
        });
      }

      const exportsFolder = await drive.files.list({
        q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and name='exports' and trashed=false`,
        fields: 'files(id, name)',
      });

      let videosFolderId = folder.id!;
      if (exportsFolder.data.files?.length) {
        videosFolderId = exportsFolder.data.files[0].id!;
      }

      const videoFiles = await drive.files.list({
        q: `'${videosFolderId}' in parents and not mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, createdTime, size, thumbnailLink, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      const files = videoFiles.data.files || [];
      for (const file of files) {
        const rawName = file.name || 'Untitled';
        const extMatch = rawName.match(/\.(mp4|mov|avi|mkv|webm|jpg|jpeg|png|gif)$/i);
        const extension = extMatch ? extMatch[1].toLowerCase() : null;
        const baseName = extMatch ? rawName.slice(0, rawName.length - extMatch[0].length) : rawName;

        type VideoMatch = { id: string; fileName?: string | null; name?: string | null; driveFileId?: string | null };
        // If a video already has this exact driveFileId, skip it entirely
        const alreadyLinked = await prisma.video.findFirst({
          where: { driveFileId: file.id!, workspaceId },
        });
        if (alreadyLinked) continue;

        // 1. Match by fileName — same raw name means same video
        let existingVideo: VideoMatch | null = await prisma.video.findFirst({
          where: { campaignId: campaign.id, fileName: rawName, workspaceId },
        });

        // 2. Fuzzy match — strip brand prefixes to find imported entries without drive metadata
        if (!existingVideo) {
          const rawBase = baseName.replace(/^(insforge|ugc engine)\s+/i, '').toLowerCase().trim();
          const candidates = await prisma.video.findMany({
            where: { campaignId: campaign.id, workspaceId },
            select: { id: true, fileName: true, name: true, driveFileId: true },
            orderBy: { createdAt: 'asc' },
          });

          for (const c of candidates as VideoMatch[]) {
            // Already linked to a different file — don't touch it
            if (c.driveFileId) continue;
            const storedBase = (c.fileName ?? c.name ?? '')
              .replace(/\.(mp4|mov|avi|mkv|webm|jpg|jpeg|png|gif)$/i, '')
              .replace(/^(insforge|ugc engine)\s+/i, '')
              .toLowerCase()
              .trim();
            if (rawBase === storedBase) { existingVideo = c; break; }
          }
        }

        if (existingVideo) {
          // Update drive metadata — preserve user-edited fields
          await prisma.video.update({
            where: { id: existingVideo.id },
            data: {
              driveFileId: file.id!,
              driveFolderId: videosFolderId,
              driveWebViewLink: (file as { webViewLink?: string }).webViewLink || null,
              thumbnailUrl: (file as { thumbnailLink?: string }).thumbnailLink || null,
              name: baseName, // sync the name from Drive
            },
          });
        } else {
          await prisma.video.create({
            data: {
              name: baseName,
              fileName: rawName,
              extension,
              platform: 'tiktok',
              status: DEFAULT_VIDEO_STATUS,
              workspaceId,
              campaignId: campaign.id,
              driveFileId: file.id!,
              driveFolderId: videosFolderId,
              driveWebViewLink: (file as { webViewLink?: string }).webViewLink || null,
              thumbnailUrl: (file as { thumbnailLink?: string }).thumbnailLink || null,
            },
          });
          videosCreated++;
        }
      }
    }

    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'google_drive_last_synced' } },
      create: { workspaceId, key: 'google_drive_last_synced', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, campaignsCreated, videosCreated, lastSynced: new Date().toISOString() });
  } catch (err) {
    console.error('Drive sync error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
