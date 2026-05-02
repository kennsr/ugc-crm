'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Megaphone,
  Video,
  BarChart3,
  DollarSign,
  Upload,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProfile } from '@/lib/queries/profile';

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/accounts", label: "Accounts", icon: User },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/import", label: "Import/Export", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onCollapsedChange }: { onCollapsedChange?: (v: boolean) => void }) {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { onCollapsedChange?.(collapsed); }, [collapsed, onCollapsedChange]);

  const displayName = profile?.fullName || profile?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl;

  return (
    <>
      <style jsx>{`
        .sidebar {
          width: 14rem;
          transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar.collapsed {
          width: 4rem;
        }
        .sidebar-label {
          opacity: 1;
          transition: opacity 200ms ease, width 300ms cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          overflow: hidden;
        }
        .sidebar.collapsed .sidebar-label {
          opacity: 0;
          width: 0;
        }
        .nav-item {
          transition: background 150ms ease;
        }
      `}</style>

      <aside
        className={`sidebar fixed h-full bg-[var(--bg-primary)] border-r border-[var(--border)] flex flex-col z-20 ${collapsed ? 'collapsed' : ''}`}
      >
        <div className="px-4 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="shrink-0" width="22" height="22">
            <rect width="32" height="32" rx="6" fill="#0a0a0f"/>
            <path d="M12 10v12l10-6-10-6z" fill="#00FF88"/>
            <circle cx="24" cy="8" r="4" fill="#00FF88" opacity="0.3"/>
            <circle cx="24" cy="8" r="2" fill="#00FF88"/>
          </svg>
          <span className="sidebar-label text-[13px] font-semibold tracking-[0.06em] text-[var(--text-primary)]">UGC ENGINE</span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-light)] transition-all shadow-sm z-10"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        <nav className="flex-1 p-2">
          {menuItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item flex items-center gap-2 px-3 py-2 text-[11px] font-medium tracking-[0.02em] rounded mb-0.5 relative ${
                  active
                    ? 'text-[var(--accent)] bg-[var(--bg-secondary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title={collapsed ? label : undefined}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-[var(--accent)]' : ''}`} />
                <Icon size={14} className={active ? 'text-[var(--accent)]' : ''} />
                <span className="sidebar-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] shrink-0 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-semibold text-[var(--text-primary)]">{initials}</span>
              )}
            </div>
            <div className="sidebar-label leading-tight overflow-hidden">
              <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">{displayName}</p>
              <p className="text-[9px] text-[var(--text-muted)] truncate">{profile?.email || ''}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
