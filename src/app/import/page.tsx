"use client";
import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ Import complete! ${data.videos} videos, ${data.campaigns} campaigns, ${data.finance?.totalIncome?.toLocaleString()} IDR income loaded.`);
      } else {
        setMsg(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMsg(`❌ Upload failed: ${err}`);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Import Spreadsheet</h1>
        <p className="text-xs text-[#666] mt-1">Upload your UGC_Engine v1.0 xlsx — all Video, Account, and Finance data will be imported into the CRM.</p>
      </div>

      <form onSubmit={handleUpload} className="bg-[#111118] border border-[#1e1e2e] rounded p-6 space-y-4">
        <div>
          <label className="text-xs text-[#888] block mb-2">Select .xlsx file</label>
          <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-white" />
        </div>
        <button disabled={!file || loading} type="submit" className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-6 py-2 rounded disabled:opacity-30">
          {loading ? "Importing..." : "Run Import"}
        </button>
        {msg && <p className="text-xs mt-2 text-[#00FF88]">{msg}</p>}
      </form>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-2">What gets imported</h3>
        <ul className="text-xs text-[#666] space-y-1">
          <li>✅ <span className="text-white">Videos</span> — title, file name, campaign, posted date, status</li>
          <li>✅ <span className="text-white">Campaigns</span> — auto-created from Account sheet</li>
          <li>✅ <span className="text-white">Finance totals</span> — income, expense from Finance sheet</li>
          <li>⚠️ <span className="text-[#FFD700]">Performance data</span> — not in spreadsheet, must be added manually per video</li>
          <li>⚠️ <span className="text-[#FFD700]">AI tags</span> — will be generated after 5+ videos have performance data</li>
        </ul>
      </div>
    </div>
  );
}
