import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

async function getWorkspaceId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId || null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({}, { status: 200 });

  const configs = await prisma.config.findMany({ where: { workspaceId } });
  const result: Record<string, string> = {};
  configs.forEach((c) => { result[c.key] = c.value; });
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      update: { value: String(value) },
      create: { workspaceId, key, value: String(value) },
    });
  }
  return NextResponse.json({ ok: true });
}
