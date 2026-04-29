'use client';
import { useState } from 'react';
import { useDriveStatus, useDriveFiles, useConnectDrive, useDisconnectDrive, useSyncDrive } from '@/lib/queries/drive';
import { useBackupDrive } from '@/lib/queries/backup';

type DriveItem = { id: string; name: string };

export default function DriveConnect() {
  const { data: status, isLoading } = useDriveStatus();
  const connectDrive = useConnectDrive();
  const disconnectDrive = useDisconnectDrive();
  const syncDrive = useSyncDrive();
  const backupDrive = useBackupDrive();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  async function loadFolders(folderId: string) {
    setLoadingFolders(true);
    try {
      const res = await fetch(`/api/drive/files?folderId=${folderId}`);
      const data = await res.json();
      if (!data.error) setFolders(data.folders || []);
    } finally {
      setLoadingFolders(false);
    }
  }

  function openFolderPicker() {
    setPickerOpen(true);
    setCurrentFolder(null);
    setBreadcrumbs([]);
    loadFolders('root');
  }

  function handleSelectFolder(folder: DriveItem) {
    setBreadcrumbs([...breadcrumbs, folder]);
    setCurrentFolder(folder);
    loadFolders(folder.id);
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

  function handleSetRoot() {
    if (!currentFolder) return;
    syncDrive.mutate(currentFolder.id, {
      onSuccess: (data) => {
        if (data.success) {
          setPickerOpen(false);
        } else {
          alert('Sync failed: ' + data.error);
        }
      },
    });
  }

  function handleSync() {
    if (!status?.rootFolderId) return;
    syncDrive.mutate(status.rootFolderId, {
      onSuccess: (data) => {
        if (!data.success) alert('Sync failed: ' + data.error);
      },
    });
  }

  const lastSyncedDate = status?.lastSynced
    ? new Date(status.lastSynced).toLocaleString()
    : 'Never';

  if (isLoading) return <div className="skeleton h-20 w-full" />;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <h3>Google Drive</h3>
        {status?.connected && <span className="badge badge-success">Connected</span>}
      </div>

      {!status?.connected ? (
        <div className="space-y-3">
          <p className="text-[var(--text-muted)] text-[11px]">
            Connect your Google Drive to automatically sync campaigns and videos from your folder structure.
            Files are uploaded manually - this app only reads your Drive.
          </p>
          <button
            onClick={() => connectDrive.mutate(undefined, { onSuccess: (data) => { if (data?.authUrl) window.location.href = data.authUrl; } })}
            disabled={connectDrive.isPending}
            className="btn btn-primary"
          >
            {connectDrive.isPending ? 'Connecting...' : 'Connect Google Drive'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-[11px] text-[var(--text-muted)] space-y-1">
            <p>Root folder: {status.rootFolderId || 'Not set'}</p>
            <p>Last synced: {lastSyncedDate}</p>
            {status.lastBackupAt && <p>Last backup: {new Date(status.lastBackupAt).toLocaleString()}</p>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={openFolderPicker} className="btn btn-secondary">Select Folder</button>
            <button
              onClick={handleSync}
              disabled={syncDrive.isPending || !status.rootFolderId}
              className="btn btn-primary"
            >
              {syncDrive.isPending ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => backupDrive.mutate(undefined, {
                onSuccess: (data) => {
                  if (data.success) {
                    alert(`Backup saved: ${data.webViewLink ? 'View at drive.google.com' : data.fileId}`);
                  } else {
                    alert('Backup failed: ' + data.error);
                  }
                },
              })}
              disabled={backupDrive.isPending}
              className="btn btn-secondary"
            >
              {backupDrive.isPending ? 'Backing up...' : 'Backup to Drive'}
            </button>
            <button
              onClick={() => {
                if (!confirm('Disconnect Google Drive? Your videos will not be deleted.')) return;
                disconnectDrive.mutate();
              }}
              disabled={disconnectDrive.isPending}
              className="btn btn-ghost text-[var(--danger)]"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium">Select Root Folder</p>
            <button onClick={() => setPickerOpen(false)} className="btn btn-ghost text-[10px]">Close</button>
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
            <button
              onClick={handleSetRoot}
              disabled={syncDrive.isPending}
              className="btn btn-primary w-full mt-2"
            >
              {syncDrive.isPending ? 'Setting...' : `Set "${currentFolder.name}" as Root`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
