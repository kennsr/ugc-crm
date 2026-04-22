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
  const opsCosts = grossIdr * 0.05;
  const netIdr = netUsd * rate - opsCosts;

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
      <h1>Income Tracker</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="label">Gross (USD)</p>
          <p className="value">${grossUsd.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Editor Cut 20%</p>
          <p className="value">-${editorCut.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Net (USD)</p>
          <p className="value">${netUsd.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Net (IDR)</p>
          <p className="value">{fmtIdr(netIdr)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="label">Imported Income (IDR)</p>
          <p className="value">{fmtIdr(configIncome)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Imported Expense (IDR)</p>
          <p className="value">{fmtIdr(configExpense)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Imported Net Profit</p>
          <p className="value">{fmtIdr(configIncome - configExpense)}</p>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="mb-3">Configuration</h3>
        <form onSubmit={handleSave} className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[var(--text-muted)] text-[11px] block mb-1">USD → IDR Rate</label>
            <input type="number" className="input" value={form.usd_idr_rate || config["usd_idr_rate"] || "17000"} onChange={(e) => setForm({ ...form, usd_idr_rate: e.target.value })} />
          </div>
          <div>
            <label className="text-[var(--text-muted)] text-[11px] block mb-1">Editor Rate (%)</label>
            <input type="number" step="0.01" className="input" value={form.editor_rate || config["editor_rate"] || "0.20"} onChange={(e) => setForm({ ...form, editor_rate: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? "Saving..." : "Save Config"}</button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="mb-3">Video Earnings Breakdown</h3>
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="text-right">Gross (USD)</th>
                <th className="text-right">Editor -20%</th>
                <th className="text-right">Net (USD)</th>
                <th className="text-right">Net (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {videosWithEarnings.map((v) => {
                const g = v.earnings;
                const e = g * editorRate;
                const n = g - e;
                return (
                  <tr key={v.id}>
                    <td className="max-w-xs truncate">{(v as Record<string, unknown>)["title"] as string}</td>
                    <td className="text-right">${g.toFixed(2)}</td>
                    <td className="text-right">-${e.toFixed(2)}</td>
                    <td className="text-right">${n.toFixed(2)}</td>
                    <td className="text-right text-[var(--text-secondary)]">{fmtIdr(n * rate)}</td>
                  </tr>
                );
              })}
              {videosWithEarnings.length === 0 && <tr><td colSpan={5} className="card-pad text-center text-[var(--text-muted)]">No videos with earnings yet.</td></tr>}
            </tbody>
            {videosWithEarnings.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td>TOTAL</td>
                  <td className="text-right">${grossUsd.toFixed(2)}</td>
                  <td className="text-right">-${editorCut.toFixed(2)}</td>
                  <td className="text-right">${netUsd.toFixed(2)}</td>
                  <td className="text-right text-[var(--text-secondary)]">{fmtIdr(netUsd * rate)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
