import React from "react";
import { Check } from "lucide-react";
import type { Task, Status, Priority } from "./types";

type StatusConfig = Record<Status, { bg: string; text: string; label: string }>;
type PriorityConfig = Record<Priority, { bg: string; text: string; label: string }>;

export default function TaskCard({
  task,
  onDoubleClick,
  isDragging,
  axisColor,
  statusConfig,
  priorityConfig,
}: {
  task: Task;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
  isDragging: boolean;
  axisColor: string;
  statusConfig: StatusConfig;
  priorityConfig: PriorityConfig;
}) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const initials = task.assignee?.split(" ").map((n) => n[0]).join("") || "?";

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  };

  const dateRange = task.start && task.due
    ? `${formatDate(task.start)} -> ${formatDate(task.due)}`
    : task.due
    ? formatDate(task.due)
    : "";

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  return (
    <div className="relative">
      {/* Main Task Card */}
      <div
        onDoubleClick={onDoubleClick}
        className={`relative bg-white rounded-full shadow-md border border-gray-200 h-16 w-[420px] flex items-center cursor-move transition-shadow ${isDragging ? "shadow-lg" : ""}`}
        style={{
          boxShadow: `0 0 0 3px ${axisColor}20`,
        }}
      >
        <div
          className="absolute left-0 h-16 w-16 rounded-l-full flex items-center justify-center"
          style={{ backgroundColor: status.bg }}
        >
          <span className="text-[9px] font-bold uppercase px-1 text-center leading-tight" style={{ color: status.text }}>
            {status.label}
          </span>
        </div>

        <div className="flex-1 px-16 py-2">
          <div className="font-semibold text-sm text-gray-900 line-clamp-1 mb-0.5">{task.title}</div>
          {dateRange && (
            <div className="text-xs text-gray-600">{dateRange}</div>
          )}
        </div>

        <div
          className="absolute right-0 h-16 w-16 rounded-r-full flex flex-col items-center justify-center gap-1 px-2"
          style={{ backgroundColor: priority.bg }}
        >
          <span className="text-[9px] font-bold uppercase" style={{ color: priority.text }}>
            {priority.label}
          </span>
          <div
            className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-[10px] font-semibold"
            style={{ color: priority.text }}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && (
        <div className="mt-1 ml-8 space-y-1">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200 text-xs w-[380px]"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${subtask.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                {subtask.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`flex-1 ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
