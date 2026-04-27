import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { DEFAULT_VIDEO_PAY_RATE, DEFAULT_USD_IDR_RATE, DEFAULT_EDITOR_RATE } from "../src/lib/const/default";

const prisma = new PrismaClient();

function excelDate(serial: number): Date {
  const d = new Date(1899, 11, 30 + Math.floor(serial));
  return d;
}

async function main() {
  console.log("🎯 Starting UGC CRM data import...");

  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npm run import:xlsx <path-to-xlsx>");
    process.exit(1);
  }

  const wb = XLSX.readFile(path);

  // ── Import Campaigns from Account sheet ──
  const accountSheet = wb.Sheets["Account"];
  const accountData = XLSX.utils.sheet_to_json(accountSheet) as Record<string, unknown>[];
  console.log(`📋 Account sheet: ${accountData.length} rows`);

  // Unique campaigns
  const campaignNames = new Set<string>();
  (accountData as Record<string, unknown>[]).forEach((row) => {
    const c = row["Campaign"] as string;
    if (c) campaignNames.add(c);
  });
  console.log("Campaigns found:", [...campaignNames]);

  for (const brandName of campaignNames) {
    const existing = await prisma.campaign.findFirst({ where: { brandName } });
    if (!existing) {
      await prisma.campaign.create({
        data: { brandName, status: "active", rateAmount: DEFAULT_VIDEO_PAY_RATE, workspaceId: "placeholder" },
      });
      console.log(`  ✅ Created campaign: ${brandName}`);
    }
  }

  // ── Import Videos from Video sheet ──
  const videoSheet = wb.Sheets["Video"];
  const videoData = XLSX.utils.sheet_to_json(videoSheet) as Record<string, unknown>[];
  console.log(`\n🎬 Video sheet: ${videoData.length} rows`);

  let imported = 0;
  for (const row of videoData) {
    const no = row["No"];
    const title = row["Name"] as string;
    if (!no || !title) continue;

    const campaignName = (row["Campaign"] as string) || "";
    const statusRaw = (row["Status"] as string) || "posted";

    // Map status
    let status = "posted";
    if (statusRaw === "Not Accepted") status = "not_accepted";
    else if (statusRaw === "Cancelled") status = "cancelled";
    else if (statusRaw === "In Review") status = "in_review";
    else if (statusRaw === "Link Required") status = "link_required";
    else if (statusRaw === "Backlog") status = "backlog";
    else if (statusRaw === "Shooting") status = "shooting";
    else if (statusRaw === "Editing") status = "editing";
    else if (statusRaw === "Revision") status = "revision";
    else status = "posted";

    // Find campaign
    let campaignId: string | undefined;
    if (campaignName) {
      const camp = await prisma.campaign.findFirst({ where: { brandName: campaignName } });
      campaignId = camp?.id;
    }

    // Parse date → uploadedAt (auto-set if status is "posted")
    const dateSerial = row["Uploaded At"];
    let uploadedAt: Date | undefined;
    if (dateSerial && typeof dateSerial === "number") {
      uploadedAt = excelDate(dateSerial);
    } else if (status === "posted") {
      uploadedAt = new Date();
    }

    const earningsVal = parseFloat(String(row["Earnings"])) || DEFAULT_VIDEO_PAY_RATE;

    await prisma.video.create({
      data: {
        name: String(title),
        fileName: (row["File Name"] as string) || null,
        platform: "tiktok",
        campaignId,
        status,
        uploadedAt: uploadedAt ?? null,
        earnings: earningsVal,
        notes: (row["Notes"] as string) || null,
        workspaceId: "placeholder",
      },
    });
    imported++;
  }
  console.log(`  ✅ Imported ${imported} videos`);

  // ── Import Finance from Finance sheet ──
  const financeSheet = wb.Sheets["Finance"];
  const financeData = XLSX.utils.sheet_to_json(financeSheet) as Record<string, unknown>[];
  console.log(`\n💰 Finance sheet: ${financeData.length} rows`);

  // Upsert config values
  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of financeData) {
    const cashflow = row["Cashflow"] as string;
    const amount = row["Amount"];
    if (!cashflow || !amount) continue;

    const amountNum = typeof amount === "number" ? amount : parseFloat(amount as string) || 0;
    if (cashflow === "Income") totalIncome += amountNum;
    else if (cashflow === "Expense") totalExpense += amountNum;
  }

  await prisma.config.upsert({ where: { key: "total_income_idr" }, update: { value: String(totalIncome) }, create: { key: "total_income_idr", value: String(totalIncome) } });
  await prisma.config.upsert({ where: { key: "total_expense_idr" }, update: { value: String(totalExpense) }, create: { key: "total_expense_idr", value: String(totalExpense) } });
  await prisma.config.upsert({ where: { key: "usd_idr_rate" }, update: { value: String(DEFAULT_USD_IDR_RATE) }, create: { key: "usd_idr_rate", value: String(DEFAULT_USD_IDR_RATE) } });
  await prisma.config.upsert({ where: { key: "editor_rate" }, update: { value: String(DEFAULT_EDITOR_RATE) }, create: { key: "editor_rate", value: String(DEFAULT_EDITOR_RATE) } });

  console.log(`  ✅ Total Income: ${totalIncome.toLocaleString("id-ID")} IDR`);
  console.log(`  ✅ Total Expense: ${totalExpense.toLocaleString("id-ID")} IDR`);
  console.log(`  ✅ Net: ${(totalIncome - totalExpense).toLocaleString("id-ID")} IDR`);

  console.log("\n✅ Import complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
