import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getDriveClient } from '@/lib/drive';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || 'root';

    const configs = await prisma.config.findMany({
      where: { workspaceId: auth.workspaceId, key: { in: ['google_drive_access_token', 'google_drive_refresh_token'] } },
    });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    const accessToken = configMap['google_drive_access_token'];
    if (!accessToken) return NextResponse.json({ error: 'not connected' }, { status: 400 });

    const drive = getDriveClient(accessToken, configMap['google_drive_refresh_token']);

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
