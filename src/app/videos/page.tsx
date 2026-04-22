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
        <h1 className="text-xl font-bold">Videos</h1>
        <div className="flex gap-2 items-center">
          <select className="bg-[#111118] border border-[#2a2a3e] text-xs text-[#888] px-3 py-1.5 rounded" value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-1.5 rounded hover:bg-[#00cc6e] transition-colors">
            + Add Video
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#111118] border border-[#00FF88] rounded p-4">
          <h3 className="text-sm font-bold mb-3">Add New Video</h3>
          <form onSubmit={submit} className="grid grid-cols-3 gap-3">
            <input required placeholder="Title" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.campaignId || ""} onChange={(e) => setForm({ ...form, campaignId: e.target.value })}>
              <option value="">Select Campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
            </select>
            <input placeholder="Platform (tiktok/youtube)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.platform || ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
            <input type="date" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.postedAt || ""} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} />
            <select className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.status || "posted"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <input type="number" placeholder="Views" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.views || ""} onChange={(e) => setForm({ ...form, views: e.target.value })} />
            <input type="number" step="0.01" placeholder="Earnings (USD)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.earnings || ""} onChange={(e) => setForm({ ...form, earnings: e.target.value })} />
            <input placeholder="Hook Type (curiosity/shock/story)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.hookType || ""} onChange={(e) => setForm({ ...form, hookType: e.target.value })} />
            <input placeholder="Niche (tech/lifestyle/gaming)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.niche || ""} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            <input placeholder="Format (review/howto/storytime)" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white" value={form.format || ""} onChange={(e) => setForm({ ...form, format: e.target.value })} />
            <input placeholder="Notes" className="bg-[#0a0a0f] border border-[#2a2a3e] text-xs p-2 rounded text-white col-span-3" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="bg-[#00FF88] text-[#0a0a0f] text-xs font-bold px-4 py-2 rounded">Save Video</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-[#222] text-xs px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e2e] text-[#666]">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Campaign</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Posted</th>
              <th className="text-right p-3">Views</th>
              <th className="text-right p-3">Likes</th>
              <th className="text-right p-3">Earnings</th>
              <th className="text-left p-3">Tags</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e]">
                <td className="p-3 text-white max-w-[200px] truncate">{(v as Record<string, unknown>)["title"] as string}</td>
                <td className="p-3 text-[#888]">{v.campaign?.brandName || "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    v.status === "posted" ? "bg-[#003322] text-[#00FF88]" :
                    v.status === "in_review" ? "bg-[#002233] text-[#00BFFF]" :
                    v.status === "not_accepted" || v.status === "cancelled" ? "bg-[#330011] text-[#FF6B6B]" :
                    "bg-[#222] text-[#888]"
                  }`}>{v.status.toUpperCase()}</span>
                </td>
                <td className="p-3 text-[#666]">{v.postedAt || "—"}</td>
                <td className="p-3 text-right text-[#888]">{(v as Record<string, unknown>)["views"] as number}</td>
                <td className="p-3 text-right text-[#888]">{(v as Record<string, unknown>)["likes"] as number}</td>
                <td className="p-3 text-right text-[#00FF88]">${(v as Record<string, unknown>)["earnings"] as number}</td>
                <td className="p-3 text-[#555] text-[10px]">
                  {[
                    (v as Record<string, unknown>)["hookType"] as string,
                    (v as Record<string, unknown>)["niche"] as string,
                    (v as Record<string, unknown>)["format"] as string,
                  ].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => del(v.id)} className="text-[#FF6B6B] hover:text-[#FF4444] text-xs">✕</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-[#444]">No videos found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
