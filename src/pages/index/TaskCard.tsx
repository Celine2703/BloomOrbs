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
        className={`relative rounded-xl shadow-lg border-2 w-[320px] cursor-move transition-all duration-200 overflow-visible ${
          isDragging ? "shadow-2xl scale-105 rotate-2" : "hover:shadow-xl"
        } ${isSubtasksExpanded ? "h-auto" : "h-[180px]"}`}
        style={{
          backgroundColor: group.bg,
          borderColor: group.border,
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between p-4 pb-2">
          {/* Left side: Status and Date */}
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
            
            {/* Due Date under status */}
            {task.due && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(task.due)}</span>
              </div>
            )}
          </div>

          {/* Right: Assignee Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-white/20 flex-shrink-0"
            style={{ backgroundColor: axisColor }}
          >
            {initials}
          </div>
        </div>

        {/* Task Title - Center */}
        <div className="px-4 py-2 flex items-center justify-center h-[70px]">
          <div className="font-bold text-lg text-gray-900 text-center leading-tight line-clamp-3">
            {task.title}
          </div>
        </div>

        {/* Bottom Subtasks Section */}
        {hasSubtasks && (
          <div className={`${isSubtasksExpanded ? "relative" : "absolute bottom-0 left-0 right-0"} p-4`}>
            {/* Subtasks Header - Clickable */}
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:bg-black/5 rounded p-1 -m-1 transition-colors"
              onClick={handleSubtasksClick}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">
                  Sous-tâches
                </span>
                {isSubtasksExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <span className="text-xs font-bold text-gray-800">
                {subtasks.filter(st => st.completed).length}/{subtasks.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(subtasks.filter(st => st.completed).length / subtasks.length) * 100}%`
                }}
              />
            </div>

            {/* Expanded Subtasks List */}
            {isSubtasksExpanded && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        subtask.completed 
                          ? 'bg-green-500 border-green-500 hover:bg-green-600' 
                          : 'bg-white border-gray-400 hover:border-green-400'
                      }`}
                      onClick={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                    >
                      {subtask.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm transition-all ${
                      subtask.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-800'
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
