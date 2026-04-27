import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId: auth.workspaceId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { brandName, platform, rateType, rateAmount, status, notes, driveFolderId } = body;

  const campaign = await prisma.campaign.create({
    data: {
      brandName,
      platform: platform || 'both',
      rateType: rateType || 'fixed',
      rateAmount: parseFloat(rateAmount) || 0,
      status: status || 'active',
      notes,
      driveFolderId,
      workspaceId: auth.workspaceId,
    },
  });
  return NextResponse.json(campaign);
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updated = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
