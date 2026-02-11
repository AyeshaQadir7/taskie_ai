"use client";

/**
 * Task List Page
 * Main dashboard showing user's tasks with filter tabs
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useTasks } from "@/lib/hooks/useTasks";
import { Button } from "@/components/common/Button";
import { TaskList } from "@/components/tasks/TaskList";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { TasksSkeleton } from "@/components/skeletons/TasksSkeleton";

type FilterType = "all" | "active" | "completed";

export default function TasksPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    deleteTask,
    completeTask,
    incompleteTask,
    clearError,
  } = useTasks();
  const [isInitialized, setIsInitialized] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch tasks on component mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const loadTasks = async () => {
      try {
        await fetchTasks(user.id);
      } catch {
        // Error is handled by the hook
      } finally {
        setIsInitialized(true);
      }
    };

    loadTasks();
  }, [isAuthenticated, user?.id, fetchTasks]);

  // Show loading state while initializing
  if (!isInitialized && isLoading) {
    return <TasksSkeleton />;
  }

  // Handle unauthenticated access
  if (!isAuthenticated || !user?.id) {
    return null; // Middleware should redirect to signin
  }

  const handleEdit = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(user.id, taskId);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      // Find the task to check its current state
      const task = tasks.find((t) => t.id === taskId);
      if (task?.completed) {
        // If already completed, mark as incomplete
        await incompleteTask(user.id, taskId);
      } else {
        // If not completed, mark as complete
        await completeTask(user.id, taskId);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  const handleCreateClick = () => {
    router.push("/tasks/new");
  };

  // Calculate statistics
  const completedCount = tasks.filter((t) => t.completed).length;
  const incompleteCount = tasks.filter((t) => !t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  // Get empty state message based on filter
  const getEmptyStateMessage = () => {
    if (tasks.length === 0) {
      return {
        title: "No tasks yet",
        description: "Get started by creating your first task",
      };
    }
    if (filter === "active" && incompleteCount === 0) {
      return {
        title: "All caught up!",
        description: "You've completed all your active tasks",
      };
    }
    if (filter === "completed" && completedCount === 0) {
      return {
        title: "No completed tasks",
        description: "Your completed tasks will appear here",
      };
    }
    return null;
  };

  const emptyStateMessage = getEmptyStateMessage();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1
            className="text-4xl font-semibold"
            style={{
              color: "#323843",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            My Tasks
          </h1>
          <p className="mt-2 text-gray-600">Organize and track your work</p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={isLoading}
          variant="secondary"
          className="flex items-center whitespace-nowrap"
        >
          <Plus size={18} />
          Create Task
        </Button>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-violet" />
              <span className="text-sm font-medium text-gray-700">Progress</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-violet transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          title="Failed to load tasks"
          onDismiss={clearError}
        />
      )}

      {/* Filter Tabs */}
      {tasks.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { value: "all", label: "All", count: tasks.length },
            { value: "active", label: "Active", count: incompleteCount },
            { value: "completed", label: "Completed", count: completedCount },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as FilterType)}
              className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "border-violet text-violet-dark"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Task List or Empty State */}
      {filteredTasks.length > 0 ? (
        <TaskList
          tasks={filteredTasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={handleComplete}
          isLoading={isLoading}
        />
      ) : (
        emptyStateMessage && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 px-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {emptyStateMessage.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {emptyStateMessage.description}
            </p>
            {tasks.length === 0 && (
              <div className="mt-6">
                <Button onClick={handleCreateClick}>Create Task</Button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
