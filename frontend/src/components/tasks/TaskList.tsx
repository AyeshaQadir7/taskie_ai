/**
 * TaskList Component
 * Displays array of tasks with optional grouping by completion status
 */

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Task } from '@/lib/api/types'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => Promise<void>
  onComplete?: (taskId: string) => Promise<void>
  onSortChange?: (sortBy: string) => void
  sortBy?: string
  isLoading?: boolean
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onSortChange,
  sortBy = 'newest',
  isLoading = false,
}: TaskListProps) {
  if (tasks.length === 0) {
    return null
  }

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center gap-3">
        <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange?.(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
        >
          <option value="newest">Newest First</option>
          <option value="priority">Priority</option>
          <option value="due_date">Due Date (Earliest)</option>
          <option value="-due_date">Due Date (Latest)</option>
        </select>
      </div>
      {/* Incomplete Tasks Section */}
      {incompleteTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Active Tasks
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {incompleteTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Completed
            </h2>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
