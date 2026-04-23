import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

function getDriveClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rootFolderId } = body;

    if (!rootFolderId) {
      return NextResponse.json({ error: 'rootFolderId required' }, { status: 400 });
    }

    // Get user's workspace and Drive config
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'no workspace' }, { status: 404 });
    }

    const workspaceId = membership.workspaceId;
    const configs = await prisma.config.findMany({ where: { workspaceId } });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    const accessToken = configMap['google_drive_access_token'];
    if (!accessToken) {
      return NextResponse.json({ error: 'not connected' }, { status: 400 });
    }

    // Save root folder ID
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'google_drive_root_folder_id' } },
      create: { workspaceId, key: 'google_drive_root_folder_id', value: rootFolderId },
      update: { value: rootFolderId },
    });

    const drive = getDriveClient(accessToken, configMap['google_drive_refresh_token']);
    let campaignsCreated = 0;
    let videosCreated = 0;

    // Step 1: List root folder contents (campaigns are 1st level subfolders)
    const rootContents = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      orderBy: 'name',
    });

    const rootFolders = rootContents.data.files || [];

    // Step 2: For each campaign folder
    for (const folder of rootFolders) {
      // Skip if it's named "exports" (that's where videos live, not a campaign)
      if (folder.name?.toLowerCase() === 'exports') continue;

      // Create or update campaign
      const campaign = await prisma.campaign.upsert({
        where: { id: folder.id! },
        create: {
          id: folder.id!,
          brandName: folder.name || 'Unnamed Campaign',
          workspaceId,
          driveFolderId: folder.id!,
        },
        update: {
          brandName: folder.name || 'Unnamed Campaign',
          driveFolderId: folder.id!,
        },
      });

      if (campaign.id === folder.id) campaignsCreated++;

      // Step 3: Look for /exports subfolder
      const exportsFolder = await drive.files.list({
        q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and name='exports' and trashed=false`,
        fields: 'files(id, name)',
      });

      let videosFolderId = folder.id!;
      if (exportsFolder.data.files?.length) {
        videosFolderId = exportsFolder.data.files[0].id!;
      }

      // Step 4: List video files in videos folder
      const videoFiles = await drive.files.list({
        q: `'${videosFolderId}' in parents and not mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      const files = videoFiles.data.files || [];
      for (const file of files) {
        const title = file.name?.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '') || 'Untitled';

        await prisma.video.upsert({
          where: { id: file.id! },
          create: {
            id: file.id!,
            title,
            fileName: file.name || '',
            platform: 'tiktok',
            status: 'posted',
            workspaceId,
            campaignId: campaign.id,
            driveFileId: file.id!,
            driveFolderId: videosFolderId,
          },
          update: {
            title,
            fileName: file.name || '',
            driveFileId: file.id!,
            driveFolderId: videosFolderId,
            campaignId: campaign.id,
          },
        });

        videosCreated++;
      }
    }

    // Update last synced timestamp
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'google_drive_last_synced' } },
      create: { workspaceId, key: 'google_drive_last_synced', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      campaignsCreated,
      videosCreated,
      lastSynced: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Drive sync error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
