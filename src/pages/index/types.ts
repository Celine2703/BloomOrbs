export type Status = "draft" | "to-do" | "doing" | "done";
export type Priority = "low" | "medium" | "high" | "critical";

export type Task = {
  id: string;
  axisId: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  start: string | null;
  due: string | null;
  description?: string;
  duration?: number | null;
  position: { x: number; y: number };
  // temporary flag used for tasks created but not yet saved in the editor
  temporary?: boolean;
};

export type Edge = { from: string; to: string };

export type Axis = { id: string; name: string; color: string };
