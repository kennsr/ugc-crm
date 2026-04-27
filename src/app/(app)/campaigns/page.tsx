"use client";
import { useEffect, useState } from "react";
import { CardSkeleton } from "@/components/LoadingSkeleton";

type Campaign = { id?: string; brandName: string; platform: string; rateType: string; rateAmount: number; status: string; notes: string; _count?: { videos: number } };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then((data) => {
      setCampaigns(data);
      setLoading(false);
    });
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
        <h1>Campaigns</h1>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm({}); }} className="btn btn-primary">
          + Add Campaign
        </button>
      </div>

      {showAdd && (
        <div className="card border-[var(--accent)] card-pad">
          <h3 className="mb-3">{editId ? "Edit Campaign" : "Add Campaign"}</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <input required placeholder="Brand Name" className="input" value={form.brandName || ""} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
            <select className="input" value={form.platform || "both"} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              {platforms.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <select className="input" value={form.rateType || "fixed"} onChange={(e) => setForm({ ...form, rateType: e.target.value })}>
              {rateTypes.map((r) => <option key={r} value={r}>{r.replace("_", " + ")}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Rate (USD)" className="input" value={form.rateAmount || ""} onChange={(e) => setForm({ ...form, rateAmount: e.target.value })} />
            <select className="input" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <input placeholder="Notes (optional)" className="input col-span-2" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="card card-pad hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[var(--text-primary)]">{c.brandName}</h3>
                  <p className="text-[var(--text-muted)] text-[10px] mt-0.5">${c.rateAmount}/{c.rateType.replace("_", "+")} · {c.platform.toUpperCase()}</p>
                </div>
                <span className={`badge ${
                  c.status === "active" ? "badge-success" :
                  c.status === "negotiating" ? "badge-warning" :
                  c.status === "paused" ? "badge-neutral" :
                  "badge-danger"
                }`}>{c.status.toUpperCase()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[var(--text-muted)] text-[11px]">{c._count?.videos || 0} videos</p>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(c)} className="btn btn-ghost text-[11px]">Edit</button>
                  <button onClick={() => del(c.id!)} className="btn btn-ghost text-[11px] text-[var(--danger)]">Del</button>
                </div>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <div className="col-span-3 text-center text-[var(--text-muted)] py-8">No campaigns yet</div>}
        </div>
      )}
    </div>
  );
}
