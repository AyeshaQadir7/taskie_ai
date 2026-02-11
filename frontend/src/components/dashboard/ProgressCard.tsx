/**
 * Progress Card Component
 * Displays task completion progress as percentage and bar
 */

interface ProgressCardProps {
  percentage: number
  completedCount: number
  totalCount: number
}

export function ProgressCard({
  percentage,
  completedCount,
  totalCount,
}: ProgressCardProps) {
  return (
    <div className="rounded-2xl border border-violet-light/60 bg-[#fff] p-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-light/50">
          Progress
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-2.5 py-0.5 text-xs font-medium text-violet-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          {completedCount}/{totalCount}
        </span>
      </div>

      <p className="text-4xl font-bold text-slate font-grotesk tracking-tight mt-2">
        {percentage}
        <span className="text-base font-normal text-slate-light/70 ml-0.5">%</span>
      </p>

      <div className="mt-5 h-2 w-full rounded-full bg-slate-light/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-slate-light/70 mt-3">
        {completedCount} of {totalCount} tasks completed
      </p>
    </div>
  )
}
