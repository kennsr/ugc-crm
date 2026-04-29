import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { workspaceId } = auth;

  const [campaignCount, videoCount, earningsData, postedCount, recentVideos] = await Promise.all([
    prisma.campaign.count({ where: { workspaceId } }),
    prisma.video.count({ where: { workspaceId } }),
    prisma.video.aggregate({ where: { workspaceId, status: 'posted' }, _sum: { earnings: true } }),
    prisma.video.count({ where: { workspaceId, status: 'posted' } }),
    prisma.video.findMany({
      where: { workspaceId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
    }),
  ]);

  const totalEarnings = earningsData._sum.earnings || 0;

  return NextResponse.json({
    workspaceId,
    campaigns: campaignCount,
    videosPosted: postedCount,
    totalVideos: videoCount,
    totalEarningsUsd: totalEarnings,
    recentVideos,
  });
}
