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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[11px] text-[var(--text-muted)]">Loading invite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center p-6">
          <p className="text-[var(--danger)] text-lg font-semibold">Invalid Invite</p>
          <p className="text-[var(--text-muted)] text-[11px] mt-2">{error}</p>
          <a href="/login" className="text-[var(--accent)] text-[11px] mt-4 inline-block">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm p-6 text-center">
        <div className="mb-6">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">You&apos;re invited to</p>
          <h1 className="text-xl font-semibold text-[var(--accent)] mt-2">{info?.workspaceName}</h1>
          <p className="text-[var(--text-muted)] text-[11px] mt-1">Role: <span className="text-[var(--text-primary)]">{info?.role}</span></p>
        </div>
        <button
          onClick={acceptInvite}
          disabled={accepting}
          className="btn btn-primary w-full"
        >
          {accepting ? 'Joining...' : 'Accept Invite & Join'}
        </button>
        <p className="text-[10px] text-[var(--text-muted)] mt-4">
          You&apos;ll be signed in and redirected to the dashboard.
        </p>
      </div>
    </div>
  );
}
