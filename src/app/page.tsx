"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const fmtIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const cards = [
    { label: "Campaigns", value: data["campaigns"] as number, color: "#00FF88" },
    { label: "Videos Posted", value: data["videosPosted"] as number, color: "#00BFFF" },
    { label: "Total Videos Tracked", value: data["totalVideos"] as number, color: "#FF6B6B" },
    { label: "Total Earnings (USD)", value: `$${(data["totalEarningsUsd"] as number || 0).toFixed(0)}`, color: "#FFD700" },
  ];

  const financeCards = [
    { label: "Total Income (IDR)", value: fmtIdr(data["totalIncomeIdr"] as number), color: "#00FF88" },
    { label: "Total Expense (IDR)", value: fmtIdr(data["totalExpenseIdr"] as number), color: "#FF6B6B" },
    { label: "Net Profit (IDR)", value: fmtIdr(data["netProfitIdr"] as number), color: "#00BFFF" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-[#666] mt-0.5">UGC Creator Intelligence — {format(new Date(), "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
            <p className="text-xs text-[#666]">{c.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Finance cards */}
      <div className="grid grid-cols-3 gap-4">
        {financeCards.map((c) => (
          <div key={c.label} className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
            <p className="text-xs text-[#666]">{c.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Recent videos */}
      <div>
        <h2 className="text-sm font-bold text-[#888] mb-3">Recent Videos</h2>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-[#666]">
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Views</th>
                <th className="text-right p-3">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {((data["recentVideos"] as Array<Record<string, unknown>>) || []).map((v: Record<string, unknown>) => (
                <tr key={v["id"] as string} className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e]">
                  <td className="p-3 text-white max-w-xs truncate">{(v["title"] as string) || "—"}</td>
                  <td className="p-3 text-[#888]">{((v["campaign"] as Record<string, unknown>)?.["brandName"] as string) || "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      v["status"] === "posted" ? "bg-[#003322] text-[#00FF88]" :
                      v["status"] === "in_review" ? "bg-[#003322] text-[#FFD700]" :
                      "bg-[#330011] text-[#FF6B6B]"
                    }`}>{String(v["status"] || "").toUpperCase()}</span>
                  </td>
                  <td className="p-3 text-right text-[#888]">{(v["views"] as number)?.toLocaleString() || "0"}</td>
                  <td className="p-3 text-right text-[#00FF88]">${(v["earnings"] as number)?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}
              {((data["recentVideos"] as Array<unknown>) || []).length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-[#444]">No videos yet. Import your spreadsheet or add videos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
