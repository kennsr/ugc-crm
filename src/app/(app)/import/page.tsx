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
        setMsg(`Import complete! ${data.videos} videos, ${data.campaigns} campaigns, ${data.finance?.totalIncome?.toLocaleString()} IDR income loaded.`);
      } else {
        setMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setMsg(`Upload failed: ${err}`);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1>Import Spreadsheet</h1>
        <p className="text-[var(--text-muted)] text-[11px] mt-1">Upload your UGC_Engine v1.0 xlsx — all Video, Account, and Finance data will be imported into the CRM.</p>
      </div>

      <form onSubmit={handleUpload} className="card card-pad space-y-4">
        <div>
          <label className="text-[var(--text-muted)] text-[11px] block mb-2">Select .xlsx file</label>
          <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[11px]" />
        </div>
        <button disabled={!file || loading} type="submit" className="btn btn-primary">
          {loading ? "Importing..." : "Run Import"}
        </button>
        {msg && <p className="text-[11px] mt-2">{msg}</p>}
      </form>

      <div className="card card-pad">
        <h3 className="mb-2">What gets imported</h3>
        <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
          <li>Videos — title, file name, campaign, posted date, status</li>
          <li>Campaigns — auto-created from Account sheet</li>
          <li>Finance totals — income, expense from Finance sheet</li>
          <li>Performance data — not in spreadsheet, must be added manually per video</li>
          <li>AI tags — will be generated after 5+ videos have performance data</li>
        </ul>
      </div>
    </div>
  );
}
