export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`stat-card animate-pulse ${className}`}>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-8 w-16 mt-1" />
    </div>
  );
}

export type TableSkeletonCol = {
  label: string;
  skeleton: string;
  align?: 'left' | 'right';
};

export function TableSkeleton({ rows = 5, columns }: { rows?: number; columns?: TableSkeletonCol[] }) {
  const cols: TableSkeletonCol[] = columns ?? [
    { label: 'Name', skeleton: 'w-40' },
    { label: 'Campaign', skeleton: 'w-28' },
    { label: 'Status', skeleton: 'w-20' },
    { label: 'Views', skeleton: 'w-16', align: 'right' },
    { label: 'Earnings', skeleton: 'w-16', align: 'right' },
  ];

  return (
    <div className="card overflow-hidden">
      <table className="table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.label} className={c.align === 'right' ? 'text-right' : ''}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.label} className={c.align === 'right' ? 'text-right' : ''}>
                  <div className={`skeleton h-4 ${c.skeleton} ${c.align === 'right' ? 'ml-auto' : ''}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-48 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
