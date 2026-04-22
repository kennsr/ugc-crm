'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{ workspaceName: string; email: string; role: string } | null>(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!code) return;
    fetch(`/api/auth/invite?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInfo(data);
        setLoading(false);
      });
  }, [code]);

  async function acceptInvite() {
    setAccepting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to signup with invite code stored
      router.push(`/signup?invite=${code}`);
      return;
    }
    const res = await fetch('/api/auth/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setAccepting(false);
    } else {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-xs text-[#666]">Loading invite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center p-6">
          <p className="text-[#FF6B6B] text-lg font-bold">Invalid Invite</p>
          <p className="text-xs text-[#666] mt-2">{error}</p>
          <a href="/login" className="text-xs text-[#00FF88] mt-4 inline-block">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-sm p-6 text-center">
        <div className="mb-6">
          <p className="text-[10px] text-[#666] uppercase tracking-widest">You&apos;re invited to</p>
          <h1 className="text-xl font-bold text-[#00FF88] mt-2">{info?.workspaceName}</h1>
          <p className="text-xs text-[#666] mt-1">Role: <span className="text-white">{info?.role}</span></p>
        </div>
        <button
          onClick={acceptInvite}
          disabled={accepting}
          className="w-full bg-[#00FF88] text-[#0a0a0f] text-xs font-bold p-3 rounded hover:bg-[#00cc6e] transition-colors disabled:opacity-30"
        >
          {accepting ? 'Joining...' : 'Accept Invite & Join'}
        </button>
        <p className="text-[10px] text-[#444] mt-4">
          You&apos;ll be signed in and redirected to the dashboard.
        </p>
      </div>
    </div>
  );
}
