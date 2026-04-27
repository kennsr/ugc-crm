"use client";
import { useState } from "react";
import { fmtIdr } from "@/lib/currency";
import { DEFAULT_USD_IDR_RATE, DEFAULT_EDITOR_RATE, DEFAULT_OPS_COST_RATIO } from "@/lib/const/default";
import { useVideos } from "@/lib/queries/videos";
import { useConfig, useSaveAllConfig } from "@/lib/queries/config";

export default function IncomePage() {
  const { data: videos = [] } = useVideos();
  const { data: config = {} } = useConfig();
  const saveAllConfig = useSaveAllConfig();

  const [form, setForm] = useState<Record<string, string>>({});

  const rate = parseFloat(config["usd_idr_rate"]) || DEFAULT_USD_IDR_RATE;
  const editorRate = parseFloat(config["editor_rate"]) || DEFAULT_EDITOR_RATE;

  const videosWithEarnings = videos.filter((v) => v.earnings > 0 && v.status === "posted");

  const grossUsd = videosWithEarnings.reduce((s, v) => s + v.earnings, 0);
  const editorCut = grossUsd * editorRate;
  const netUsd = grossUsd - editorCut;
  const grossIdr = grossUsd * rate;
  const opsCosts = grossIdr * DEFAULT_OPS_COST_RATIO;
  const netIdr = netUsd * rate - opsCosts;

  const configIncome = parseFloat(config["total_income_idr"] || "0");
  const configExpense = parseFloat(config["total_expense_idr"] || "0");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const merged = { ...config, ...form };
    saveAllConfig.mutate(merged);
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
            <input
              type="number"
              className="input"
              value={form.usd_idr_rate ?? config["usd_idr_rate"] ?? DEFAULT_USD_IDR_RATE}
              onChange={(e) => setForm({ ...form, usd_idr_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[var(--text-muted)] text-[11px] block mb-1">Editor Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.editor_rate ?? config["editor_rate"] ?? DEFAULT_EDITOR_RATE}
              onChange={(e) => setForm({ ...form, editor_rate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saveAllConfig.isPending} className="btn btn-primary">
              {saveAllConfig.isPending ? "Saving..." : "Save Config"}
            </button>
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
                    <td className="max-w-xs truncate">{(v as unknown as Record<string, unknown>)["title"] as string}</td>
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
