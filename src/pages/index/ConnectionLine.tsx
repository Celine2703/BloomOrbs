import React from "react";
import type { Task } from "./types";

export default function ConnectionLine({
  from,
  to,
  containerRef,
}: {
  from: Task;
  to: Task;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const fromEl = containerRef.current?.querySelector(`[data-task-id="${from.id}"]`);
  const toEl = containerRef.current?.querySelector(`[data-task-id="${to.id}"]`);

  if (!fromEl || !toEl || !containerRef.current) return null;

  const container = containerRef.current.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const fromX = fromRect.right - container.left;
  const fromY = fromRect.top + fromRect.height / 2 - container.top;
  const toX = toRect.left - container.left;
  const toY = toRect.top + toRect.height / 2 - container.top;

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
