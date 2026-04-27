import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const configs = await prisma.config.findMany({ where: { workspaceId: auth.workspaceId } });
  const result: Record<string, string> = {};
  configs.forEach((c) => { result[c.key] = c.value; });
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId: auth.workspaceId, key } },
      update: { value: String(value) },
      create: { workspaceId: auth.workspaceId, key, value: String(value) },
    });
  }
  return NextResponse.json({ ok: true });
}
