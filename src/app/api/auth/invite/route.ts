import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

function generateCode() {
  return randomBytes(6).toString('hex');
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { email, role = 'member', workspaceId } = await req.json();
    if (!email || !workspaceId) {
      return NextResponse.json({ error: 'email and workspaceId required' }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id, role: 'admin' },
    });
    if (!member) return NextResponse.json({ error: 'admin only' }, { status: 403 });

    const existing = await prisma.invite.findFirst({
      where: { workspaceId, email: email.toLowerCase(), acceptedAt: null },
    });
    if (existing) {
      return NextResponse.json({ code: existing.code, url: `/invite/${existing.code}` });
    }

    const code = generateCode();
    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        email: email.toLowerCase(),
        role,
        code,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ code: invite.code, url: `/invite/${invite.code}` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: { workspace: { select: { name: true } } },
    });

    if (!invite) return NextResponse.json({ error: 'invite not found' }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: 'invite already used' }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'invite expired' }, { status: 410 });

    return NextResponse.json({
      workspaceName: invite.workspace.name,
      email: invite.email,
      role: invite.role,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
