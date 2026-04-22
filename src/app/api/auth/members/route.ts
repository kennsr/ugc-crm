import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('workspace_member')
    .select('workspaceId, role')
    .eq('userId', user.id)
    .limit(1)
    .single();
  if (!membership) return NextResponse.json({ error: 'no workspace' }, { status: 404 });

  const { data: members } = await supabase
    .from('workspace_member')
    .select('id, userId, role, createdAt, users:user(*)')
    .eq('workspaceId', membership.workspaceId);
  return NextResponse.json(members || []);
}
