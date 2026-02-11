'use client'

import { Flag } from 'lucide-react'
import { getPriorityLabel } from '@/lib/utils/priority'

/**
 * Props for the PriorityBadge component
 */
interface PriorityBadgeProps {
  /** Priority level: 'low', 'medium', or 'high' (defaults to 'medium') */
  priority?: string
  /** Badge size: 'sm' (small), 'md' (medium), 'lg' (large). Default: 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the icon (!, –, ↓). Default: true */
  showIcon?: boolean
  /** Whether to show the text label (Low, Medium, High). Default: true */
  showText?: boolean
}

/**
 * PriorityBadge Component
 *
 * Displays a color-coded badge to indicate task priority with accessible design.
 *
 * Features:
 * - Color-coded by priority (High: red, Medium: violet, Low: slate)
 * - Includes icon for accessibility (not relying on color alone)
 * - Supports responsive sizing
 * - ARIA labels for screen readers
 *
 * @example
 * // Display medium priority badge
 * <PriorityBadge priority="medium" />
 *
 * @example
 * // Display small, icon-only badge
 * <PriorityBadge priority="high" size="sm" showText={false} />
 *
 * @example
 * // Display large badge with full label
 * <PriorityBadge priority="low" size="lg" showIcon={true} showText={true} />
 */
export function PriorityBadge({
  priority,
  size = 'md',
  showIcon = true,
  showText = true,
}: PriorityBadgeProps) {
  const label = getPriorityLabel(priority)

  const iconSizeMap = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  // Color based on priority (subtle colors)
  const colorMap: Record<string, string> = {
    high: '#991b1b',      // red-900 (subtle)
    medium: '#b45309',    // amber-700 (subtle)
    low: '#059669',       // green-600 (subtle)
  }

  // Background colors (lighter versions)
  const bgColorMap: Record<string, string> = {
    high: '#fef2f2',      // red-50 (very light)
    medium: '#fffbeb',    // amber-50 (very light)
    low: '#f0fdf4',       // green-50 (very light)
  }

  // Border colors with reduced opacity
  const borderColorMap: Record<string, string> = {
    high: 'rgba(153, 27, 27, 0.2)',      // red with 20% opacity
    medium: 'rgba(180, 83, 9, 0.2)',     // amber with 20% opacity
    low: 'rgba(5, 150, 105, 0.2)',       // green with 20% opacity
  }

  const color = colorMap[priority?.toLowerCase() || 'medium'] || colorMap['medium']
  const bgColor = bgColorMap[priority?.toLowerCase() || 'medium'] || bgColorMap['medium']
  const borderColor = borderColorMap[priority?.toLowerCase() || 'medium'] || borderColorMap['medium']

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${textSizeMap[size]}`}
      title={label}
      role="badge"
      aria-label={`Priority: ${label}`}
      style={{ color, backgroundColor: bgColor, borderColor, borderWidth: '1px' }}
    >
      {showIcon && <Flag size={iconSizeMap[size]} strokeWidth={2} />}
      {showText && <span className="font-medium">{label}</span>}
    </div>
  )
}
