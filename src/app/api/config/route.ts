import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const configs = await prisma.config.findMany({ where: { workspaceId: membership.workspaceId } });
  const result: Record<string, string> = {};
  configs.forEach((c) => { result[c.key] = c.value; });
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId: membership.workspaceId, key } },
      update: { value: String(value) },
      create: { workspaceId: membership.workspaceId, key, value: String(value) },
    });
  }
  return NextResponse.json({ ok: true });
}
