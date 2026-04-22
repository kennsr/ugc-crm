import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const { data: invite } = await supabase
    .from('invite')
    .select('*, workspace:workspace(id)')
    .eq('code', code)
    .limit(1)
    .single();
  if (!invite) return NextResponse.json({ error: 'invite not found' }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: 'invite already used' }, { status: 410 });
  if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'invite expired' }, { status: 410 });

  await supabase.from('workspace_member').insert({ workspaceId: invite.workspace.id, userId: user.id, role: invite.role });
  await supabase.from('invite').update({ acceptedAt: new Date().toISOString() }).eq('id', invite.id);

  return NextResponse.json({ ok: true });
}
