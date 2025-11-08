import React from "react";
import type { Task } from "./types";

// Constants matching TaskCard visual size
const TASK_WIDTH = 420;
const TASK_HEIGHT = 64; // h-16

export default function ConnectionLine({
  from,
  to,
}: {
  from: Task;
  to: Task;
}) {
  // Use task.position coordinates directly so links render immediately
  // Positions are in canvas coordinates; the SVG shares the same coordinate space.
  if (!from?.position || !to?.position) return null;

  const fromX = from.position.x + TASK_WIDTH; // right edge of source
  const fromY = from.position.y + TASK_HEIGHT / 2;
  const toX = to.position.x; // left edge of target
  const toY = to.position.y + TASK_HEIGHT / 2;

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
