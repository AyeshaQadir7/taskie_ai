'use client'

/**
 * Dashboard Page
 * Main dashboard with greeting, stats, and task overview
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth/useAuth'
import { useTasks } from '@/lib/hooks/useTasks'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { ProgressCard } from '@/components/dashboard/ProgressCard'
import { StatsSummaryCard } from '@/components/dashboard/StatsSummaryCard'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Button } from '@/components/common/Button'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { tasks, fetchTasks, isLoading, error, clearError } = useTasks()
  const stats = useDashboardStats(tasks)

  // Fetch tasks on mount
  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id)
    }
  }, [user?.id, fetchTasks])

  // Auth guard
  if (!isAuthenticated) {
    return null
  }

  // Loading state
  if (isLoading && tasks.length === 0) {
    return <DashboardSkeleton />
  }

  // Get user display name
  const displayName = user?.name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-10">
      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          title="Failed to load tasks"
          onDismiss={clearError}
        />
      )}

      {/* Header Section */}
      <div>
        <p className="text-md text-violet ">Hello {displayName}!</p>
        <h1 className="text-3xl md:text-4xl font-medium mt-1.5 tracking-tight text-balance "
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
          }}>

          {"You've got"} {stats.incompleteCount}{' '}
          {stats.incompleteCount === 1 ? 'task' : 'tasks'} today
        </h1>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-violet/40 bg-[#fff] p-6">
        <div>
          <h2 className="text-xl md:text-3xl font-semibold text-slate font-grotesk tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {"Let's organize your tasks together"}
          </h2>
          <p className="text-md text-slate-light/50 mt-1">
            Stay on top of your work and hit every deadline.
          </p>
        </div>
        <Button
          onClick={() => router.push('/tasks/new')}
          variant="secondary"
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} />
          New Task
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ProgressCard
          percentage={stats.progressPercentage}
          completedCount={stats.completedCount}
          totalCount={stats.totalTasks}
        />
        <StatsSummaryCard
          dueTodayCount={stats.dueTodayCount}
          overdueCount={stats.overdueCount}
          highPriorityCount={stats.highPriorityCount}
          completedCount={stats.completedCount}
        />
      </div>

      {/* Empty State */}
      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-16 rounded-2xl border border-violet-light/20 bg-white">
          <p className="text-slate-light/50 text-base mb-5">
            No tasks yet. Create your first task to get started!
          </p>
          <Button
            onClick={() => router.push('/tasks/new')}
            variant="primary"
            className="flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            Create Task
          </Button>
        </div>
      )}
    </div>
  )
}
