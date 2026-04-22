import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { userId } = await req.json();
  if (userId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: existingWs } = await supabase.from('workspace').select('id').limit(1).single();
  if (existingWs) return NextResponse.json(existingWs);

  const slug = `ws-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
  const { data: ws, error: wsErr } = await supabase
    .from('workspace')
    .insert({ name: 'My UGC Workspace', slug })
    .select()
    .single();
  if (wsErr) return NextResponse.json({ error: wsErr.message }, { status: 500 });

  await supabase.from('workspace_member').insert({ workspaceId: ws.id, userId: user.id, role: 'admin' });
  await supabase.from('config').insert([
    { workspaceId: ws.id, key: 'usd_idr_rate', value: '17000' },
    { workspaceId: ws.id, key: 'editor_rate', value: '0.20' },
    { workspaceId: ws.id, key: 'total_income_idr', value: '0' },
    { workspaceId: ws.id, key: 'total_expense_idr', value: '0' },
  ]);
  return NextResponse.json(ws);
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: workspaces } = await supabase
    .from('workspace')
    .select('*, members:workspace_member(*), _count:campaign(count)')
    .contains('members', [{ userId: user.id }]);
  return NextResponse.json(workspaces || []);
}
