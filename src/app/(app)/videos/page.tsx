"use client";
import { useEffect, useState } from "react";
import { VIDEO_STATUSES, statusKey, statusLabel, videoBadgeClass } from "@/lib/status";
import { formatDate } from "@/lib/dates";
import { DEFAULT_VIDEO_PAY_RATE } from "@/lib/const/default";

type Campaign = { id: string; brandName: string; platform: string; rateAmount: number; status: string };
type Video = {
  id: string;
  name: string;
  fileName?: string | null;
  extension?: string | null;
  campaign?: Campaign;
  status: string;
  uploadedAt?: string | null;
  views: number;
  likes: number;
  earnings: number;
  campaignId?: string;
  hookType?: string | null;
  niche?: string | null;
  format?: string | null;
  notes?: string | null;
};

function VideoTableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ext</th>
            <th>Campaign</th>
            <th>Status</th>
            <th>Uploaded</th>
            <th className="text-right">Views</th>
            <th className="text-right">Earnings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton h-4 w-40" /></td>
              <td><div className="skeleton h-4 w-8" /></td>
              <td><div className="skeleton h-4 w-24" /></td>
              <td><div className="skeleton h-5 w-20" /></td>
              <td><div className="skeleton h-4 w-20" /></td>
              <td><div className="skeleton h-4 w-12 ml-auto" /></td>
              <td><div className="skeleton h-4 w-12 ml-auto" /></td>
              <td><div className="skeleton h-4 w-8 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type EditForm = {
  name: string;
  extension: string;
  status: string;
  notes: string;
  views: string;
  likes: string;
  earnings: string;
  hookType: string;
  niche: string;
  format: string;
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", extension: "", status: "backlog", notes: "",
    views: "", likes: "", earnings: "", hookType: "", niche: "", format: "",
  });

  // Add form state
  const [addForm, setAddForm] = useState<Record<string, string>>({
    name: "", fileName: "", extension: "", campaignId: "",
    status: "backlog", notes: "", hookType: "", niche: "", format: "",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/videos").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()),
    ]).then(([videosData, campaignsData]) => {
      setVideos(videosData);
      setCampaigns(campaignsData);
      setLoading(false);
    });
  }, []);

  const filtered = filterCampaign ? videos.filter((v) => v.campaignId === filterCampaign) : videos;

  function openEdit(v: Video) {
    setEditingId(v.id);
    setEditForm({
      name: v.name ?? "",
      extension: v.extension ?? "",
      status: v.status ?? "backlog",
      notes: v.notes ?? "",
      views: String(v.views ?? ""),
      likes: String(v.likes ?? ""),
      earnings: String(v.earnings ?? DEFAULT_VIDEO_PAY_RATE),
      hookType: v.hookType ?? "",
      niche: v.niche ?? "",
      format: v.format ?? "",
    });
  }

  function saveEdit(id: string) {
    fetch("/api/videos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editForm.name,
        extension: editForm.extension || null,
        status: editForm.status,
        notes: editForm.notes || null,
        views: Number(editForm.views) || 0,
        likes: Number(editForm.likes) || 0,
        earnings: parseFloat(editForm.earnings) || DEFAULT_VIDEO_PAY_RATE,
        hookType: editForm.hookType || null,
        niche: editForm.niche || null,
        format: editForm.format || null,
      }),
    }).then((r) => r.json()).then((updated) => {
      setVideos((prev) => prev.map((v) => v.id === updated.id ? updated : v));
      setEditingId(null);
    });
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name || addForm.fileName || "Untitled",
        fileName: addForm.fileName || null,
        extension: addForm.extension || null,
        campaignId: addForm.campaignId || null,
        status: addForm.status || "backlog",
        notes: addForm.notes || null,
        hookType: addForm.hookType || null,
        niche: addForm.niche || null,
        format: addForm.format || null,
      }),
    }).then((r) => r.json()).then((v) => {
      setVideos((prev) => [v, ...prev]);
      setShowAdd(false);
      setAddForm({ name: "", fileName: "", extension: "", campaignId: "", status: "backlog", notes: "", hookType: "", niche: "", format: "" });
    });
  }

  function del(id: string) {
    if (!confirm("Delete this video?")) return;
    fetch(`/api/videos?id=${id}`, { method: "DELETE" }).then(() => setVideos((prev) => prev.filter((v) => v.id !== id)));
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1>Videos</h1>
        <div className="flex gap-3 items-center">
          <select className="input w-40" value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">+ Add Video</button>
        </div>
      </div>

      {showAdd && (
        <div className="card border-[var(--accent)] card-pad">
          <h3 className="mb-3">Add New Video</h3>
          <form onSubmit={submitAdd} className="grid grid-cols-3 gap-3">
            <input placeholder="Name" className="input" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            <input placeholder="File name (immutable)" className="input" value={addForm.fileName} onChange={(e) => setAddForm({ ...addForm, fileName: e.target.value })} />
            <input placeholder="Extension (e.g. mp4)" className="input" value={addForm.extension} onChange={(e) => setAddForm({ ...addForm, extension: e.target.value })} />
            <select className="input" value={addForm.campaignId} onChange={(e) => setAddForm({ ...addForm, campaignId: e.target.value })}>
              <option value="">Select Campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
            </select>
            <select className="input" value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}>
              {VIDEO_STATUSES.map((s) => <option key={s} value={statusKey(s)}>{s}</option>)}
            </select>
            <input placeholder="Hook Type" className="input" value={addForm.hookType} onChange={(e) => setAddForm({ ...addForm, hookType: e.target.value })} />
            <input placeholder="Niche" className="input" value={addForm.niche} onChange={(e) => setAddForm({ ...addForm, niche: e.target.value })} />
            <input placeholder="Format" className="input" value={addForm.format} onChange={(e) => setAddForm({ ...addForm, format: e.target.value })} />
            <input placeholder="Notes" className="input col-span-3" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} />
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="btn btn-primary">Save Video</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <VideoTableSkeleton />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Ext</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th className="text-right">Views</th>
                <th className="text-right">Earnings</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <>
                  <tr key={v.id} className={editingId === v.id ? "bg-[var(--accent)]/5" : ""}>
                    <td className="max-w-[200px] truncate" title={v.fileName ?? undefined}>
                      {editingId === v.id ? (
                        <input
                          className="input w-full text-sm py-1"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Name"
                        />
                      ) : (
                        <div className="truncate">{v.name || v.fileName || "—"}</div>
                      )}
                    </td>
                    <td>
                      {editingId === v.id ? (
                        <input
                          className="input w-16 text-sm py-1 uppercase"
                          value={editForm.extension}
                          onChange={(e) => setEditForm({ ...editForm, extension: e.target.value })}
                          placeholder="ext"
                        />
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs uppercase">{v.extension || "—"}</span>
                      )}
                    </td>
                    <td className="text-[var(--text-secondary)] text-sm">{v.campaign?.brandName || "—"}</td>
                    <td>
                      {editingId === v.id ? (
                        <select
                          className="input w-full text-sm py-1"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          {VIDEO_STATUSES.map((s) => (
                            <option key={s} value={statusKey(s)}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${videoBadgeClass(v.status)}`}>{statusLabel(v.status)}</span>
                      )}
                    </td>
                    <td className="text-[var(--text-muted)] text-xs">{formatDate(v.uploadedAt)}</td>
                    <td>
                      {editingId === v.id ? (
                        <input
                          type="number"
                          className="input w-20 text-sm py-1 text-right"
                          value={editForm.views}
                          onChange={(e) => setEditForm({ ...editForm, views: e.target.value })}
                        />
                      ) : (
                        <span className="text-right text-[var(--text-secondary)] text-sm">{v.views.toLocaleString()}</span>
                      )}
                    </td>
                    <td>
                      {editingId === v.id ? (
                        <input
                          type="number"
                          step="0.01"
                          className="input w-24 text-sm py-1 text-right"
                          value={editForm.earnings}
                          onChange={(e) => setEditForm({ ...editForm, earnings: e.target.value })}
                        />
                      ) : (
                        <span className="text-right text-sm">${v.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    <td className="text-right">
                      {editingId === v.id ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(v.id)} className="btn btn-primary text-[11px] py-1 px-2">Save</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-secondary text-[11px] py-1 px-2">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(v)} className="btn btn-ghost text-[var(--accent)] text-[11px]">Edit</button>
                          <button onClick={() => del(v.id)} className="btn btn-ghost text-[var(--danger)] text-[11px]">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {editingId === v.id && (
                    <tr key={`${v.id}-edit`} className="bg-[var(--accent)]/3">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="grid grid-cols-6 gap-3">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Hook Type</label>
                            <input className="input text-sm py-1" value={editForm.hookType} onChange={(e) => setEditForm({ ...editForm, hookType: e.target.value })} placeholder="Hook Type" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Niche</label>
                            <input className="input text-sm py-1" value={editForm.niche} onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })} placeholder="Niche" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Format</label>
                            <input className="input text-sm py-1" value={editForm.format} onChange={(e) => setEditForm({ ...editForm, format: e.target.value })} placeholder="Format" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Likes</label>
                            <input type="number" className="input text-sm py-1" value={editForm.likes} onChange={(e) => setEditForm({ ...editForm, likes: e.target.value })} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Notes</label>
                            <input className="input text-sm py-1" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                          </div>
                        </div>
                        {v.fileName && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono">
                            File: {v.fileName}
                          </p>
                        )}
                        {editForm.status === "posted" && (
                          <p className="text-[10px] text-[var(--accent)] mt-1">Setting status to Posted will set the uploaded date to today.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="card-pad text-center text-[var(--text-muted)]">No videos found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
