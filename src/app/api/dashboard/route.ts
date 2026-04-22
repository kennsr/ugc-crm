import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const workspaceId = membership.workspaceId;

  const [campaignCount, videoCount, configRows, earningsData, postedCount, recentVideos] = await Promise.all([
    prisma.campaign.count({ where: { workspaceId } }),
    prisma.video.count({ where: { workspaceId } }),
    prisma.config.findMany({ where: { workspaceId } }),
    prisma.video.aggregate({ where: { workspaceId }, _sum: { earnings: true } }),
    prisma.video.count({ where: { workspaceId, status: 'posted' } }),
    prisma.video.findMany({
      where: { workspaceId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
    }),
  ]);

  const config: Record<string, string> = {};
  configRows.forEach((c) => { config[c.key] = c.value; });
  const totalIncome = parseFloat(config['total_income_idr'] || '0');
  const totalExpense = parseFloat(config['total_expense_idr'] || '0');
  const totalEarnings = earningsData._sum.earnings || 0;

  return NextResponse.json({
    workspaceId,
    campaigns: campaignCount,
    videosPosted: postedCount,
    totalVideos: videoCount,
    totalEarningsUsd: totalEarnings,
    totalIncomeIdr: totalIncome,
    totalExpenseIdr: totalExpense,
    netProfitIdr: totalIncome - totalExpense,
    recentVideos,
  });
}
