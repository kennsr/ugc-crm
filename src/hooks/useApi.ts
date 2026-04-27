import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// Dashboard - long stale time since it's aggregate data
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetcher<Record<string, unknown>>('/api/dashboard'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Campaigns - refetch when invalidated
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetcher<unknown[]>('/api/campaigns'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetcher('/api/campaigns', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/campaigns?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Videos - shorter stale time for frequently updated data
export function useVideos(campaignId?: string) {
  return useQuery({
    queryKey: ['videos', campaignId],
    queryFn: () =>
      fetcher<unknown[]>(
        campaignId ? `/api/videos?campaignId=${campaignId}` : '/api/videos'
      ),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher('/api/videos', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetcher('/api/videos', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/videos?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Config - long stale time, manual refresh only
export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => fetcher<Record<string, string>>('/api/config'),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      fetcher('/api/config', { method: 'PUT', body: JSON.stringify({ key, value }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });
}
