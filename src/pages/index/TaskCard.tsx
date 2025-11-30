import React from "react";
import { Check, Calendar } from "lucide-react";
import type { Task, Status, Priority } from "./types";

type StatusConfig = Record<Status, { bg: string; text: string; label: string }>;
type PriorityConfig = Record<Priority, { bg: string; text: string; label: string }>;
type GroupConfig = Record<string, { bg: string; border: string }>;

export default function TaskCard({
  task,
  onDoubleClick,
  isDragging,
  axisColor,
  statusConfig,
  priorityConfig,
  groupConfig,
}: {
  task: Task;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
  isDragging: boolean;
  axisColor: string;
  statusConfig: StatusConfig;
  priorityConfig: PriorityConfig;
  groupConfig: GroupConfig;
}) {
  const status = statusConfig[task.status];
  const initials = task.assignee?.split(" ").map((n) => n[0]).join("") || "?";
  const group = task.group ? groupConfig[task.group] : { bg: "hsl(var(--muted))", border: "hsl(var(--border))" };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "numeric" });
  };

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  return (
    <div className="relative">
      {/* Main Task Card */}
      <div
        onDoubleClick={onDoubleClick}
        className={`relative rounded-2xl shadow-md border-2 w-[280px] min-h-[160px] cursor-move transition-all ${isDragging ? "shadow-2xl scale-105" : ""}`}
        style={{
          backgroundColor: group.bg,
          borderColor: group.border,
        }}
      >
        {/* Header: Status and Due Date */}
        <div className="flex items-start justify-between p-3 pb-1">
          <div
            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase"
            style={{
              backgroundColor: status.bg,
              color: status.text,
            }}
          >
            {status.label}
          </div>
          
          {task.due && (
            <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due)}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar - Top Right Corner */}
        <div className="absolute top-3 right-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: axisColor }}
          >
            {initials}
          </div>
        </div>

        {/* Task Title - Center */}
        <div className="px-3 py-6 flex items-center justify-center min-h-[80px]">
          <div className="font-bold text-base text-gray-900 text-center line-clamp-3">
            {task.title}
          </div>
        </div>

        {/* Subtasks at bottom if any */}
        {hasSubtasks && (
          <div className="px-3 pb-3 space-y-1">
            <div className="text-[10px] text-gray-600 font-medium mb-1">
              Subtasks ({subtasks.filter(st => st.completed).length}/{subtasks.length})
            </div>
            {subtasks.slice(0, 2).map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${subtask.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'}`}>
                  {subtask.completed && <Check className="w-2 h-2 text-white" />}
                </div>
                <span className={`flex-1 truncate ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
            {subtasks.length > 2 && (
              <div className="text-[10px] text-gray-500 pl-4">+{subtasks.length - 2} more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
