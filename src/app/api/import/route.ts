import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEFAULT_VIDEO_PAY_RATE, DEFAULT_VIDEO_STATUS } from '@/lib/const/default';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { videos = [], config = {} } = body;
  let imported = 0;
  const errors: string[] = [];

  for (const v of videos) {
    try {
      const isPosted = (v.status ?? DEFAULT_VIDEO_STATUS) === 'posted';
      await prisma.video.create({
        data: {
          name: v.name || v.title || 'Untitled',
          fileName: v.fileName || null,
          extension: v.extension || null,
          platform: v.platform || 'tiktok',
          status: v.status || DEFAULT_VIDEO_STATUS,
          uploadedAt: isPosted ? new Date() : null,
          views: parseInt(v.views) || 0,
          likes: parseInt(v.likes) || 0,
          comments: parseInt(v.comments) || 0,
          shares: parseInt(v.shares) || 0,
          watchTime: v.watchTime || null,
          rpm: parseFloat(v.rpm) || null,
          earnings: parseFloat(v.earnings) || DEFAULT_VIDEO_PAY_RATE,
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
          workspaceId: auth.workspaceId,
          campaignId: v.campaignId || null,
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Failed to import video: ${String(e)}`);
    }
  }

  for (const [key, value] of Object.entries(config)) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId: auth.workspaceId, key } },
      update: { value: String(value) },
      create: { workspaceId: auth.workspaceId, key, value: String(value) },
    });
  }

  return NextResponse.json({ imported, total: videos.length, errors: errors.length > 0 ? errors : undefined });
}
