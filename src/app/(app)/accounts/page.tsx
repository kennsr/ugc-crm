'use client';
import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, Account } from '@/lib/queries/accounts';
import { useCampaigns } from '@/lib/queries/campaigns';

const PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const;

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

function platformBadge(platform: string | null | undefined) {
  const p = (platform ?? 'tiktok').toLowerCase();
  const colors: Record<string, string> = {
    tiktok: 'badge-pink',
    instagram: 'badge-purple',
    youtube: 'badge-red',
  };
  const color = colors[p] || 'badge-neutral';
  return <span className={`badge ${color}`}>{platform?.toUpperCase() ?? 'TIKTOK'}</span>;
}

type EditForm = {
  name: string;
  username: string;
  platform: string;
  email: string;
  campaignId: string;
  notes: string;
};

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: campaigns = [] } = useCampaigns();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '', username: '', platform: 'tiktok', email: '', campaignId: '', notes: '',
  });
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortedAccounts() {
    const arr = Array.isArray(accounts) ? accounts : [];
    const list = [...arr];
    list.sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortKey === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortKey === 'username') { aVal = a.username ?? ''; bVal = b.username ?? ''; }
      else if (sortKey === 'platform') { aVal = a.platform; bVal = b.platform; }
      else if (sortKey === 'campaign') { aVal = a.campaign?.brandName ?? ''; bVal = b.campaign?.brandName ?? ''; }
      else if (sortKey === 'email') { aVal = a.email ?? ''; bVal = b.email ?? ''; }
      else if (sortKey === 'createdAt') { aVal = a.createdAt ?? ''; bVal = b.createdAt ?? ''; }
      else { aVal = a.name; bVal = b.name; }
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }

  function openEdit(a: Account) {
    setEditingId(a.id);
    setEditForm({
      name: a.name,
      username: a.username ?? '',
      platform: a.platform,
      email: a.email ?? '',
      campaignId: a.campaignId ?? '',
      notes: a.notes ?? '',
    });
  }

  function saveEdit(id: string) {
    updateAccount.mutate({
      id,
      name: editForm.name,
      username: editForm.username || null,
      platform: editForm.platform,
      email: editForm.email || null,
      campaignId: editForm.campaignId || null,
      notes: editForm.notes || null,
    }, { onSuccess: () => setEditingId(null) });
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    createAccount.mutate({
      name: editForm.name,
      username: editForm.username || null,
      platform: editForm.platform,
      email: editForm.email || null,
      campaignId: editForm.campaignId || null,
      notes: editForm.notes || null,
    }, {
      onSuccess: () => {
        setShowAdd(false);
      },
    });
  }

  function del(id: string) {
    if (!confirm('Delete this account?')) return;
    deleteAccount.mutate(id);
  }

  const displayed = sortedAccounts();
  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1>Accounts</h1>
        <div className="flex gap-3 items-center">
          <button onClick={() => setShowAdd(true)} className="btn btn-ghost text-[var(--accent)] text-[11px]">+ Add</button>
        </div>
      </div>

      {showAdd && (
        <div className="card border-[var(--accent)] card-pad">
          <h3 className="mb-3">Add Account</h3>
          <form onSubmit={submitAdd} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Name *</label>
              <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Account name" required />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Platform</label>
              <select className="input" value={editForm.platform} onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Username</label>
              <input className="input" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="@username" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Email</label>
              <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Campaign</label>
              <select className="input" value={editForm.campaignId} onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })}>
                <option value="">No Campaign</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Notes</label>
              <input className="input" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={isPending} className="btn btn-primary">{isPending ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                {['Name', 'Username', 'Platform', 'Campaign', 'Email', 'Created', ''].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton h-4 w-24" /></td>)}
                  <td><div className="skeleton h-4 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <SortTh label="Name" sortKey="name" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Username" sortKey="username" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Platform" sortKey="platform" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Campaign" sortKey="campaign" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Email" sortKey="email" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Created" sortKey="createdAt" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((a) => (
                <Fragment key={a.id}>
                  <tr className={editingId === a.id ? 'bg-[var(--accent)]/5' : ''}>
                    <td className="font-medium">{editingId === a.id ? (
                      <input className="input w-full text-sm py-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                    ) : a.name}</td>
                    <td className="text-[var(--text-secondary)]">{editingId === a.id ? (
                      <input className="input w-full text-sm py-1" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="@username" />
                    ) : (a.username ? <span className="text-[10px]">@{a.username}</span> : '—')}</td>
                    <td>{editingId === a.id ? (
                      <select className="input w-full text-sm py-1" value={editForm.platform} onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                    ) : platformBadge(a.platform)}</td>
                    <td>{editingId === a.id ? (
                      <select className="input w-full text-sm py-1" value={editForm.campaignId} onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })}>
                        <option value="">No Campaign</option>
                        {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brandName}</option>)}
                      </select>
                    ) : a.campaign ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.campaign.color }} />
                        <span className="text-[var(--text-secondary)] text-sm truncate">{a.campaign.brandName}</span>
                      </div>
                    ) : '—'}</td>
                    <td className="text-[var(--text-muted)] text-xs max-w-[150px] truncate">{editingId === a.id ? (
                      <input className="input w-full text-sm py-1" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                    ) : (a.email || '—')}</td>
                    <td className="text-[var(--text-muted)] text-xs">{a.createdAt ? format(new Date(a.createdAt), 'MMM d, yyyy') : '—'}</td>
                    <td className="text-right">
                      {editingId === a.id ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(a.id)} disabled={updateAccount.isPending} className="btn btn-primary text-[11px] py-1 px-2 min-w-[44px]">{updateAccount.isPending ? '...' : 'Save'}</button>
                          <button onClick={() => setEditingId(null)} disabled={updateAccount.isPending} className="btn btn-secondary text-[11px] py-1 px-2">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(a)} className="btn btn-ghost text-[var(--accent)] text-[11px]">Edit</button>
                          <button onClick={() => del(a.id)} disabled={deleteAccount.isPending} className="btn btn-ghost text-[var(--danger)] text-[11px]">Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {editingId === a.id && (
                    <tr className="bg-[var(--accent)]/3">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="grid grid-cols-6 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide block mb-1">Notes</label>
                            <input className="input text-sm py-1" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Optional notes" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={7} className="card-pad text-center text-[var(--text-muted)]">
                  {showAdd ? 'Fill in the form above to add your first account.' : 'No accounts yet. Click + Add to create one.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}