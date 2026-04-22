"use client";
import { useEffect, useState } from "react";

type Campaign = { id?: string; brandName: string; platform: string; rateType: string; rateAmount: number; status: string; notes: string; _count?: { videos: number } };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then(setCampaigns);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? "/api/campaigns" : "/api/campaigns";
    const body = editId ? { id: editId, ...form } : form;
    fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json())
      .then((c) => {
        if (editId) {
          setCampaigns((prev) => prev.map((x) => (x.id === editId ? c : x)));
          setEditId(null);
        } else {
          setCampaigns((prev) => [c, ...prev]);
        }
        setShowAdd(false);
        setForm({});
      });
  }

  function del(id: string) {
    if (!confirm("Delete campaign + all its videos?")) return;
    fetch(`/api/campaigns?id=${id}`, { method: "DELETE" }).then(() => setCampaigns((prev) => prev.filter((c) => c.id !== id)));
  }

  function startEdit(c: Campaign) {
    setForm({ brandName: c.brandName, platform: c.platform, rateType: c.rateType, rateAmount: String(c.rateAmount), status: c.status, notes: c.notes || "" });
    setEditId(c.id ?? null);
    setShowAdd(true);
  }

  const platforms = ["tiktok", "youtube", "both"];
  const statuses = ["active", "paused", "completed", "negotiating"];
  const rateTypes = ["fixed", "fixed_plus_views", "rev_share"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Campaigns</h1>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm({}); }} className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-1.5 rounded hover:bg-[#00cc6e]">
          + Add Campaign
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#111118] border border-[#00FF88] rounded p-4">
          <h3 className="text-sm font-bold mb-3">{editId ? "Edit Campaign" : "Add Campaign"}</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <input required placeholder="Brand Name" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.brandName || ""} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
            <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.platform || "both"} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              {platforms.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.rateType || "fixed"} onChange={(e) => setForm({ ...form, rateType: e.target.value })}>
              {rateTypes.map((r) => <option key={r} value={r}>{r.replace("_", " + ")}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Rate (USD)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.rateAmount || ""} onChange={(e) => setForm({ ...form, rateAmount: e.target.value })} />
            <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <input placeholder="Notes (optional)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white col-span-2" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-2 rounded">Save</button>
              <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="bg-[#222] text-xs px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-[#111118] border border-[#1e1e2e] rounded p-4 hover:border-[#00FF88] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{c.brandName}</h3>
                <p className="text-xs text-[#666] mt-0.5">${c.rateAmount}/{c.rateType.replace("_", "+")} · {c.platform.toUpperCase()}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                c.status === "active" ? "bg-[#003322] text-[#00FF88]" :
                c.status === "negotiating" ? "bg-[#002233] text-[#00BFFF]" :
                c.status === "paused" ? "bg-[#333] text-[#888]" :
                "bg-[#330011] text-[#FF6B6B]"
              }`}>{c.status.toUpperCase()}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[#555]">{c._count?.videos || 0} videos</p>
              <div className="flex gap-2">
                <button onClick={() => startEdit(c)} className="text-[#555] hover:text-[#00FF88] text-xs">Edit</button>
                <button onClick={() => del(c.id!)} className="text-[#555] hover:text-[#FF6B6B] text-xs">Del</button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && <div className="col-span-3 text-center text-[#444] py-8">No campaigns yet</div>}
      </div>
    </div>
  );
}
