import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEFAULT_VIDEO_PAY_RATE, DEFAULT_VIDEO_STATUS } from '@/lib/const/default';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');

  const videos = await prisma.video.findMany({
    where: { workspaceId: auth.workspaceId, campaignId: campaignId || undefined },
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
  });
  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const {
    name, fileName, extension, campaignId, platform,
    status, views, likes, comments, shares, watchTime, rpm, earnings,
    hookType, niche, format, hasBeforeAfter, hasTextOverlay, durationBucket, postedTimeBucket,
    aiScore, aiTag, notes, driveFileId, driveFolderId,
    driveWebViewLink, thumbnailUrl,
  } = body;

  const isPosted = (status ?? DEFAULT_VIDEO_STATUS) === 'posted';
  const uploadedAt = isPosted ? new Date() : null;

  const video = await prisma.video.create({
    data: {
      name: name || fileName || '',
      fileName: fileName || null,
      extension: extension || null,
      platform: platform || 'tiktok',
      status: status || DEFAULT_VIDEO_STATUS,
      uploadedAt,
      views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0,
      watchTime, rpm, earnings: parseFloat(String(earnings)) || DEFAULT_VIDEO_PAY_RATE,
      hookType, niche, format,
      hasBeforeAfter: Boolean(hasBeforeAfter), hasTextOverlay: Boolean(hasTextOverlay),
      durationBucket, postedTimeBucket, aiScore, aiTag, notes,
      driveFileId, driveFolderId,
      driveWebViewLink: driveWebViewLink || null,
      thumbnailUrl: thumbnailUrl || null,
      workspaceId: auth.workspaceId,
      campaignId: campaignId || null,
    },
  });
  return NextResponse.json(video);
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const isTransitioningToPosted = data.status === 'posted' && existing.status !== 'posted';
  const updateData = { ...data };
  if (isTransitioningToPosted) {
    updateData.uploadedAt = new Date();
  }

  const updated = await prisma.video.update({ where: { id }, data: updateData, include: { campaign: true } });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== auth.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
