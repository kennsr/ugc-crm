'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

type Member = { id: string; userId: string; role: string; createdAt: string };
type Workspace = { id: string; name: string; slug: string; plan: string; members: Member[] };

export default function TeamPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetch('/api/auth/workspace')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setWorkspace(data[0]);
            }
            setLoading(false);
          });
      }
    });
  }, []);

  async function generateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setInviteLoading(true);
    setError('');
    const res = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, workspaceId: workspace.id }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setInviteLink(`${window.location.origin}${data.url}`);
      setInviteEmail('');
    }
    setInviteLoading(false);
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member?')) return;
    const res = await fetch(`/api/auth/members/${memberId}?workspaceId=${workspace?.id}`, { method: 'DELETE' });
    if (res.ok) {
      setWorkspace((prev) => prev ? {
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      } : null);
    }
  }

  if (loading) return <div className="p-6 text-xs text-[#666]">Loading...</div>;

  const isAdmin = workspace?.members.some((m) => m.userId === currentUserId && m.role === 'admin');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Team Settings</h1>
          <p className="text-xs text-[#666] mt-0.5">{workspace?.name}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] ${workspace?.plan === 'pro' ? 'bg-[#FFD700] text-black' : 'bg-[#222] text-[#666]'}`}>
          {(workspace?.plan || 'free').toUpperCase()}
        </span>
      </div>

      {/* Current Members */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-3">Members ({workspace?.members.length})</h3>
        <div className="space-y-2">
          {workspace?.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded">
              <div>
                <p className="text-xs text-white">{m.userId.slice(0, 12)}...</p>
                <p className="text-[10px] text-[#555]">{m.role.toUpperCase()}</p>
              </div>
              {isAdmin && m.userId !== currentUserId && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-[10px] text-[#FF6B6B] hover:text-[#FF4444]"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Invite */}
      {isAdmin && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <h3 className="text-sm font-bold mb-3">Invite Member</h3>
          <form onSubmit={generateInvite} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select
                className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
            <button
              type="submit"
              disabled={inviteLoading}
              className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-2 rounded disabled:opacity-30"
            >
              {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-3 p-3 bg-[#0a0a0f] rounded">
              <p className="text-[10px] text-[#666] mb-1">Share this link:</p>
              <input
                readOnly
                value={inviteLink}
                className="w-full bg-[#111] border border-[#2a2a3e] text-[10px] p-2 rounded text-white"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#555]">Only workspace admins can invite members.</p>
        </div>
      )}
    </div>
  );
}
