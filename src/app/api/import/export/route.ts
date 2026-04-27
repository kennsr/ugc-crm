import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx');

  const [campaigns, videos, incomeConfig, expenseConfig] = await Promise.all([
    prisma.campaign.findMany({ where: { workspaceId: auth.workspaceId }, orderBy: { createdAt: 'asc' } }),
    prisma.video.findMany({
      where: { workspaceId: auth.workspaceId },
      orderBy: { createdAt: 'asc' },
      include: { campaign: true },
    }),
    prisma.config.findFirst({ where: { workspaceId: auth.workspaceId, key: 'total_income_idr' } }),
    prisma.config.findFirst({ where: { workspaceId: auth.workspaceId, key: 'total_expense_idr' } }),
  ]);

  const accountData = campaigns.map((c) => ({
    Campaign: c.brandName,
    Platform: c.platform || 'tiktok',
    'Pay Rate': c.rateAmount,
    Status: c.status,
  }));

  const videoData = videos.map((v, i) => ({
    No: i + 1,
    Name: v.name,
    'File Name': v.fileName || '',
    Campaign: v.campaign?.brandName || '',
    Status: v.status,
    'Uploaded At': v.uploadedAt ? serialDate(v.uploadedAt) : '',
    Earnings: v.earnings,
    Notes: v.notes || '',
  }));

  const financeData = [
    { Cashflow: 'Income', Amount: parseFloat(incomeConfig?.value || '0') },
    { Cashflow: 'Expense', Amount: parseFloat(expenseConfig?.value || '0') },
  ];

  const wb = XLSX.utils.book_new();

  const accountSheet = XLSX.utils.json_to_sheet(accountData);
  const videoSheet = XLSX.utils.json_to_sheet(videoData);
  const financeSheet = XLSX.utils.json_to_sheet(financeData);

  XLSX.utils.book_append_sheet(wb, accountSheet, 'Account');
  XLSX.utils.book_append_sheet(wb, videoSheet, 'Videos');
  XLSX.utils.book_append_sheet(wb, financeSheet, 'Finance');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ugc-crm-export.xlsx"',
    },
  });
}

function serialDate(date: Date): number {
  return Math.floor((date.getTime() - new Date(1899, 11, 30).getTime()) / (1000 * 60 * 60 * 24));
}
