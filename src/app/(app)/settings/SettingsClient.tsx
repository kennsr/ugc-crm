'use client';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from "react";

type ConfigMap = Record<string, string>;

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export default function SettingsClient({ supabaseUrl, supabaseAnonKey }: Props) {
  const [config, setConfig] = useState<ConfigMap>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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

      <form onSubmit={handleSave} className="space-y-4">
        <div className="card card-pad space-y-4">
          <h3>Currency & Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">USD → IDR Exchange Rate</label>
              <input type="number" className="input" value={form["usd_idr_rate"] || "17000"} onChange={(e) => setForm({ ...form, "usd_idr_rate": e.target.value })} />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[11px] block mb-1">Editor Rate (%)</label>
              <input type="number" step="0.01" className="input" value={form["editor_rate"] || "0.20"} onChange={(e) => setForm({ ...form, "editor_rate": e.target.value })} />
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
        <h3 className="mb-2">Account</h3>
        <button
          onClick={handleLogout}
          className="btn text-[var(--danger)] border-[var(--danger)]"
        >
          Sign Out
        </button>
      </div>

      <div className="card card-pad">
        <h3 className="mb-2">System Info</h3>
        <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
          <li>Database: Supabase (PostgreSQL)</li>
          <li>Host: Vercel</li>
          <li>Build: April 23, 2026</li>
          <li>Channel: Telegram</li>
        </ul>
      </div>
    </div>
  );
}
