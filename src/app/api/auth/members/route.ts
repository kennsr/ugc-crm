import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const workspaceId = searchParams.get('workspaceId');

    if (!memberId || !workspaceId) {
      return NextResponse.json({ error: 'memberId and workspaceId required' }, { status: 400 });
    }

    const requesterMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id, role: 'admin' },
    });
    if (!requesterMembership) {
      return NextResponse.json({ error: 'admin only' }, { status: 403 });
    }

    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (member?.role === 'admin') {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'admin' },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'cannot remove last admin' }, { status: 400 });
      }
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });
    if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    // Get user emails from Supabase
    const supabaseUsers = await Promise.all(
      members.map(async (m) => {
        const { data } = await supabase.auth.admin.getUserById(m.userId);
        return { ...m, email: data?.user?.email || '' };
      })
    );

    return NextResponse.json(supabaseUsers);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
