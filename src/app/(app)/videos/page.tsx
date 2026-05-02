"use client";
import { Fragment, useState } from "react";

function SortTh({ label, sortKey, currentKey, sortDir, onSort, align }: {
  label: string;
  sortKey: string;
  currentKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  align?: 'right';
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`text-[10px] uppercase tracking-wide text-[var(--text-muted)] cursor-pointer select-none hover:text-[var(--text-primary)] ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {active && <span className="text-[var(--accent)]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}
import { ExternalLink, Film } from "lucide-react";
import { VIDEO_STATUSES, statusKey, statusLabel, videoBadgeClass } from "@/lib/status";
import { formatDate } from "@/lib/dates";
import { DEFAULT_VIDEO_PAY_RATE } from "@/lib/const/default";
import { useVideos, useCreateVideo, useUpdateVideo, useDeleteVideo, Video } from "@/lib/queries/videos";
import { useDriveStatus } from "@/lib/queries/drive";
import { useCampaigns } from "@/lib/queries/campaigns";

type EditForm = {
  name: string;
  fileName: string;
  extension: string;
  campaignId: string;
  status: string;
  notes: string;
  inspo: string;
  views: string;
  likes: string;
  earnings: string;
  hookType: string;
  niche: string;
  format: string;
};

function VideoTableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>File</th>
            <th>Ext</th>
            <th>Campaign</th>
            <th>Inspo</th>
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
              <td><div className="skeleton h-8 w-12 rounded" /></td>
              <td><div className="skeleton h-4 w-40" /></td>
              <td><div className="skeleton h-4 w-32" /></td>
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

export default function VideosPage() {
  const { data: videos = [], isLoading } = useVideos();
  const { data: campaigns = [] } = useCampaigns();
  const { data: driveStatus } = useDriveStatus();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const [showAdd, setShowAdd] = useState(false);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', fileName: '', extension: 'mov', campaignId: '', status: 'backlog', notes: '', inspo: '',
    views: '', likes: '', earnings: '', hookType: '', niche: '', format: '',
  });

  const [addForm, setAddForm] = useState<Record<string, string>>({
    name: "", fileName: "", extension: "mov", campaignId: "",
    status: "backlog", notes: "", inspo: "", hookType: "", niche: "", format: "",
  });

  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function sortedVideos() {
    let list = filterCampaign ? videos.filter((v) => v.campaignId === filterCampaign) : [...videos];
    list.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;
      if (sortKey === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortKey === 'campaign') { aVal = a.campaign?.brandName ?? ''; bVal = b.campaign?.brandName ?? ''; }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status; }
      else if (sortKey === 'uploadedAt') { aVal = a.uploadedAt ?? ''; bVal = b.uploadedAt ?? ''; }
      else if (sortKey === 'views') { aVal = a.views; bVal = b.views; }
      else if (sortKey === 'earnings') { aVal = a.earnings; bVal = b.earnings; }
      else if (sortKey === 'createdAt') { aVal = (a as Record<string, unknown>).createdAt as string ?? ''; bVal = (b as Record<string, unknown>).createdAt as string ?? ''; }
      else { aVal = (a as Record<string, unknown>).createdAt as string ?? ''; bVal = (b as Record<string, unknown>).createdAt as string ?? ''; }
      if (aVal === bVal) return 0;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }

  const displayed = sortedVideos();

  function openEdit(v: Video) {
    setEditingId(v.id);
    setEditForm({
      name: v.name ?? "",
      fileName: v.fileName ?? "",
      extension: v.extension ?? "",
      campaignId: v.campaignId ?? "",
      status: v.status ?? "backlog",
      notes: v.notes ?? "",
      inspo: v.inspo ?? "",
      views: String(v.views ?? ""),
      likes: String(v.likes ?? ""),
      earnings: String(v.earnings ?? DEFAULT_VIDEO_PAY_RATE),
      hookType: v.hookType ?? "",
      niche: v.niche ?? "",
      format: v.format ?? "",
    });
  }

  function saveEdit(id: string) {
    updateVideo.mutate({
      id,
      name: editForm.name,
      fileName: editForm.fileName || null,
      extension: editForm.extension || null,
      campaignId: editForm.campaignId || null,
      status: editForm.status,
      notes: editForm.notes || null,
      inspo: editForm.inspo || null,
      views: Number(editForm.views) || 0,
      likes: Number(editForm.likes) || 0,
      earnings: parseFloat(editForm.earnings) || DEFAULT_VIDEO_PAY_RATE,
      hookType: editForm.hookType || null,
      niche: editForm.niche || null,
      format: editForm.format || null,
    }, { onSuccess: () => setEditingId(null) });
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    createVideo.mutate({
      name: addForm.name || addForm.fileName || "Untitled",
      fileName: addForm.fileName || null,
      extension: addForm.extension || null,
      campaignId: addForm.campaignId || null,
      status: addForm.status || "backlog",
      notes: addForm.notes || null,
      inspo: addForm.inspo || null,
      hookType: addForm.hookType || null,
      niche: addForm.niche || null,
      format: addForm.format || null,
    }, {
      onSuccess: () => {
        setShowAdd(false);
        setAddForm({ name: "", fileName: "", extension: "mov", campaignId: "", status: "backlog", notes: "", inspo: "", hookType: "", niche: "", format: "" });
      }
    });
  }

  function del(id: string) {
    if (!confirm("Delete this video?")) return;
    deleteVideo.mutate(id);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1>Videos</h1>
        <div className="flex gap-3 items-center">
          {driveStatus?.rootFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${driveStatus.rootFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost text-[var(--text-muted)] text-[11px]"
              style={{ whiteSpace: 'nowrap' }}
            >
              Open Drive
            </a>
          )}
          <select className="input w-40" value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)}>
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
          </select>
          <button onClick={() => setAddForm((prev) => { setShowAdd(true); return { ...prev, campaignId: filterCampaign || prev.campaignId }; })} className="btn btn-ghost text-[var(--accent)] text-[11px]" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
        </div>
      </div>

      {showAdd && (
        <div className="card border-[var(--accent)] card-pad">
          <h3 className="mb-3">Add New Video</h3>
          <form onSubmit={submitAdd} className="grid grid-cols-3 gap-3">
            <input placeholder="Name" className="input" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            <input placeholder="File name" className="input" value={addForm.fileName} onChange={(e) => setAddForm({ ...addForm, fileName: e.target.value })} />
            <input placeholder="Extension (e.g. mov)" className="input" value={addForm.extension} onChange={(e) => setAddForm({ ...addForm, extension: e.target.value })} />
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
            <input placeholder="Inspo link (e.g. https://tiktok.com/...)" className="input col-span-3" value={addForm.inspo} onChange={(e) => setAddForm({ ...addForm, inspo: e.target.value })} />
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={createVideo.isPending} className="btn btn-primary">
                {createVideo.isPending ? "Saving..." : "Save Video"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <VideoTableSkeleton />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12"></th>
                <SortTh label="Name" sortKey="name" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th>File</th>
                <th>Ext</th>
                <SortTh label="Campaign" sortKey="campaign" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Status" sortKey="status" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Uploaded" sortKey="uploadedAt" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Created" sortKey="createdAt" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((v) => (
                <Fragment key={v.id}>
                  <tr className={editingId === v.id ? "bg-[var(--accent)]/5" : ""}>
                    <td className="px-2">
                      {v.driveWebViewLink ? (
                        <a
                          href={v.driveWebViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-colors w-12 h-8 bg-[var(--bg-tertiary)] relative group"
                          title={v.fileName ?? undefined}
                        >
                          {v.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.thumbnailUrl}
                              alt={v.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film size={14} className="text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={12} className="text-white" />
                          </div>
                        </a>
                      ) : (
                        <div className="w-12 h-8 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <Film size={14} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                    </td>
                    <td className="max-w-[300px]">
                      {editingId === v.id ? (
                        <input
                          className="input w-full text-sm py-1"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          title={editForm.name}
                          placeholder="Name"
                          disabled={updateVideo.isPending}
                        />
                      ) : (
                        <div className="truncate" title={v.name || undefined}>{v.name || "—"}</div>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-[var(--text-muted)] text-[10px] truncate block max-w-[160px]" title={v.fileName ?? undefined}>
                        {v.fileName || "—"}
                      </span>
                    </td>
                    <td>
                      {editingId === v.id ? (
                        <input
                          className="input w-16 text-sm py-1 uppercase"
                          value={editForm.extension}
                          onChange={(e) => setEditForm({ ...editForm, extension: e.target.value })}
                          placeholder="ext"
                          disabled={updateVideo.isPending}
                        />
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs uppercase">{v.extension || "—"}</span>
                      )}
                    </td>
                    <td>
                      {v.campaign ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.campaign.color }} />
                          <span className="text-[var(--text-secondary)] text-sm truncate">{v.campaign.brandName}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td>
                      {v.inspo ? (
                        <a
                          href={v.inspo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline text-xs truncate block max-w-[120px]"
                          title={v.inspo}
                        >
                          inspo
                        </a>
                      ) : "—"}
                    </td>
                    <td className="relative">
                      {editingId === v.id ? (
                        <select
                          className="input w-full text-sm py-1"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          disabled={updateVideo.isPending}
                        >
                          {VIDEO_STATUSES.map((s) => (
                            <option key={s} value={statusKey(s)}>{s}</option>
                          ))}
                        </select>
                      ) : statusDropdownId === v.id ? (
                        <select
                          className="input w-full text-sm py-1"
                          value={v.status}
                          autoFocus
                          onChange={(e) => {
                            updateVideo.mutate({ id: v.id, status: e.target.value });
                            setStatusDropdownId(null);
                          }}
                          onBlur={() => setStatusDropdownId(null)}
                        >
                          {VIDEO_STATUSES.map((s) => (
                            <option key={s} value={statusKey(s)}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setStatusDropdownId(v.id)}
                          className={`badge ${videoBadgeClass(v.status)} cursor-pointer hover:opacity-80`}
                          title="Click to change status"
                        >
                          {statusLabel(v.status)}
                        </button>
                      )}
                    </td>
                    <td className="text-[var(--text-muted)] text-xs">{formatDate(v.uploadedAt)}</td>
                    <td className="text-[var(--text-muted)] text-xs">{formatDate((v as Record<string, unknown>).createdAt as string)}</td>
                    <td className="text-right">
                      {editingId === v.id ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(v.id)} disabled={updateVideo.isPending} className="btn btn-primary text-[11px] py-1 px-2 min-w-[44px]">{updateVideo.isPending ? '...' : 'Save'}</button>
                          <button onClick={() => setEditingId(null)} disabled={updateVideo.isPending} className="btn btn-secondary text-[11px] py-1 px-2">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(v)} className="btn btn-ghost text-[var(--accent)] text-[11px]">Edit</button>
                          <button onClick={() => del(v.id)} disabled={deleteVideo.isPending} className="btn btn-ghost text-[var(--danger)] text-[11px]">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {editingId === v.id && (
                    <tr className="bg-[var(--accent)]/3">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid grid-cols-6 gap-3">
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Hook Type</label>
                            <input className="input text-sm py-1" value={editForm.hookType} onChange={(e) => setEditForm({ ...editForm, hookType: e.target.value })} placeholder="Hook Type" disabled={updateVideo.isPending} />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Niche</label>
                            <input className="input text-sm py-1" value={editForm.niche} onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })} placeholder="Niche" disabled={updateVideo.isPending} />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Format</label>
                            <input className="input text-sm py-1" value={editForm.format} onChange={(e) => setEditForm({ ...editForm, format: e.target.value })} placeholder="Format" disabled={updateVideo.isPending} />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Likes</label>
                            <input type="number" className="input text-sm py-1" value={editForm.likes} onChange={(e) => setEditForm({ ...editForm, likes: e.target.value })} disabled={updateVideo.isPending} />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Campaign</label>
                            <select className="input text-sm py-1" value={editForm.campaignId} onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })} disabled={updateVideo.isPending}>
                              <option value="">No Campaign</option>
                              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
                            </select>
                          </div>
                        </div>
                        {v.fileName !== undefined && !v.driveFileId && (
                          <div className="mt-3">
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">File Name</label>
                            <input className="input text-sm py-1" value={editForm.fileName} onChange={(e) => setEditForm({ ...editForm, fileName: e.target.value })} placeholder="File name" disabled={updateVideo.isPending} />
                          </div>
                        )}
                        {editForm.status === "posted" && (
                          <p className="text-[10px] text-[var(--accent)] mt-1">Setting status to Posted will set the uploaded date to today.</p>
                        )}
                        <div className="mt-3">
                          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Notes</label>
                          <input className="input text-sm py-1" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Optional notes" disabled={updateVideo.isPending} />
                        </div>
                        <div className="mt-3">
                          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Inspo Link</label>
                          <input className="input text-sm py-1" value={editForm.inspo} onChange={(e) => setEditForm({ ...editForm, inspo: e.target.value })} placeholder="https://..." disabled={updateVideo.isPending} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {displayed.length === 0 && <tr><td colSpan={11} className="card-pad text-center text-[var(--text-muted)]">No videos found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
