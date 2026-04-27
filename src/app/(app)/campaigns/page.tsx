"use client";
import { useState } from "react";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { CAMPAIGN_COLORS } from "@/lib/color";
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign } from "@/lib/queries/campaigns";

type Campaign = {
  id?: string;
  brandName: string;
  color: string;
  platform: string;
  rateType: string;
  rateAmount: number;
  status: string;
  notes: string;
  _count?: { videos: number };
};

const platforms = ["tiktok", "youtube", "both"];
const statuses = ["active", "paused", "completed", "negotiating"];
const rateTypes = ["fixed", "fixed_plus_views", "rev_share"];

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      brandName: form.brandName,
      color: form.color || "#6366f1",
      platform: form.platform || "both",
      rateType: form.rateType || "fixed",
      rateAmount: parseFloat(form.rateAmount) || 30,
      status: form.status || "active",
      notes: form.notes || "",
    };
    if (editId) {
      updateCampaign.mutate({ id: editId, ...data }, {
        onSuccess: () => { setShowAdd(false); setEditId(null); setForm({}); }
      });
    } else {
      createCampaign.mutate(data, {
        onSuccess: () => { setShowAdd(false); setForm({}); }
      });
    }
  }

  function del(id: string) {
    if (!confirm("Delete campaign + all its videos?")) return;
    deleteCampaign.mutate(id);
  }

  function startEdit(c: Campaign) {
    setForm({
      brandName: c.brandName,
      color: c.color,
      platform: c.platform,
      rateType: c.rateType,
      rateAmount: String(c.rateAmount),
      status: c.status,
      notes: c.notes || "",
    });
    setEditId(c.id ?? null);
    setShowAdd(true);
  }

  const isPending = createCampaign.isPending || updateCampaign.isPending;

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
          <form onSubmit={submit} className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Brand Name</label>
              <input required placeholder="e.g. GlowRecipe" className="input w-full" value={form.brandName || ""} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="input w-10 h-9 p-0.5 cursor-pointer border rounded"
                  value={form.color || "#6366f1"}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <div className="flex gap-1">
                  {CAMPAIGN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${form.color === c ? "border-[var(--text-primary)] scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Platform</label>
              <select className="input w-full" value={form.platform || "both"} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {platforms.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Rate Type</label>
              <select className="input w-full" value={form.rateType || "fixed"} onChange={(e) => setForm({ ...form, rateType: e.target.value })}>
                {rateTypes.map((r) => <option key={r} value={r}>{r.replace("_", " + ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Rate (USD)</label>
              <input type="number" step="0.01" placeholder="30" className="input w-full" value={form.rateAmount || ""} onChange={(e) => setForm({ ...form, rateAmount: e.target.value })} />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Status</label>
              <select className="input w-full" value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[var(--text-muted)] text-[10px] block mb-1 uppercase tracking-wide">Notes</label>
              <input placeholder="Optional notes" className="input w-full" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-4 flex gap-2">
              <button type="submit" disabled={isPending} className="btn btn-primary">
                {isPending ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="card card-pad hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <div>
                    <h3 className="text-[var(--text-primary)]">{c.brandName}</h3>
                    <p className="text-[var(--text-muted)] text-[10px] mt-0.5">${c.rateAmount}/{c.rateType.replace("_", "+")} · {c.platform.toUpperCase()}</p>
                  </div>
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
