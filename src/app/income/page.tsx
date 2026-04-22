"use client";
import { useEffect, useState } from "react";

type ConfigMap = Record<string, string>;
type Video = { id: string; title: string; earnings: number; status: string };

export default function IncomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [config, setConfig] = useState<ConfigMap>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
    fetch("/api/config").then((r) => r.json()).then(setConfig);
  }, []);

  const rate = parseFloat(config["usd_idr_rate"] || "17000");
  const editorRate = parseFloat(config["editor_rate"] || "0.20");

  const videosWithEarnings = videos.filter((v) => v.earnings > 0 && v.status === "posted");

  const grossUsd = videosWithEarnings.reduce((s, v) => s + v.earnings, 0);
  const editorCut = grossUsd * editorRate;
  const netUsd = grossUsd - editorCut;
  const grossIdr = grossUsd * rate;
  const opsCosts = grossIdr * 0.05; // ~5% food/coffee buffer
  const netIdr = netUsd * rate - opsCosts;

  // Add from config totals
  const configIncome = parseFloat(config["total_income_idr"] || "0");
  const configExpense = parseFloat(config["total_expense_idr"] || "0");

  const fmtIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  async function saveConfig(key: string, value: string) {
    await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    for (const [key, value] of Object.entries(form)) {
      await saveConfig(key, value);
    }
    const updated = await fetch("/api/config").then((r) => r.json());
    setConfig(updated);
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Income Tracker</h1>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Gross (USD)</p>
          <p className="text-2xl font-bold text-[#00FF88]">${grossUsd.toFixed(2)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Editor Cut 20% (USD)</p>
          <p className="text-2xl font-bold text-[#FFD700]">-${editorCut.toFixed(2)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Net (USD)</p>
          <p className="text-2xl font-bold text-[#00BFFF]">${netUsd.toFixed(2)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Net (IDR)</p>
          <p className="text-lg font-bold text-[#00FF88]">{fmtIdr(netIdr)}</p>
        </div>
      </div>

      {/* Imported finance totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Imported Income (IDR)</p>
          <p className="text-xl font-bold text-[#00FF88]">{fmtIdr(configIncome)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Imported Expense (IDR)</p>
          <p className="text-xl font-bold text-[#FF6B6B]">{fmtIdr(configExpense)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Imported Net Profit (IDR)</p>
          <p className="text-xl font-bold text-[#00BFFF]">{fmtIdr(configIncome - configExpense)}</p>
        </div>
      </div>

      {/* Ops cost config */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-3">Configuration</h3>
        <form onSubmit={handleSave} className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[#666] block mb-1">USD → IDR Rate</label>
            <input type="number" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form.usd_idr_rate || config["usd_idr_rate"] || "17000"} onChange={(e) => setForm({ ...form, usd_idr_rate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-1">Editor Rate (%)</label>
            <input type="number" step="0.01" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white w-full" value={form.editor_rate || config["editor_rate"] || "0.20"} onChange={(e) => setForm({ ...form, editor_rate: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-2 rounded disabled:opacity-30">{saving ? "Saving..." : "Save Config"}</button>
          </div>
        </form>
      </div>

      {/* Per-video breakdown */}
      <div>
        <h3 className="text-sm font-bold text-[#888] mb-3">Video Earnings Breakdown</h3>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-[#666]">
                <th className="text-left p-3">Title</th>
                <th className="text-right p-3">Gross (USD)</th>
                <th className="text-right p-3">Editor -20%</th>
                <th className="text-right p-3">Net (USD)</th>
                <th className="text-right p-3">Net (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {videosWithEarnings.map((v) => {
                const g = v.earnings;
                const e = g * editorRate;
                const n = g - e;
                return (
                  <tr key={v.id} className="border-b border-[#1a1a2e]">
                    <td className="p-3 text-white max-w-xs truncate">{(v as Record<string, unknown>)["title"] as string}</td>
                    <td className="p-3 text-right text-[#00FF88]">${g.toFixed(2)}</td>
                    <td className="p-3 text-right text-[#FFD700]">-${e.toFixed(2)}</td>
                    <td className="p-3 text-right text-[#00BFFF]">${n.toFixed(2)}</td>
                    <td className="p-3 text-right text-[#888]">{fmtIdr(n * rate)}</td>
                  </tr>
                );
              })}
              {videosWithEarnings.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[#444]">No videos with earnings yet. Add earnings to videos in the Videos page.</td></tr>}
            </tbody>
            {videosWithEarnings.length > 0 && (
              <tfoot>
                <tr className="border-t border-[#2a2a3e] font-bold">
                  <td className="p-3 text-white">TOTAL</td>
                  <td className="p-3 text-right text-[#00FF88]">${grossUsd.toFixed(2)}</td>
                  <td className="p-3 text-right text-[#FFD700]">-${editorCut.toFixed(2)}</td>
                  <td className="p-3 text-right text-[#00BFFF]">${netUsd.toFixed(2)}</td>
                  <td className="p-3 text-right text-[#888]">{fmtIdr(netUsd * rate)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
