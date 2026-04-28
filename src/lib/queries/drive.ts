import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type DriveStatus = {
  connected: boolean;
  email?: string;
  rootFolderId?: string;
  lastSynced?: string;
};

export function useDriveStatus() {
  return useQuery<DriveStatus>({
    queryKey: ['drive', 'status'],
    queryFn: () => fetch('/api/drive/status').then((r) => r.json()),
  });
}

export function useDriveFiles(folderId?: string) {
  return useQuery({
    queryKey: ['drive', 'files', folderId ?? 'root'],
    queryFn: () =>
      folderId
        ? fetch(`/api/drive/files?folderId=${folderId}`).then((r) => r.json())
        : fetch('/api/drive/files').then((r) => r.json()),
    enabled: false,
  });
}

export function useConnectDrive() {
  return useMutation({
    mutationFn: async () =>
      fetch('/api/drive/connect').then((r) => r.json()),
  });
}

export function useDisconnectDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      fetch('/api/drive/disconnect', { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive'] });
    },
  });
}

export function useSyncDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folderId?: string) =>
      fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootFolderId: folderId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
