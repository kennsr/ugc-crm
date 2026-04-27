'use client';
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { Camera } from 'lucide-react';
import { useInvalidateProfile, useProfile } from '@/lib/queries/profile';
import { useConfig, useSaveAllConfig } from '@/lib/queries/config';
import { DEFAULT_USD_IDR_RATE, DEFAULT_EDITOR_RATE } from '@/lib/const/default';

const DriveConnect = dynamic(() => import('@/components/DriveConnect'), { ssr: false });

export default function SettingsClient() {
  const { data: config = {} } = useConfig();
  const saveAllConfig = useSaveAllConfig();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: profile } = useProfile();
  const invalidateProfile = useInvalidateProfile();
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    setForm(config);
  }, [config]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.fullName ?? '');
      setProfileAvatar(profile.avatarUrl ?? '');
    }
  }, [profile]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const merged = { ...config, ...form };
    saveAllConfig.mutate(merged, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileSaving(true);
    setProfileError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setProfileAvatar(data.avatarUrl);
      setProfileSaved(true);
      invalidateProfile();
      setTimeout(() => setProfileSaved(false), 2000);
    } else {
      setProfileError(data.error || 'Upload failed');
    }
    setProfileSaving(false);
  }

  async function saveProfile() {
    setProfileSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: profileName, avatarUrl: profileAvatar }),
    });
    const updated = await res.json();
    if (res.ok) {
      setProfileAvatar(updated.avatarUrl);
      invalidateProfile();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }
    setProfileSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const initials = profileName
    ? profileName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1>Settings</h1>

      <DriveConnect />

      {/* Profile */}
      <div className="card card-pad space-y-4">
        <h3>Profile</h3>
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <label className="cursor-pointer block relative group">
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileAvatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border border-[var(--border)]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center">
                  <span className="text-[18px] font-semibold text-[var(--text-secondary)]">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} className="text-white" />
              </div>
              <input type="file" accept="image/*" className="sr-only" onChange={uploadAvatar} />
            </label>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Display Name</label>
              <input
                className="input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Email</label>
              <input className="input bg-[var(--bg-tertiary)] cursor-not-allowed" value={profile?.email ?? ''} readOnly />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveProfile} disabled={profileSaving} className="btn btn-primary">
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
          {profileSaved && <span className="text-[11px] text-[var(--accent)]">Saved</span>}
          {profileError && <span className="text-[11px] text-[var(--danger)]">{profileError}</span>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="card card-pad space-y-4">
          <h3>Currency & Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">USD → IDR Exchange Rate</label>
              <input type="number" className="input" value={form["usd_idr_rate"] || DEFAULT_USD_IDR_RATE} onChange={(e) => setForm({ ...form, "usd_idr_rate": e.target.value })} />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Editor Rate (%)</label>
              <input type="number" step="0.01" className="input" value={form["editor_rate"] || DEFAULT_EDITOR_RATE} onChange={(e) => setForm({ ...form, "editor_rate": e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <h3>Editor Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Primary Editor</label>
              <input className="input" value={form["editor_name"] || "Yefta"} onChange={(e) => setForm({ ...form, "editor_name": e.target.value })} />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Editor Contact</label>
              <input className="input" value={form["editor_contact"] || ""} onChange={(e) => setForm({ ...form, "editor_contact": e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <h3>Content Defaults</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Default Platform</label>
              <select className="input" value={form["default_platform"] || "tiktok"} onChange={(e) => setForm({ ...form, "default_platform": e.target.value })}>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Default Campaign</label>
              <input className="input" value={form["default_campaign"] || ""} onChange={(e) => setForm({ ...form, "default_campaign": e.target.value })} placeholder="e.g. Insforge" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saveAllConfig.isPending} className="btn btn-primary">
            {saveAllConfig.isPending ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-[11px] text-[var(--accent)]">Saved</span>}
        </div>
      </form>

      <div className="card card-pad">
        <h3 className="mb-3">Account</h3>
        <button onClick={handleLogout} className="btn btn-secondary">
          Sign Out
        </button>
      </div>
    </div>
  );
}
