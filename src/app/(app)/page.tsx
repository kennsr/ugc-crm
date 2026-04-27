'use client';
import { format } from 'date-fns';
import { useDashboard } from '@/hooks/useApi';
import { CardSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';
import { fmtIdr } from '@/lib/currency';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  const cards = [
    { label: 'Campaigns', value: data?.campaigns as number },
    { label: 'Videos Posted', value: data?.videosPosted as number },
    { label: 'Total Videos', value: data?.totalVideos as number },
    { label: 'Total Earnings (USD)', value: `$${((data?.totalEarningsUsd as number) || 0).toFixed(0)}` },
  ];

  const financeCards = [
    { label: 'Total Income (IDR)', value: fmtIdr(data?.totalIncomeIdr as number) },
    { label: 'Total Expense (IDR)', value: fmtIdr(data?.totalExpenseIdr as number) },
    { label: 'Net Profit (IDR)', value: fmtIdr(data?.netProfitIdr as number) },
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-4">
          <p className="text-[var(--danger)]">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-0.5">
            UGC Creator Intelligence — {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
        {!isLoading && (
          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost text-[10px]"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : cards.map((c) => (
              <div key={c.label} className="stat-card">
                <p className="label">{c.label}</p>
                <p className="value">{c.value ?? '—'}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : financeCards.map((c) => (
              <div key={c.label} className="stat-card">
                <p className="label">{c.label}</p>
                <p className="value">{c.value ?? '—'}</p>
              </div>
            ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2>Recent Videos</h2>
          <a href="/videos" target="_blank" className="btn btn-ghost text-[var(--text-muted)] text-[11px]">View all</a>
        </div>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : (data?.recentVideos as Array<Record<string, unknown>>)?.length === 0 ? (
          <div className="card-pad text-center">
            <p className="text-[var(--text-muted)]">No videos yet. Import your spreadsheet or add videos.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="text-right">Views</th>
                  <th className="text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentVideos as Array<Record<string, unknown>>)?.map((v) => (
                  <tr key={v.id as string}>
                    <td className="max-w-xs truncate">
                      {(v.name as string) || '—'}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {((v.campaign as Record<string, unknown>)?.brandName as string) || '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        v.status === 'posted' ? 'badge-success' :
                        v.status === 'in_review' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {String(v.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right text-[var(--text-secondary)]">
                      {(v.views as number)?.toLocaleString() || '0'}
                    </td>
                    <td className="text-right">
                      ${(v.earnings as number)?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
