'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export default function LoginClient({ supabaseUrl, supabaseAnonKey }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      const result: any = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise,
      ]);

      const signInError = result?.error;
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else if (!result?.data?.user) {
        setError('Login failed - no user returned');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      if (err.message === 'timeout') {
        setError('Login request timed out. Check your connection.');
      } else {
        setError(err.message || 'Unknown error');
      }
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-sm p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#00FF88]">GENOS UGC</h1>
          <p className="text-xs text-[#666] mt-1">Creator Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-[#111118] border border-[#2a2a3e] text-xs p-3 rounded text-white placeholder-[#444]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-[#111118] border border-[#2a2a3e] text-xs p-3 rounded text-white placeholder-[#444]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00FF88] text-[#0a0a0f] text-xs font-bold p-3 rounded hover:bg-[#00cc6e] transition-colors disabled:opacity-30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-[#2a2a3e]" />
          <span className="text-[10px] text-[#444]">or</span>
          <div className="flex-1 h-px bg-[#2a2a3e]" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full bg-[#111118] border border-[#2a2a3e] text-xs p-3 rounded hover:bg-[#1a1a2e] transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-[#555] mt-6">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-[#00FF88]">Sign up</a>
        </p>
      </div>
    </div>
  );
}
