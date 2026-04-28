import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const accounts = await prisma.account.findMany({
      where: { workspaceId: auth.workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
    });
    return NextResponse.json(accounts);
  } catch (err) {
    console.error('GET /api/accounts error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { name, username, platform, email, campaignId, notes } = body;
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const account = await prisma.account.create({
      data: {
        name,
        username: username || null,
        platform: platform || 'tiktok',
        email: email || null,
        notes: notes || null,
        workspaceId: auth.workspaceId,
        campaignId: campaignId || null,
      },
      include: { campaign: true },
    });
    return NextResponse.json(account);
  } catch (err) {
    console.error('POST /api/accounts error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updated = await prisma.account.update({
    where: { id },
    data: {
      ...data,
      campaignId: data.campaignId === '' ? null : (data.campaignId || undefined),
    },
    include: { campaign: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}