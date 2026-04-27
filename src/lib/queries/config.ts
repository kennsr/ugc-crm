import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type ConfigMap = Record<string, string>;

export function useConfig() {
  return useQuery<ConfigMap>({
    queryKey: ['config'],
    queryFn: () => fetch('/api/config').then((r) => r.json()),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  });
}

export function useSaveAllConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: ConfigMap) => {
      await Promise.all(
        Object.entries(config).map(([key, value]) =>
          fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          })
        )
      );
      return fetch('/api/config').then((r) => r.json()) as Promise<ConfigMap>;
    },
    onSuccess: (data) => {
      qc.setQueryData(['config'], data);
    },
  });
}
