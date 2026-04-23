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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || 'root';

    // Get user's workspace and Drive config
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'no workspace' }, { status: 404 });
    }

    const workspaceId = membership.workspaceId;
    const configs = await prisma.config.findMany({
      where: {
        workspaceId,
        key: { in: ['google_drive_access_token', 'google_drive_refresh_token'] },
      },
    });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    const accessToken = configMap['google_drive_access_token'];
    if (!accessToken) {
      return NextResponse.json({ error: 'not connected' }, { status: 400 });
    }

    const drive = getDriveClient(accessToken, configMap['google_drive_refresh_token']);

    // List folders and files in the folder
    const [folders, files] = await Promise.all([
      drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, createdTime)',
        orderBy: 'name',
      }),
      drive.files.list({
        q: `'${folderId}' in parents and not mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, mimeType, createdTime, size)',
        orderBy: 'createdTime desc',
      }),
    ]);

    return NextResponse.json({
      folders: folders.data.files || [],
      files: files.data.files || [],
    });
  } catch (err) {
    console.error('Drive files error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
