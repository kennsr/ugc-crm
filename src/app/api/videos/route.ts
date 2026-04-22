import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

async function getWorkspaceId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId || null;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json([], { status: 200 });

  const videos = await prisma.video.findMany({
    where: { workspaceId, campaignId: campaignId || undefined },
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
  });
  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  const {
    title, fileName, campaignId, platform, postedAt, status,
    views, likes, comments, shares, watchTime, rpm, earnings,
    hookType, niche, format, hasBeforeAfter, hasTextOverlay, durationBucket, postedTimeBucket,
    aiScore, aiTag, notes, driveFileId, driveFolderId,
  } = body;

  const video = await prisma.video.create({
    data: {
      title, fileName, platform: platform || 'tiktok',
      postedAt, status: status || 'posted',
      views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0,
      watchTime, rpm, earnings: parseFloat(earnings) || 0,
      hookType, niche, format,
      hasBeforeAfter: Boolean(hasBeforeAfter), hasTextOverlay: Boolean(hasTextOverlay),
      durationBucket, postedTimeBucket, aiScore, aiTag, notes,
      driveFileId, driveFolderId,
      workspaceId,
      campaignId: campaignId || null,
    },
  });
  return NextResponse.json(video);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updated = await prisma.video.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const workspaceId = await getWorkspaceId(user.id);
  if (!workspaceId) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
