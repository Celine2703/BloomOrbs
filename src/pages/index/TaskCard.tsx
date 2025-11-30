import React from "react";
import { Check, Calendar, User } from "lucide-react";
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
  const group = task.group ? groupConfig[task.group] : { bg: "#f8f9fa", border: "#e9ecef" };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  return (
    <div className="relative">
      {/* Main Task Card - Rectangular Design */}
      <div
        onDoubleClick={onDoubleClick}
        className={`relative rounded-xl shadow-lg border-2 w-[320px] h-[180px] cursor-move transition-all duration-200 overflow-hidden ${
          isDragging ? "shadow-2xl scale-105 rotate-2" : "hover:shadow-xl"
        }`}
        style={{
          backgroundColor: group.bg,
          borderColor: group.border,
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 pb-2">
          {/* Left: Status */}
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm"
            style={{
              backgroundColor: status.bg,
              color: status.text,
            }}
          >
            {status.label}
          </div>

          {/* Right: Assignee Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-white/20"
            style={{ backgroundColor: axisColor }}
          >
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Due Date - Top Left under status */}
        {task.due && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(task.due)}</span>
            </div>
          </div>
        )}

        {/* Task Title - Center */}
        <div className="px-4 py-3 flex items-center justify-center h-[80px]">
          <div className="font-bold text-lg text-gray-900 text-center leading-tight line-clamp-3">
            {task.title}
          </div>
        </div>

        {/* Bottom Progress Bar for Subtasks */}
        {hasSubtasks && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">
                Sous-tâches
              </span>
              <span className="text-xs font-bold text-gray-800">
                {subtasks.filter(st => st.completed).length}/{subtasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(subtasks.filter(st => st.completed).length / subtasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Decorative corner element */}
        <div 
          className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full"
          style={{ backgroundColor: axisColor }}
        />
      </div>
    </div>
  );
}
