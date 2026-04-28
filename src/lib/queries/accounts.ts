import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type Account = {
  id: string;
  name: string;
  username?: string | null;
  platform: string;
  email?: string | null;
  notes?: string | null;
  campaign?: { id: string; brandName: string; color: string };
  campaignId?: string | null;
  createdAt: string;
};

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const r = await fetch('/api/accounts');
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Account>) =>
      fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (account: Account) => {
      qc.setQueryData<Account[]>(['accounts'], (old) =>
        old ? [account, ...old] : [account]
      );
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Account> & { id: string }) =>
      fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (updated: Account) => {
      qc.setQueryData<Account[]>(['accounts'], (old) =>
        old?.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/accounts?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: (_: unknown, id: string) => {
      qc.setQueryData<Account[]>(['accounts'], (old) =>
        old?.filter((a) => a.id !== id)
      );
    },
  });
}