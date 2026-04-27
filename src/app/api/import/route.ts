import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEFAULT_VIDEO_PAY_RATE, DEFAULT_USD_IDR_RATE, DEFAULT_EDITOR_RATE } from '@/lib/const/default';
import { Video_Status } from '@prisma/client';

function excelDate(serial: number): Date {
  return new Date(1899, 11, 30 + Math.floor(serial));
}

function parseStatus(raw: string): string {
  const map: Record<string, string> = {
    'Not Accepted': 'not_accepted',
    'Cancelled': 'cancelled',
    'In Review': 'in_review',
    'Link Required': 'link_required',
    'Backlog': 'backlog',
    'Shooting': 'shooting',
    'Editing': 'editing',
    'Revision': 'revision',
  };
  return map[raw] ?? 'posted';
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await (file as File).arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Could not read file' }, { status: 400 });
  }

  let workbook: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx');
    workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  } catch {
    return NextResponse.json({ error: 'Could not parse xlsx file — make sure it is a valid .xlsx file' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { utils } = require('xlsx');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wbSheetNames = (workbook as any).SheetNames as string[];

  function sheetData(name: string): Record<string, unknown>[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheet = (workbook as any).Sheets[name];
    return sheet ? (utils.sheet_to_json(sheet) as Record<string, unknown>[]) : [];
  }

  function findSheet(pattern: RegExp): string | undefined {
    return wbSheetNames.find((k) => pattern.test(k.trim()));
  }

  // ── Account sheet → campaigns ──
  const accountSheet = findSheet(/^account$/i);
  const accountData = accountSheet ? sheetData(accountSheet) : [];

  // Collect campaign names from Account sheet
  const campaignNames = new Set<string>();
  for (const row of accountData) {
    const c = row['Campaign'] as string;
    if (c) campaignNames.add(c);
  }

  // Create campaigns that don't exist yet
  let campaignsCreated = 0;
  for (const brandName of campaignNames) {
    const existing = await prisma.campaign.findFirst({ where: { brandName, workspaceId: auth.workspaceId } });
    if (!existing) {
      await prisma.campaign.create({
        data: { brandName, status: 'active', rateAmount: DEFAULT_VIDEO_PAY_RATE, workspaceId: auth.workspaceId },
      });
      campaignsCreated++;
    }
  }

  // ── Videos sheet → videos ──
  const videoSheet = findSheet(/^videos?$/i);
  const videoData = videoSheet ? sheetData(videoSheet) : [];

  let imported = 0;
  const errors: string[] = [];

  for (const row of videoData) {
    const no = row['No'];
    const name = row['Name'] as string;
    if (!no || !name) continue;

    const campaignName = (row['Campaign'] as string) || '';
    const status = parseStatus((row['Status'] as string) || 'posted');

    let campaignId: string | null = null;
    if (campaignName) {
      const camp = await prisma.campaign.findFirst({ where: { brandName: campaignName, workspaceId: auth.workspaceId } });
      campaignId = camp?.id ?? null;
    }

    const dateSerial = row['Uploaded At'];
    let uploadedAt: Date | null = null;
    if (dateSerial && typeof dateSerial === 'number') {
      uploadedAt = excelDate(dateSerial);
    } else if (status === 'posted') {
      uploadedAt = new Date();
    }

    const earnings = parseFloat(String(row['Earnings'])) || DEFAULT_VIDEO_PAY_RATE;

    try {
      await prisma.video.create({
        data: {
          name,
          fileName: (row['File Name'] as string) || null,
          platform: 'tiktok',
          status: status as Video_Status,
          uploadedAt,
          earnings,
          notes: (row['Notes'] as string) || null,
          workspaceId: auth.workspaceId,
          campaignId,
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Row "${name}": ${String(e)}`);
    }
  }

  // ── Finance sheet → config ──
  const financeSheet = findSheet(/^finance$/i);
  const financeData = financeSheet ? sheetData(financeSheet) : [];

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of financeData) {
    const cashflow = row['Cashflow'] as string;
    const amount = row['Amount'];
    if (!cashflow || amount === undefined) continue;
    const n = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
    if (cashflow === 'Income') totalIncome += n;
    else if (cashflow === 'Expense') totalExpense += n;
  }

  const configs = [
    { key: 'total_income_idr', value: String(totalIncome) },
    { key: 'total_expense_idr', value: String(totalExpense) },
    { key: 'usd_idr_rate', value: String(DEFAULT_USD_IDR_RATE) },
    { key: 'editor_rate', value: String(DEFAULT_EDITOR_RATE) },
  ];

  for (const { key, value } of configs) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId: auth.workspaceId, key } },
      update: { value },
      create: { workspaceId: auth.workspaceId, key, value },
    });
  }

  return NextResponse.json({
    imported,
    total: videoData.length,
    campaignsCreated,
    finance: { totalIncome, totalExpense },
    errors: errors.length > 0 ? errors : undefined,
    debug: {
      sheetsFound: wbSheetNames,
      accountSheetFound: !!accountSheet,
      videoSheetFound: !!videoSheet,
      financeSheetFound: !!financeSheet,
      accountRows: accountData.length,
      videoRows: videoData.length,
      financeRows: financeData.length,
      accountFirstRow: JSON.stringify(accountData[0]),
      videoFirstRow: JSON.stringify(videoData[0]),
    },
  });
}
