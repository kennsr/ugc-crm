import { DEFAULT_VIDEO_PAY_RATE } from '@/lib/const/default';

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx');

  const accountData = [
    {
      Campaign: 'Brand A',
      Platform: 'tiktok',
      'Pay Rate': DEFAULT_VIDEO_PAY_RATE,
      Status: 'active',
    },
    {
      Campaign: 'Brand B',
      Platform: 'tiktok',
      'Pay Rate': DEFAULT_VIDEO_PAY_RATE,
      Status: 'active',
    },
  ];

  const videoData = [
    {
      No: 1,
      Name: 'Product Demo - Kitchen Set',
      'File Name': 'kitchenset_001.mp4',
      Campaign: 'Brand A',
      Status: 'Backlog',
      'Uploaded At': '',
      Earnings: DEFAULT_VIDEO_PAY_RATE,
      Notes: '',
    },
    {
      No: 2,
      Name: 'Unboxing - Skincare Routine',
      'File Name': 'skincare_002.mp4',
      Campaign: 'Brand B',
      Status: 'Posted',
      'Uploaded At': '',
      Earnings: DEFAULT_VIDEO_PAY_RATE,
      Notes: '',
    },
  ];

  const financeData = [
    { Cashflow: 'Income', Amount: 0 },
    { Cashflow: 'Expense', Amount: 0 },
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
      'Content-Disposition': 'attachment; filename="ugc-crm-import-template.xlsx"',
    },
  });
}
