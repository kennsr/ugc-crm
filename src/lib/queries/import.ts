import { useMutation, useQueryClient } from '@tanstack/react-query';

export type ImportResult = {
  imported: number;
  campaignsCreated: number;
  accountsCreated: number;
  finance: { totalIncome: number; totalExpense: number };
  errors?: string[];
  debug?: { sheetsFound: string[]; accountRows: number; videoRows: number; financeRows: number };
};

export function useImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      return data as ImportResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['config'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
