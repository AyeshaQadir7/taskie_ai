'use client'

import { Calendar } from 'lucide-react'
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
 * Get color based on due date status
 */
function getDueDateColor(isOverdue: boolean, isDueToday: boolean): string {
  if (isOverdue) return '#dc2626' // red-600
  if (isDueToday) return '#ea580c' // orange-600
  return '#4b5563' // gray-700
}

/**
 * Get background color with opacity
 */
function getDueDateBgColor(isOverdue: boolean, isDueToday: boolean): string {
  if (isOverdue) return '#fecaca' // red-100
  if (isDueToday) return '#fed7aa' // orange-100
  return '#f3f4f6' // gray-100
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
  const color = getDueDateColor(isOverdue, isDueToday)
  const bgColor = getDueDateBgColor(isOverdue, isDueToday)
  const label = formatDueDateStatus(isOverdue, isDueToday, daysUntilDue)
  const iconSize = getIconSize(size)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded border font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: bgColor,
        borderColor: color,
        borderWidth: '1.5px',
        color: color,
      }}
      title={`${label} - ${dueDate}`}
      role="badge"
      aria-label={`Due date: ${label}`}
    >
      {showIcon && <Calendar size={iconSize} strokeWidth={2.5} />}
      {showText && <span>{label}</span>}
    </div>
  )
}
