import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBackupDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch('/api/backup', { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive'] });
    },
  });
}
