import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Get user's workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ connected: false, rootFolderId: null, lastSynced: null });
    }

    const workspaceId = membership.workspaceId;

    // Get Drive config for this workspace
    const configs = await prisma.config.findMany({
      where: {
        workspaceId,
        key: {
          in: ['google_drive_access_token', 'google_drive_root_folder_id', 'google_drive_last_synced'],
        },
      },
    });

    const configMap: Record<string, string> = {};
    configs.forEach((c) => {
      configMap[c.key] = c.value;
    });

    return NextResponse.json({
      connected: !!configMap['google_drive_access_token'],
      rootFolderId: configMap['google_drive_root_folder_id'] || null,
      lastSynced: configMap['google_drive_last_synced'] || null,
    });
  } catch (err) {
    console.error('Drive status error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
