import { useQuery, useQueryClient } from '@tanstack/react-query';

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
};

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then((r) => r.json()),
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['profile'] });
}
