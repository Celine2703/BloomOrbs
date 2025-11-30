import React, { useState } from "react";
import { Check, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import type { Task, Status, Priority, Subtask } from "./types";

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
  onSubtaskToggle,
}: {
  task: Task;
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
  isDragging: boolean;
  axisColor: string;
  statusConfig: StatusConfig;
  priorityConfig: PriorityConfig;
  groupConfig: GroupConfig;
  onSubtaskToggle?: (taskId: string, subtaskId: string, completed: boolean) => void;
}) {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  
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
  
  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    if (onSubtaskToggle) {
      onSubtaskToggle(task.id, subtaskId, completed);
    }
  };

  const handleSubtasksClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le onDoubleClick de la carte
    setIsSubtasksExpanded(!isSubtasksExpanded);
  };

  return (
    <div className="relative">
      {/* Main Task Card - Rectangular Design */}
      <div
        onDoubleClick={onDoubleClick}
        className={`relative rounded-xl shadow-lg border-2 w-[320px] h-[180px] cursor-move transition-all duration-200 overflow-visible ${
          isDragging ? "shadow-2xl scale-105 rotate-2" : "hover:shadow-xl"
        }`}
        style={{
          backgroundColor: group.bg,
          borderColor: group.border,
        }}
      >
        {/* Status Color Bar - Top */}
        <div 
          className="absolute top-0 left-0 right-0 h-12 rounded-t-xl z-0"
          style={{
            backgroundColor: status.bg,
          }}
        />
        {/* Top Header Bar */}
        <div className="flex items-start justify-between p-4 pb-2 relative z-10">
          {/* Left side: Status only */}
          <div className="flex flex-col gap-2 flex-1">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm w-fit"
              style={{
                backgroundColor: status.bg,
                color: status.text,
              }}
            >
              {status.label}
            </div>
          </div>

          {/* Right side: Date and Assignee */}
          <div className="flex items-center gap-3">
            {/* Due Date */}
            {task.due && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(task.due)}</span>
              </div>
            )}
            
            {/* Assignee Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20 flex-shrink-0"
              style={{ backgroundColor: axisColor }}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Task Title - Center */}
        <div className="px-4 py-2 flex items-center justify-center h-[70px]">
          <div className="font-bold text-lg text-gray-900 text-center leading-tight line-clamp-3">
            {task.title}
          </div>
        </div>

        {/* Subtasks Button - Compact */}
        {hasSubtasks && !isSubtasksExpanded && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={handleSubtasksClick}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-gray-50 rounded-full shadow-md border border-gray-200 hover:border-gray-400 transition-all hover:shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium text-gray-700">
                  {subtasks.filter(st => st.completed).length}/{subtasks.length}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        )}

        {/* Expanded Subtasks Panel */}
        {hasSubtasks && isSubtasksExpanded && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-300 shadow-lg z-30 max-h-48 overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
              <span className="text-xs font-medium text-gray-600">
                Subtasks ({subtasks.filter(st => st.completed).length}/{subtasks.length})
              </span>
              <button
                onClick={handleSubtasksClick}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                <ChevronUp className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {/* Subtasks List */}
            <div className="py-1">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                      subtask.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-white border-gray-300'
                    }`}
                    onClick={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {subtask.completed && <Check className="w-2 h-2 text-white" />}
                  </button>
                  <span className={`flex-1 text-xs truncate ${
                    subtask.completed 
                      ? 'text-gray-400 line-through' 
                      : 'text-gray-700'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
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
