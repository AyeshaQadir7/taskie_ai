'use client'

import { Calendar, AlertCircle } from 'lucide-react'
import { formatDueDateStatus } from '@/utils/formatting'

/**
 * Get icon size based on badge size
 */
function getIconSize(size: 'sm' | 'md' | 'lg'): number {
  switch (size) {
    case 'sm':
      return 14
    case 'md':
      return 16
    case 'lg':
      return 20
    default:
      return 16
  }
}

/**
 * Props for the DueDateBadge component
 */
interface DueDateBadgeProps {
  /** Due date as ISO string (YYYY-MM-DD) */
  dueDate: string
  /** Whether the task is overdue */
  isOverdue?: boolean
  /** Whether the task is due today */
  isDueToday?: boolean
  /** Days until due (negative if overdue) */
  daysUntilDue?: number | null
  /** Badge size: 'sm' (small), 'md' (medium), 'lg' (large). Default: 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the icon. Default: true */
  showIcon?: boolean
  /** Whether to show the text label. Default: true */
  showText?: boolean
}

/**
 * DueDateBadge Component
 *
 * Displays a color-coded badge to indicate task due date status with accessible design.
 *
 * Features:
 * - Color-coded by status (Overdue: red, Due Today: orange, Upcoming: gray)
 * - Includes calendar icon for accessibility
 * - Supports responsive sizing
 * - Human-readable status text
 *
 * @example
 * // Display upcoming due date badge
 * <DueDateBadge
 *   dueDate="2026-02-15"
 *   isDueToday={false}
 *   isOverdue={false}
 *   daysUntilDue={5}
 * />
 *
 * @example
 * // Display overdue badge
 * <DueDateBadge
 *   dueDate="2026-02-01"
 *   isDueToday={false}
 *   isOverdue={true}
 *   daysUntilDue={-9}
 *   size="sm"
 * />
 */
export function DueDateBadge({
  dueDate,
  isOverdue = false,
  isDueToday = false,
  daysUntilDue,
  size = 'md',
  showIcon = true,
  showText = true,
}: DueDateBadgeProps) {
  const label = formatDueDateStatus(isOverdue, isDueToday, daysUntilDue)
  const iconSize = getIconSize(size)

  // Subtle colors based on due date status
  let color = '#6b7280' // default gray for upcoming
  if (isOverdue) {
    color = '#991b1b' // red-900 (subtle red for overdue)
  } else if (isDueToday) {
    color = '#b45309' // amber-700 (subtle orange for due today)
  }

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div
      className={`inline-flex items-center gap-1 ${textSizeMap[size]}`}
      style={{ color }}
      title={`${label} - ${dueDate}`}
      role="badge"
      aria-label={`Due date: ${label}`}
    >
      {showIcon &&
        (isOverdue ? (
          <AlertCircle size={iconSize} strokeWidth={2} />
        ) : (
          <Calendar size={iconSize} strokeWidth={2} />
        ))
      }
      {showText && <span className="font-medium">{label}</span>}
    </div>
  )
}
