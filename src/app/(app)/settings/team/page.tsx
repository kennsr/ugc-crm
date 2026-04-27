'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useWorkspace, useInviteMember, useRemoveMember } from '@/lib/queries/workspace';

export default function TeamPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const supabase = createClient();

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) setCurrentUserId(user.id);
  });

  function generateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setError('');
    inviteMember.mutate(inviteEmail, {
      onSuccess: (data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInviteLink(`${window.location.origin}${data.url}`);
          setInviteEmail('');
        }
      },
    });
  }

  function removeMemberCb(memberId: string) {
    if (!confirm('Remove this member?')) return;
    removeMember.mutate(memberId);
  }

  if (isLoading) return <div className="p-6 text-xs text-[#666]">Loading...</div>;

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

      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-3">Members ({workspace?.members.length})</h3>
        <div className="space-y-2">
          {workspace?.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-2 bg-[#0a0a0f] rounded">
              <div>
                <p className="text-xs text-white">{m.user?.email || m.userId.slice(0, 12)}...</p>
                <p className="text-[10px] text-[#555]">{m.role.toUpperCase()}</p>
              </div>
              {isAdmin && m.userId !== currentUserId && (
                <button
                  onClick={() => removeMemberCb(m.id)}
                  disabled={removeMember.isPending}
                  className="text-[10px] text-[#FF6B6B] hover:text-[#FF4444] disabled:opacity-30"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

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
              disabled={inviteMember.isPending}
              className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-2 rounded disabled:opacity-30"
            >
              {inviteMember.isPending ? 'Generating...' : 'Generate Invite Link'}
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
