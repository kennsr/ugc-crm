import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  const { videos = [], config = {} } = body;
  let imported = 0;

  for (const v of videos) {
    try {
      await prisma.video.create({
        data: {
          title: v.title || 'Untitled',
          fileName: v.fileName || '',
          platform: v.platform || 'tiktok',
          campaignId: v.campaignId || null,
          postedAt: v.postedAt || null,
          status: v.status || 'posted',
          views: parseInt(v.views) || 0,
          likes: parseInt(v.likes) || 0,
          comments: parseInt(v.comments) || 0,
          shares: parseInt(v.shares) || 0,
          watchTime: v.watchTime || null,
          rpm: parseFloat(v.rpm) || null,
          earnings: parseFloat(v.earnings) || 0,
          hookType: v.hookType || null,
          niche: v.niche || null,
          format: v.format || null,
          hasBeforeAfter: Boolean(v.hasBeforeAfter),
          hasTextOverlay: Boolean(v.hasTextOverlay),
          durationBucket: v.durationBucket || null,
          postedTimeBucket: v.postedTimeBucket || null,
          aiScore: v.aiScore || null,
          aiTag: v.aiTag || null,
          notes: v.notes || null,
          workspaceId: membership.workspaceId,
        },
      });
      imported++;
    } catch (_e) {}
  }

  for (const [key, value] of Object.entries(config)) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId: membership.workspaceId, key } },
      update: { value: String(value) },
      create: { workspaceId: membership.workspaceId, key, value: String(value) },
    });
  }

  return NextResponse.json({ imported, total: videos.length });
}
