import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll() {},
    },
  });

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
