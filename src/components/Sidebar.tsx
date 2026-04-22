'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

const menuItems = [
  { href: "/", label: "Dashboard" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/videos", label: "Videos" },
  { href: "/analytics", label: "Analytics" },
  { href: "/income", label: "Income" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-56 bg-[var(--bg-primary)] border-r border-[var(--border)] flex flex-col fixed h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
          <span className="text-[10px] font-bold text-black">U</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-primary)]">UGC ENGINE</h1>
          <p className="text-[9px] text-[var(--text-muted)]">Creator Intelligence</p>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 text-[11px] font-medium tracking-[0.02em] transition-all ${
              pathname === href
                ? 'text-[var(--accent)] bg-[var(--bg-secondary)] border-l-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--border)]">
        <Link href="/settings" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">{initials}</span>
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium text-[var(--text-primary)]">{displayName}</p>
            <p className="text-[9px] text-[var(--text-muted)]">{user?.email || ''}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
