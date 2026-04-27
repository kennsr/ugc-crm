'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  LayoutDashboard,
  Megaphone,
  Video,
  BarChart3,
  DollarSign,
  Upload,
  Settings,
} from 'lucide-react';

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/import", label: "Import/Export", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-56 bg-[var(--bg-primary)] border-r border-[var(--border)] flex flex-col fixed h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="shrink-0" width="22" height="22">
          <rect width="32" height="32" rx="6" fill="#0a0a0f"/>
          <path d="M12 10v12l10-6-10-6z" fill="#00FF88"/>
          <circle cx="24" cy="8" r="4" fill="#00FF88" opacity="0.3"/>
          <circle cx="24" cy="8" r="2" fill="#00FF88"/>
        </svg>
        <div className="leading-tight">
          <h1 className="text-[13px] font-semibold tracking-[0.06em] text-[var(--text-primary)]">UGC ENGINE</h1>
          <p className="text-[9px] text-[var(--text-muted)]">Creator Intelligence</p>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 text-[11px] font-medium tracking-[0.02em] transition-all rounded ${
              pathname === href
                ? 'text-[var(--accent)] bg-[var(--bg-secondary)] border-l-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Icon size={14} className={pathname === href ? 'text-[var(--accent)]' : ''} />
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
