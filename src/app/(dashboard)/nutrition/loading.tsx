export default function NutritionLoading() {
  return (
    <div className="animate-fade-in">
      <div className="h-16 border-b border-[var(--border)] px-4 md:px-6 flex items-center gap-3">
        <div className="skeleton h-5 w-36 rounded" />
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-24 rounded-lg" />
            <div className="skeleton h-9 w-24 rounded-lg" />
            <div className="ml-auto skeleton h-9 w-32 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-9 w-20 rounded-lg" />
            <div className="skeleton h-9 w-20 rounded-lg" />
          </div>
        </div>

        <div className="flex gap-2 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-12 flex-shrink-0 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-3">
          {['საუზმე', 'სადილი', 'ვახშამი', 'შუადღის საჭმელი'].map((meal) => (
            <div key={meal} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-5 w-16 rounded-full" />
                ))}
              </div>
              <div className="space-y-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-3 w-full rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
