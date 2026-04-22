import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'must be signed in' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: { workspace: true },
    });

    if (!invite) return NextResponse.json({ error: 'invite not found' }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: 'invite already used' }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'invite expired' }, { status: 410 });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      update: { role: invite.role },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
