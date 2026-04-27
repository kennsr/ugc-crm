import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type Campaign = {
  id: string;
  brandName: string;
  color: string;
  platform: string;
  rateType: string;
  rateAmount: number;
  status: string;
  notes: string;
  createdAt: string;
  _count?: { videos: number };
};

export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => fetch('/api/campaigns').then((r) => r.json()),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) =>
      fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign> & { id: string }) =>
      fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
