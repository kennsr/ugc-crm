export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`stat-card animate-pulse ${className}`}>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-8 w-16 mt-1" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
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
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton h-4 w-32" /></td>
              <td><div className="skeleton h-4 w-24" /></td>
              <td><div className="skeleton h-5 w-16" /></td>
              <td><div className="skeleton h-4 w-16 ml-auto" /></td>
              <td><div className="skeleton h-4 w-12 ml-auto" /></td>
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
