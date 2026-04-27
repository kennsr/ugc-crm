import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    await prisma.config.deleteMany({
      where: {
        workspaceId: auth.workspaceId,
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
    console.error('Drive disconnect error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
