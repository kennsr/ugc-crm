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
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      orderBy: 'name',
    });

    const rootFolders = rootContents.data.files || [];

    for (const folder of rootFolders) {
      if (folder.name?.toLowerCase() === 'exports') continue;

      const campaign = await prisma.campaign.upsert({
        where: { id: folder.id! },
        create: {
          id: folder.id!,
          brandName: folder.name || 'Unnamed Campaign',
          color: getCampaignColor(colorIndex),
          workspaceId,
          driveFolderId: folder.id!,
        },
        update: { brandName: folder.name || 'Unnamed Campaign', driveFolderId: folder.id! },
      });
      if (campaign.id === folder.id) {
        campaignsCreated++;
        colorIndex++;
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

        await prisma.video.upsert({
          where: { id: file.id! },
          create: {
            id: file.id!,
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
            createdAt: new Date((file as { createdTime?: string }).createdTime || Date.now()),
          },
          update: {
            driveFileId: file.id!,
            driveFolderId: videosFolderId,
            driveWebViewLink: (file as { webViewLink?: string }).webViewLink || null,
            thumbnailUrl: (file as { thumbnailLink?: string }).thumbnailLink || null,
            campaignId: campaign.id,
          },
        });
        videosCreated++;
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
