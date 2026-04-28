import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type Video = {
  id: string;
  name: string;
  fileName?: string | null;
  extension?: string | null;
  thumbnailUrl?: string | null;
  driveWebViewLink?: string | null;
  campaign?: { id: string; brandName: string; color: string };
  campaignId?: string;
  platform: string;
  status: string;
  uploadedAt?: string | null;
  views: number;
  likes: number;
  earnings: number;
  notes?: string | null;
  hookType?: string | null;
  niche?: string | null;
  format?: string | null;
  createdAt: string;
};

export function useVideos(campaignId?: string) {
  return useQuery<Video[]>({
    queryKey: campaignId ? ['videos', campaignId] : ['videos'],
    queryFn: () =>
      campaignId
        ? fetch(`/api/videos?campaignId=${campaignId}`).then((r) => r.json())
        : fetch('/api/videos').then((r) => r.json()),
  });
}

export function useCreateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Video>) =>
      fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (video: Video) => {
      qc.setQueryData<Video[]>(['videos'], (old) =>
        old ? [{ ...video }, ...old] : [video]
      );
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Video> & { id: string }) =>
      fetch('/api/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (updated: Video) => {
      qc.setQueryData<Video[]>(['videos'], (old) =>
        old?.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
      );
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/videos?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: (_: unknown, id: string) => {
      qc.setQueryData<Video[]>(['videos'], (old) =>
        old?.filter((v) => v.id !== id)
      );
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
