'use client'

/**
 * useDashboardStats Hook
 * Calculates all dashboard statistics from task data
 */

import { useMemo } from 'react'
import { Task } from '@/lib/api/types'

export interface DashboardStats {
  totalTasks: number
  completedCount: number
  incompleteCount: number
  progressPercentage: number
  dueTodayCount: number
  overdueCount: number
  highPriorityCount: number
}

export function useDashboardStats(tasks: Task[]): DashboardStats {
  return useMemo(() => {
    const completedCount = tasks.filter(t => t.completed).length
    const incompleteCount = tasks.filter(t => !t.completed).length
    const dueTodayCount = tasks.filter(t => t.isDueToday && !t.completed).length
    const overdueCount = tasks.filter(t => t.isOverdue && !t.completed).length
    const highPriorityCount = tasks.filter(t => t.priority === 'high' && !t.completed).length
    const totalTasks = tasks.length
    const progressPercentage = totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0

    return {
      totalTasks,
      completedCount,
      incompleteCount,
      progressPercentage,
      dueTodayCount,
      overdueCount,
      highPriorityCount,
    }
  }, [tasks])
}
