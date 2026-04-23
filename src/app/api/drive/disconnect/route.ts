import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
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
      return NextResponse.json({ error: 'no workspace' }, { status: 404 });
    }

    // Remove Drive tokens from Config for this workspace
    await prisma.config.deleteMany({
      where: {
        workspaceId: membership.workspaceId,
        key: {
          in: [
            'google_drive_access_token',
            'google_drive_refresh_token',
            'google_drive_root_folder_id',
            'google_drive_last_synced',
          ],
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
