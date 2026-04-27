'use client';
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase';
import { DEFAULT_USD_IDR_RATE, DEFAULT_EDITOR_RATE } from '@/lib/const/default';

type ConfigMap = Record<string, string>;

const DriveConnect = dynamic(() => import('@/components/DriveConnect'), { ssr: false });

export default function SettingsClient() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((c) => {
      setConfig(c);
      setForm(c);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    for (const [key, value] of Object.entries(form)) {
      await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    }
    const updated = await fetch("/api/config").then((r) => r.json());
    setConfig(updated);
    setForm(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1>Settings</h1>

      <DriveConnect />

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
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save Settings"}
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
