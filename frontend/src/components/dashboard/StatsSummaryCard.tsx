/**
 * Stats Summary Card Component
 * Displays overview stats: Due Today, Overdue, High Priority, Completed
 */

import { Calendar, AlertCircle, Flag, CheckCircle2 } from 'lucide-react'

interface StatsSummaryCardProps {
  dueTodayCount: number
  overdueCount: number
  highPriorityCount: number
  completedCount: number
}

export function StatsSummaryCard({
  dueTodayCount,
  overdueCount,
  highPriorityCount,
  completedCount,
}: StatsSummaryCardProps) {
  const stats = [
    {
      label: 'Due today',
      count: dueTodayCount,
      icon: Calendar,
      iconBg: 'bg-violet/20 text-violet-dark',
    },
    {
      label: 'Overdue',
      count: overdueCount,
      icon: AlertCircle,
      iconBg: 'bg-red-50 text-red-500',
    },
    {
      label: 'High priority',
      count: highPriorityCount,
      icon: Flag,
      iconBg: 'bg-amber-50 text-amber-500',
    },
    {
      label: 'Completed',
      count: completedCount,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-500',
    },
  ]

  return (
    <div className="rounded-2xl border border-violet-light/60 bg-[#fff] p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-light/50 mb-5">
        Summary
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {stats.map(({ label, count, icon: Icon, iconBg }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate font-grotesk tracking-tight leading-none">
                {count}
              </p>
              <p className="text-xs text-slate-light/50 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
