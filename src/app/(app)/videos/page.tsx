"use client";
import { useEffect, useState } from "react";

type Campaign = { id: string; brandName: string; platform: string; rateAmount: number; status: string };
type Video = { id: string; title: string; campaign?: Campaign; status: string; postedAt?: string; views: number; earnings: number; campaignId?: string };

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
    fetch("/api/campaigns").then((r) => r.json()).then(setCampaigns);
  }, []);

  const filtered = filterCampaign ? videos.filter((v) => v.campaignId === filterCampaign) : videos;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      .then((r) => r.json())
      .then((v) => { setVideos((prev) => [v, ...prev]); setShowAdd(false); setForm({}); });
  }

  function del(id: string) {
    if (!confirm("Delete this video?")) return;
    fetch(`/api/videos?id=${id}`, { method: "DELETE" }).then(() => setVideos((prev) => prev.filter((v) => v.id !== id)));
  }

  const statuses = ["posted", "in_review", "not_accepted", "cancelled", "draft"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1>Videos</h1>
        <div className="flex gap-3 items-center">
          <select className="input w-40" value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            + Add Video
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card border-[var(--accent)] card-pad">
          <h3 className="mb-3">Add New Video</h3>
          <form onSubmit={submit} className="grid grid-cols-3 gap-3">
            <input required placeholder="Title" className="input" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="input" value={form.campaignId || ""} onChange={(e) => setForm({ ...form, campaignId: e.target.value })}>
              <option value="">Select Campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
            </select>
            <input placeholder="Platform (tiktok/youtube)" className="input" value={form.platform || ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
            <input type="date" className="input" value={form.postedAt || ""} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} />
            <select className="input" value={form.status || "posted"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <input type="number" placeholder="Views" className="input" value={form.views || ""} onChange={(e) => setForm({ ...form, views: e.target.value })} />
            <input type="number" step="0.01" placeholder="Earnings (USD)" className="input" value={form.earnings || ""} onChange={(e) => setForm({ ...form, earnings: e.target.value })} />
            <input placeholder="Hook Type" className="input" value={form.hookType || ""} onChange={(e) => setForm({ ...form, hookType: e.target.value })} />
            <input placeholder="Niche" className="input" value={form.niche || ""} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            <input placeholder="Format" className="input" value={form.format || ""} onChange={(e) => setForm({ ...form, format: e.target.value })} />
            <input placeholder="Notes" className="input col-span-3" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="btn btn-primary">Save Video</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Posted</th>
              <th className="text-right">Views</th>
              <th className="text-right">Likes</th>
              <th className="text-right">Earnings</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td className="max-w-[200px] truncate">{(v as Record<string, unknown>)["title"] as string}</td>
                <td className="text-[var(--text-secondary)]">{v.campaign?.brandName || "—"}</td>
                <td>
                  <span className={`badge ${
                    v.status === "posted" ? "badge-success" :
                    v.status === "in_review" ? "badge-warning" :
                    v.status === "not_accepted" || v.status === "cancelled" ? "badge-danger" :
                    "badge-neutral"
                  }`}>{v.status.toUpperCase()}</span>
                </td>
                <td className="text-[var(--text-muted)]">{v.postedAt || "—"}</td>
                <td className="text-right text-[var(--text-secondary)]">{(v as Record<string, unknown>)["views"] as number}</td>
                <td className="text-right text-[var(--text-secondary)]">{(v as Record<string, unknown>)["likes"] as number}</td>
                <td className="text-right">${(v as Record<string, unknown>)["earnings"] as number}</td>
                <td className="text-[var(--text-muted)] text-[10px]">
                  {[
                    (v as Record<string, unknown>)["hookType"] as string,
                    (v as Record<string, unknown>)["niche"] as string,
                    (v as Record<string, unknown>)["format"] as string,
                  ].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="text-right">
                  <button onClick={() => del(v.id)} className="btn btn-ghost text-[var(--danger)] text-[11px]">Del</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="card-pad text-center text-[var(--text-muted)]">No videos found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
