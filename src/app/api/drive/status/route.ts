import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const configs = await prisma.config.findMany({
      where: {
        workspaceId: auth.workspaceId,
        key: { in: ['google_drive_access_token', 'google_drive_root_folder_id', 'google_drive_last_synced', 'last_backup_at'] },
      },
    });
    const configMap: Record<string, string> = {};
    configs.forEach((c) => { configMap[c.key] = c.value; });

    return NextResponse.json({
      connected: !!configMap['google_drive_access_token'],
      rootFolderId: configMap['google_drive_root_folder_id'] || null,
      lastSynced: configMap['google_drive_last_synced'] || null,
      lastBackupAt: configMap['last_backup_at'] || null,
    });
  } catch (err) {
    console.error('Drive status error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
