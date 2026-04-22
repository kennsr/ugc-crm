import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { userId } = await req.json();
  if (userId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const existing = await prisma.workspace.findFirst({
    where: { members: { some: { userId } } },
  });
  if (existing) return NextResponse.json(existing);

  const slug = `ws-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  const workspace = await prisma.workspace.create({
    data: {
      name: 'My UGC Workspace',
      slug,
      members: { create: { userId, role: 'admin' } },
      configs: {
        create: [
          { key: 'usd_idr_rate', value: '17000' },
          { key: 'editor_rate', value: '0.20' },
          { key: 'total_income_idr', value: '0' },
          { key: 'total_expense_idr', value: '0' },
        ],
      },
    },
  });

  return NextResponse.json(workspace);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: { where: { userId: user.id } },
      _count: { select: { videos: true, campaigns: true } },
    },
  });

  return NextResponse.json(workspaces);
}
