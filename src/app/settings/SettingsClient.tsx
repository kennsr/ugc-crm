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
      <h1 className="text-xl font-bold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4 space-y-4">
          <h3 className="text-sm font-bold">Currency & Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#666] block mb-1">USD → IDR Exchange Rate</label>
              <input type="number" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["usd_idr_rate"] || "17000"} onChange={(e) => setForm({ ...form, "usd_idr_rate": e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Editor Rate (%)</label>
              <input type="number" step="0.01" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["editor_rate"] || "0.20"} onChange={(e) => setForm({ ...form, "editor_rate": e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4 space-y-4">
          <h3 className="text-sm font-bold">Editor Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#666] block mb-1">Primary Editor</label>
              <input className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["editor_name"] || "Yefta"} onChange={(e) => setForm({ ...form, "editor_name": e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Editor Contact</label>
              <input className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["editor_contact"] || ""} onChange={(e) => setForm({ ...form, "editor_contact": e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4 space-y-4">
          <h3 className="text-sm font-bold">Content Defaults</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#666] block mb-1">Default Platform</label>
              <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["default_platform"] || "tiktok"} onChange={(e) => setForm({ ...form, "default_platform": e.target.value })}>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-1">Default Campaign</label>
              <input className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form["default_campaign"] || ""} onChange={(e) => setForm({ ...form, "default_campaign": e.target.value })} placeholder="e.g. Insforge" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-6 py-2 rounded disabled:opacity-30">
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-xs text-[#00FF88]">✅ Saved</span>}
        </div>
      </form>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-2">Account</h3>
        <button
          onClick={handleLogout}
          className="bg-[#1a0a0a] border border-[#3a1a1a] text-[#FF6B6B] text-xs px-4 py-2 rounded hover:bg-[#2a0a0a] transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-2">System Info</h3>
        <ul className="text-xs text-[#555] space-y-1">
          <li>Database: Supabase (PostgreSQL)</li>
          <li>Host: Vercel</li>
          <li>Build: April 22, 2026</li>
          <li>Channel: Telegram</li>
        </ul>
      </div>
    </div>
  );
}
