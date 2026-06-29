export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      <div className="h-16 border-b border-[var(--border)] px-4 md:px-6 flex items-center gap-3">
        <div className="skeleton h-5 w-48 rounded" />
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="skeleton h-7 w-7 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-6 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="space-y-2">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="skeleton h-3 w-12 rounded mx-auto" />
                  <div className="skeleton h-1.5 w-full rounded" />
                  <div className="skeleton h-3 w-16 rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="skeleton h-9 w-full rounded-lg" />
          </div>

          <div className="card p-5 space-y-4">
            <div className="skeleton h-4 w-32 rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex flex-col items-center gap-2">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="card p-4 space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-24 w-full rounded" />
        </div>
      </div>
    </div>
  )
}
