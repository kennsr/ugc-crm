import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function getWorkspaceId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId || null;
}

export async function requireAuth(): Promise<{ userId: string; workspaceId: string } | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  return { userId: user.id, workspaceId };
}
