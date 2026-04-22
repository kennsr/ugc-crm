import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json([], { status: 200 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId') || undefined;

  const videos = await prisma.video.findMany({
    where: { workspaceId: membership.workspaceId, campaignId },
    orderBy: { createdAt: 'desc' },
    include: { campaign: true },
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  const { title, fileName, campaignId, platform, postedAt, status, views, likes, comments, shares, watchTime, rpm, earnings, hookType, niche, format, hasBeforeAfter, hasTextOverlay, durationBucket, postedTimeBucket, aiScore, aiTag, notes } = body;

  const video = await prisma.video.create({
    data: {
      title, fileName, platform: platform || 'tiktok', campaignId: campaignId || null, postedAt,
      status: status || 'posted', views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0,
      watchTime, rpm, earnings: parseFloat(earnings) || 0,
      hookType, niche, format,
      hasBeforeAfter: Boolean(hasBeforeAfter), hasTextOverlay: Boolean(hasTextOverlay),
      durationBucket, postedTimeBucket, aiScore, aiTag, notes,
      workspaceId: membership.workspaceId,
    },
  });
  return NextResponse.json(video);
}

export async function PUT(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== membership.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updated = await prisma.video.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.workspaceId !== membership.workspaceId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
