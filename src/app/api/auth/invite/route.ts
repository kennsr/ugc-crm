import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { email, role = 'member', workspaceId } = await req.json();
  if (!email || !workspaceId) return NextResponse.json({ error: 'email and workspaceId required' }, { status: 400 });

  const { data: member } = await supabase
    .from('workspace_member')
    .select('role')
    .eq('workspaceId', workspaceId)
    .eq('userId', user.id)
    .eq('role', 'admin')
    .limit(1)
    .single();
  if (!member) return NextResponse.json({ error: 'admin only' }, { status: 403 });

  const { data: existing } = await supabase
    .from('invite')
    .select('code')
    .eq('workspaceId', workspaceId)
    .eq('email', email.toLowerCase())
    .is('acceptedAt', null)
    .limit(1);
  if (existing && existing.length > 0) return NextResponse.json({ code: existing[0].code, url: `/invite/${existing[0].code}` });

  const code = Math.random().toString(36).slice(2, 14);
  const { data: invite, error } = await supabase
    .from('invite')
    .insert({ workspaceId, email: email.toLowerCase(), role, code, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: invite.code, url: `/invite/${invite.code}` });
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const { data: invite } = await supabase
    .from('invite')
    .select('*, workspace:workspace(name)')
    .eq('code', code)
    .limit(1)
    .single();
  if (!invite) return NextResponse.json({ error: 'invite not found' }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: 'invite already used' }, { status: 410 });
  if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'invite expired' }, { status: 410 });

  return NextResponse.json({ workspaceName: invite.workspace?.name, email: invite.email, role: invite.role });
}
