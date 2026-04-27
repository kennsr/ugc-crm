import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

export type Workspace = {
  id: string;
  name: string;
  plan: string;
  members: { id: string; userId: string; role: string; user?: { email: string } }[];
};

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ['workspace'],
    queryFn: () => fetch('/api/auth/workspace').then((r) => r.json()),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) =>
      fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) =>
      fetch(`/api/auth/members/${memberId}?workspaceId=current`, {
        method: 'DELETE',
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace'] }),
  });
}
