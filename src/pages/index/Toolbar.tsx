import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Status, Priority, Axis } from "./types";

export default function Toolbar({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  STATUSES,
  PRIORITIES,
  statusConfig,
  priorityConfig,
  axes,
  activeAxis,
  setActiveAxis,
  showCriticalPath,
  setShowCriticalPath,
  onAddTask,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  showFilters: boolean;
  setShowFilters: (b: boolean) => void;
  statusFilter: Status | "all";
  setStatusFilter: (s: Status | "all") => void;
  priorityFilter: Priority | "all";
  setPriorityFilter: (p: Priority | "all") => void;
  STATUSES: Status[];
  PRIORITIES: Priority[];
  statusConfig: Record<Status, { bg: string; text: string; label: string }>;
  priorityConfig: Record<Priority, { bg: string; text: string; label: string }>;
  axes: Axis[];
  activeAxis: string | null;
  setActiveAxis: (a: string | null) => void;
  showCriticalPath: boolean;
  setShowCriticalPath: (b: boolean) => void;
  onAddTask?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {onAddTask && (
            <Button variant="default" size="sm" onClick={onAddTask}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
          <Button variant={showCriticalPath ? "default" : "outline"} size="sm" onClick={() => setShowCriticalPath(!showCriticalPath)}>
            Critical Path
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-600">Status:</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="all">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusConfig[s].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-600">Priority:</Label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="all">All</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {priorityConfig[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs">
        {axes.map((axis) => (
          <button
            key={axis.id}
            onClick={() => setActiveAxis(activeAxis === axis.id ? null : axis.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
              activeAxis === axis.id ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: axis.color }} />
            <span className="font-medium">{axis.id}</span>
          </button>
        ))}
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig["to-do"].bg }} />
          <span>To-do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.doing.bg }} />
          <span>Doing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.done.bg }} />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.draft.bg }} />
          <span>Draft</span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-800" />
          <span>Active blocker</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-400 border-b border-dashed" />
          <span>Resolved</span>
        </div>
      </div>
    </header>
  );
}
