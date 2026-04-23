'use client';
import { useEffect, useState } from 'react';

type DriveStatus = {
  connected: boolean;
  rootFolderId: string | null;
  lastSynced: string | null;
};

type DriveItem = {
  id: string;
  name: string;
};

export default function DriveConnect() {
  const [status, setStatus] = useState<DriveStatus>({ connected: false, rootFolderId: null, lastSynced: null });
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriveStatus();
  }, []);

  async function fetchDriveStatus() {
    try {
      const res = await fetch('/api/drive/status');
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      } else {
        console.error('Drive status error:', data.error);
        setStatus({ connected: false, rootFolderId: null, lastSynced: null });
      }
    } catch (err) {
      console.error('Failed to fetch drive status:', err);
      setStatus({ connected: false, rootFolderId: null, lastSynced: null });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch('/api/drive/connect');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Connect error:', err);
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Google Drive? Your videos will not be deleted.')) return;
    try {
      await fetch('/api/drive/disconnect', { method: 'DELETE' });
      setStatus({ connected: false, rootFolderId: null, lastSynced: null });
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }

  async function openFolderPicker() {
    setPickerOpen(true);
    setCurrentFolder(null);
    setBreadcrumbs([]);
    await loadFolders('root');
  }

  async function loadFolders(folderId: string) {
    setLoadingFolders(true);
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`);
      const data = await res.json();
      if (data.error) {
        console.error('Error loading folders:', data.error);
        return;
      }
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Load folders error:', err);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function handleSelectFolder(folder: DriveItem) {
    setBreadcrumbs([...breadcrumbs, folder]);
    setCurrentFolder(folder);
    await loadFolders(folder.id);
  }

  function handleBreadcrumb(index: number) {
    const crumb = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(crumb);
    loadFolders(crumb.id);
  }

  function goUp() {
    if (breadcrumbs.length === 0) {
      setCurrentFolder(null);
      loadFolders('root');
      return;
    }
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);
    const crumb = newBreadcrumbs[newBreadcrumbs.length - 1];
    if (crumb) {
      setCurrentFolder(crumb);
      loadFolders(crumb.id);
    } else {
      setCurrentFolder(null);
      loadFolders('root');
    }
  }

  async function handleSetRoot() {
    if (!currentFolder) return;
    setSyncing(true);
    setPickerOpen(false);
    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootFolderId: currentFolder.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDriveStatus();
        alert(`Synced! ${data.campaignsCreated} campaigns, ${data.videosCreated} videos.`);
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSync() {
    if (!status.rootFolderId) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootFolderId: status.rootFolderId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDriveStatus();
        alert(`Synced! ${data.campaignsCreated} campaigns, ${data.videosCreated} videos.`);
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }

  const lastSyncedDate = status.lastSynced
    ? new Date(status.lastSynced).toLocaleString()
    : 'Never';

  if (loading) {
    return <div className="skeleton h-20 w-full" />;
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <h3>Google Drive</h3>
        {status.connected && (
          <span className="badge badge-success">Connected</span>
        )}
      </div>

      {!status.connected ? (
        <div className="space-y-3">
          <p className="text-[var(--text-muted)] text-[11px]">
            Connect your Google Drive to automatically sync campaigns and videos from your folder structure.
            Files are uploaded manually - this app only reads your Drive.
          </p>
          <button onClick={handleConnect} disabled={connecting} className="btn btn-primary">
            {connecting ? 'Connecting...' : 'Connect Google Drive'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-[11px] text-[var(--text-muted)] space-y-1">
            <p>Root folder: {status.rootFolderId || 'Not set'}</p>
            <p>Last synced: {lastSyncedDate}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={openFolderPicker} className="btn btn-secondary">
              Select Folder
            </button>
            <button onClick={handleSync} disabled={syncing || !status.rootFolderId} className="btn btn-primary">
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button onClick={handleDisconnect} className="btn btn-ghost text-[var(--danger)]">
              Disconnect
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium">Select Root Folder</p>
            <button onClick={() => setPickerOpen(false)} className="btn btn-ghost text-[10px]">
              Close
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button onClick={() => { setBreadcrumbs([]); setCurrentFolder(null); loadFolders('root'); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              My Drive
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]">/</span>
                <button onClick={() => handleBreadcrumb(i)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          <button onClick={goUp} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {breadcrumbs.length > 0 ? 'Back' : 'Go to My Drive'}
          </button>

          {loadingFolders ? (
            <p className="text-[var(--text-muted)] text-[11px]">Loading...</p>
          ) : folders.length === 0 ? (
            <p className="text-[var(--text-muted)] text-[11px]">No subfolders found.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder)}
                  className="block w-full text-left px-3 py-2 text-[11px] hover:bg-[var(--bg-elevated)] rounded"
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}

          {currentFolder && (
            <button onClick={handleSetRoot} disabled={syncing} className="btn btn-primary w-full mt-2">
              {syncing ? 'Setting...' : `Set "${currentFolder.name}" as Root`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
