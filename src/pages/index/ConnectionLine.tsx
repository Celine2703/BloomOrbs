import React from "react";
import type { Task } from "./types";

// Constants matching TaskCard visual size
const TASK_WIDTH = 420;
const TASK_HEIGHT = 64; // h-16

export default function ConnectionLine({
  from,
  to,
  offsets,
}: {
  from: Task;
  to: Task;
  // offsets is a map of temporary drag offsets (canvas units)
  offsets?: Record<string, { x: number; y: number }>;
}) {
  // Use task.position coordinates directly so links render immediately
  // Positions are in canvas coordinates; the SVG shares the same coordinate space.
  if (!from?.position || !to?.position) return null;

  const offFrom = offsets?.[from.id];
  const offTo = offsets?.[to.id];
  const fromX = (from.position.x + (offFrom?.x ?? 0)) + TASK_WIDTH; // right edge of source
  const fromY = (from.position.y + (offFrom?.y ?? 0)) + TASK_HEIGHT / 2;
  const toX = (to.position.x + (offTo?.x ?? 0)); // left edge of target
  const toY = (to.position.y + (offTo?.y ?? 0)) + TASK_HEIGHT / 2;

  const dx = toX - fromX;
  const controlX1 = fromX + dx * 0.4;
  const controlX2 = toX - dx * 0.4;

  const path = `M ${fromX} ${fromY} C ${controlX1} ${fromY}, ${controlX2} ${toY}, ${toX} ${toY}`;

  const isDone = from.status === "done";
  const strokeColor = isDone ? "#9CA3AF" : "#374151";
  const strokeDasharray = isDone ? "4 4" : undefined;

  return (
    <path
      d={path}
      fill="none"
      stroke={strokeColor}
      strokeWidth="2"
      strokeDasharray={strokeDasharray}
      markerEnd="url(#arrowhead)"
    />
  );
}
