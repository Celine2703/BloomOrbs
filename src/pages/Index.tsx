import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// zoom/pan implemented manually using scroll + CSS scale
import SidePanel from "./index/SidePanel"; // Ensure this import is present
import Toolbar from "./index/Toolbar";
import ZoomControls from "./index/ZoomControls";
import type { Status, Priority, Task, Edge, Axis } from "./index/types";
import TaskCard from "./index/TaskCard";
import ConnectionLine from "./index/ConnectionLine";

const STATUSES: Status[] = ["draft", "to-do", "doing", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

// Task visual constants (should match TaskCard dimensions)
const TASK_WIDTH = 420;
const TASK_HEIGHT = 64;

// Edge and Axis types are imported from ./index/types


const axes: Axis[] = [
  { id: "AX-01", name: "Experimental Methods", color: "hsl(var(--axis-01))" },
  { id: "AX-02", name: "Field Collection", color: "hsl(var(--axis-02))" },
  { id: "AX-03", name: "Analysis & Publication", color: "hsl(var(--axis-03))" },
];

const initialTasks: Task[] = [
  { id: "T-003", axisId: "AX-01", title: "Validate specifications", status: "done", priority: "medium", assignee: "J. Martin", start: null, due: "2025-11-06", description: "Validation of specifications.", position: { x: 100, y: 240 } },
  { id: "T-007", axisId: "AX-01", title: "Write experimental protocol", status: "to-do", priority: "high", assignee: "A. Leroy", start: "2025-11-04", due: "2025-11-18", description: "Define samples.", position: { x: 520, y: 160 } },
  { id: "T-009", axisId: "AX-01", title: "Order reagents", status: "doing", priority: "medium", assignee: "P. Diallo", start: null, due: "2025-11-12", description: "Supplier orders.", position: { x: 1000, y: 160 } },
  { id: "T-012", axisId: "AX-02", title: "Data cleaning V1", status: "to-do", priority: "medium", assignee: "K. Dupont", start: null, due: "2025-12-05", description: "Quality controls.", position: { x: 60, y: 340 } },
  { id: "T-015", axisId: "AX-03", title: "Preliminary statistical analysis", status: "draft", priority: "high", assignee: "M. Silva", start: null, due: "2025-12-12", description: "Linear models.", position: { x: 560, y: 340 } },
  { id: "T-018", axisId: "AX-03", title: "Pre-print writing", status: "draft", priority: "critical", assignee: "C. Bernard", start: null, due: "2025-12-20", description: "Introduction, methods.", position: { x: 1020, y: 340 } },
  { id: "T-021", axisId: "AX-03", title: "Submission", status: "to-do", priority: "medium", assignee: "Team", start: null, due: "2026-01-10", description: "Final submission.", position: { x: 1500, y: 340 } },
];

const initialEdges: Edge[] = [
  { from: "T-003", to: "T-007" },
  { from: "T-007", to: "T-009" },
  { from: "T-012", to: "T-015" },
  { from: "T-015", to: "T-018" },
  { from: "T-018", to: "T-021" },
];

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  draft: { bg: "hsl(var(--status-draft))", text: "hsl(var(--status-draft-fg))", label: "DRAFT" },
  "to-do": { bg: "hsl(var(--status-todo))", text: "hsl(var(--status-todo-fg))", label: "TO-DO" },
  doing: { bg: "hsl(var(--status-doing))", text: "hsl(var(--status-doing-fg))", label: "DOING" },
  done: { bg: "hsl(var(--status-done))", text: "hsl(var(--status-done-fg))", label: "DONE" },
};

const priorityConfig: Record<Priority, { bg: string; text: string; label: string }> = {
  low: { bg: "hsl(var(--priority-low))", text: "hsl(var(--priority-low-fg))", label: "LOW" },
  medium: { bg: "hsl(var(--priority-medium))", text: "hsl(var(--priority-medium-fg))", label: "MED" },
  high: { bg: "hsl(var(--priority-high))", text: "hsl(var(--priority-high-fg))", label: "HIGH" },
  critical: { bg: "hsl(var(--priority-critical))", text: "hsl(var(--priority-critical-fg))", label: "CRIT" },
};

/* TaskCard and ConnectionLine components have been moved to
   src/pages/index/TaskCard.tsx and src/pages/index/ConnectionLine.tsx */

type ClientPoint = { x: number; y: number };

const extractClientPoint = (event: any): ClientPoint | null => {
  if (!event) return null;
  if (typeof event.clientX === "number" && typeof event.clientY === "number") {
    return { x: event.clientX, y: event.clientY };
  }
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  if (touch && typeof touch.clientX === "number" && typeof touch.clientY === "number") {
    return { x: touch.clientX, y: touch.clientY };
  }
  return null;
};

export default function Index() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [activeAxis, setActiveAxis] = useState<string | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  // manual zoom/scroll implementation
  const currentScaleRef = useRef<number>(1);
  const [scale, setScale] = useState<number>(1);
  const currentPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const didRebaseRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  // temporary offsets used while dragging so connections can render live
  const tempOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const [, setDragTick] = useState(0);
  // pointer offset within the task recorded at drag start (canvas units)
  const pointerOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  // record the task's position at the start of a drag to avoid race conditions
  const dragStartPosRef = useRef<Record<string, { x: number; y: number }>>({});
  // link creation state when user drags from a task side to another task
  const linkStateRef = useRef<null | { fromId: string; fromSide: 'left' | 'right'; start: { x: number; y: number } }>(null);
  const [tempLink, setTempLink] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  // hover state to show subtle visual when pointer is in the link-creation zone of a task
  const [hoverLinkZone, setHoverLinkZone] = useState<{ taskId: string; side: 'left' | 'right' } | null>(null);
  // while dragging a link, highlight potential target task and track pointer screen coords
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [pointerScreen, setPointerScreen] = useState<{ x: number; y: number } | null>(null);
  // hovered task / handle for showing handles & tooltips
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<{ taskId: string; side: 'left' | 'right' } | null>(null);
  const dragStateRef = useRef<{
    taskId: string;
    pointerId: number | null;
    pointerOffset: { x: number; y: number };
  } | null>(null);
  const cleanupDragListenersRef = useRef<(() => void) | null>(null);

  const axisById = Object.fromEntries(axes.map(a => [a.id, a]));
  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]));
  const selectedTaskData = selectedTask ? taskById[selectedTask] : null;

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    if (!viewportRef.current) return null;
    const rect = viewportRef.current.getBoundingClientRect();
    const currentScale = currentScaleRef.current || scale || 1;
    return {
      x: (viewportRef.current.scrollLeft + clientX - rect.left) / currentScale,
      y: (viewportRef.current.scrollTop + clientY - rect.top) / currentScale,
    };
  }, [scale]);

  const beginDrag = useCallback((task: Task, nativeEvent: Event, hostElement?: Element | null) => {
    try {
      nativeEvent.stopPropagation?.();
      nativeEvent.preventDefault?.();
    } catch {}
    const point = extractClientPoint(nativeEvent);
    const canvasPoint = point ? getCanvasPoint(point.x, point.y) : null;
    if (!canvasPoint) return;

    const pointerId = typeof (nativeEvent as PointerEvent)?.pointerId === "number"
      ? (nativeEvent as PointerEvent).pointerId
      : null;
    const usePointerEvents = pointerId !== null;
    dragStateRef.current = {
      taskId: task.id,
      pointerId,
      pointerOffset: {
        x: canvasPoint.x - task.position.x,
        y: canvasPoint.y - task.position.y,
      },
    };
    setDraggedTask(task.id);
    // record the start position for this drag
    try { dragStartPosRef.current[task.id] = { x: task.position.x, y: task.position.y }; } catch {}

    let cleanup: (() => void) | null = null;

    const handleMove = (evt: Event) => {
      if (!dragStateRef.current || dragStateRef.current.taskId !== task.id) return;
      const native = evt as PointerEvent | TouchEvent | MouseEvent;
      if (dragStateRef.current.pointerId !== null && 'pointerId' in native) {
        if (native.pointerId !== dragStateRef.current.pointerId) {
          return;
        }
      }
      const clientPoint = extractClientPoint(native);
      if (!clientPoint) return;
      const canvasPt = getCanvasPoint(clientPoint.x, clientPoint.y);
      if (!canvasPt) return;
      if (typeof (native as any).preventDefault === "function") {
        try { native.preventDefault(); } catch {}
      }
      const nextPosition = {
        x: Math.max(0, Math.round(canvasPt.x - dragStateRef.current.pointerOffset.x)),
        y: Math.max(0, Math.round(canvasPt.y - dragStateRef.current.pointerOffset.y)),
      };
      setTasks(prev => prev.map(t => {
        if (t.id !== task.id) return t;
        if (t.position.x === nextPosition.x && t.position.y === nextPosition.y) {
          return t;
        }
        return { ...t, position: nextPosition };
      }));
    };

    const handleUp = (evt: Event) => {
      const native = evt as PointerEvent | TouchEvent | MouseEvent;
      if (dragStateRef.current?.pointerId !== null && 'pointerId' in native) {
        if (native.pointerId !== dragStateRef.current.pointerId) {
          return;
        }
      }
      if (typeof (native as any).preventDefault === "function") {
        try { native.preventDefault(); } catch {}
      }
      cleanup?.();
    };

    cleanup = () => {
      const target = hostElement ?? window;
      try { (target as any).removeEventListener('pointermove', handleMove as EventListener); } catch {}
      try { (target as any).removeEventListener('pointerup', handleUp as EventListener); } catch {}
      try { (target as any).removeEventListener('pointercancel', handleUp as EventListener); } catch {}
      try { (target as any).removeEventListener('mousemove', handleMove as EventListener); } catch {}
      try { (target as any).removeEventListener('mouseup', handleUp as EventListener); } catch {}
      try { (target as any).removeEventListener('touchmove', handleMove as EventListener); } catch {}
      try { (target as any).removeEventListener('touchend', handleUp as EventListener); } catch {}
      try { (target as any).removeEventListener('touchcancel', handleUp as EventListener); } catch {}
      dragStateRef.current = null;
      try { delete dragStartPosRef.current[task.id]; } catch {}
      setDraggedTask(null);
      cleanupDragListenersRef.current = null;
  try { /* cleanup */ } catch {}
    };

    cleanupDragListenersRef.current?.();
    if (cleanup) {
      cleanupDragListenersRef.current = cleanup;
    }

    const target = hostElement ?? window;
    if (usePointerEvents) {
      try { (target as any).addEventListener('pointermove', handleMove as EventListener, { passive: false }); } catch {}
      try { (target as any).addEventListener('pointerup', handleUp as EventListener); } catch {}
      try { (target as any).addEventListener('pointercancel', handleUp as EventListener); } catch {}
    } else {
      try { (target as any).addEventListener('mousemove', handleMove as EventListener); } catch {}
      try { (target as any).addEventListener('mouseup', handleUp as EventListener); } catch {}
      try { (target as any).addEventListener('touchmove', handleMove as EventListener, { passive: false }); } catch {}
      try { (target as any).addEventListener('touchend', handleUp as EventListener); } catch {}
      try { (target as any).addEventListener('touchcancel', handleUp as EventListener); } catch {}
    }
  }, [getCanvasPoint]);

  // helper to start creating a link from a task side
  const startLinkFrom = useCallback((task: Task, side: 'left' | 'right', host: Element, nativeEvent?: Event) => {
    const start = { x: task.position.x + (side === 'left' ? 0 : TASK_WIDTH), y: task.position.y + TASK_HEIGHT / 2 };
    linkStateRef.current = { fromId: task.id, fromSide: side, start };
    setTempLink({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });
    try { (host as Element).setPointerCapture?.((nativeEvent as any)?.pointerId ?? 0); } catch {}

    const move = (ev: Event) => {
      const p = extractClientPoint(ev);
      if (!p) return;
      const c = getCanvasPoint(p.x, p.y);
      if (!c) return;
      setTempLink(prev => prev ? { ...prev, x2: c.x, y2: c.y } : null);
      // update pointer screen coordinates for tooltip
      setPointerScreen({ x: p.x, y: p.y });
      // highlight potential target under pointer
      const target = tasks.find(t => {
        if (t.id === task.id) return false;
        return c.x >= t.position.x && c.x <= t.position.x + TASK_WIDTH && c.y >= t.position.y && c.y <= t.position.y + TASK_HEIGHT;
      });
      setHoverTargetId(target ? target.id : null);
    };

    const up = (ev: Event) => {
      try { (host as Element).releasePointerCapture?.((ev as any).pointerId); } catch {}
      const p = extractClientPoint(ev);
      const c = p ? getCanvasPoint(p.x, p.y) : null;
      if (c && linkStateRef.current) {
        // capture fromId locally so async/react callbacks don't observe a cleared ref
        const fromId = linkStateRef.current.fromId;
        const target = tasks.find(t => {
          if (t.id === fromId) return false;
          return c.x >= t.position.x && c.x <= t.position.x + TASK_WIDTH && c.y >= t.position.y && c.y <= t.position.y + TASK_HEIGHT;
        });
        if (target) {
          setEdges(prev => (prev.some(e => e.from === fromId && e.to === target.id) ? prev : [...prev, { from: fromId, to: target.id }]));
        }
      }
      setTempLink(null);
      linkStateRef.current = null;
      setHoverTargetId(null);
      setPointerScreen(null);
      try { host.removeEventListener('pointermove', move as EventListener); } catch {}
      try { host.removeEventListener('pointerup', up as EventListener); } catch {}
    };

    try { host.addEventListener('pointermove', move as EventListener); } catch {}
    try { host.addEventListener('pointerup', up as EventListener); } catch {}
  }, [getCanvasPoint, tasks]);

  // center viewport on load so horizontal panning feels natural
  useEffect(() => {
    if (!viewportRef.current) return;
    const vp = viewportRef.current;
    // place existing tasks around the center of the canvas on first load
    // so the UI starts centered rather than in the top-left.
    const canvasCenter = { x: 10000, y: 10000 };
    if (!didRebaseRef.current) {
      if (tasks.length > 0) {
        const avgX = Math.round(tasks.reduce((s, t) => s + t.position.x, 0) / tasks.length);
        const avgY = Math.round(tasks.reduce((s, t) => s + t.position.y, 0) / tasks.length);
        const deltaX = canvasCenter.x - avgX;
        const deltaY = canvasCenter.y - avgY;
        // shift tasks by delta so their centroid moves to canvas center
        setTasks((prev) => prev.map(t => ({ ...t, position: { x: Math.max(0, t.position.x + deltaX), y: Math.max(0, t.position.y + deltaY) } })));
        const s = currentScaleRef.current || scale || 1;
        vp.scrollLeft = Math.max(0, Math.round(canvasCenter.x * s - vp.clientWidth / 2));
        vp.scrollTop = Math.max(0, Math.round(canvasCenter.y * s - vp.clientHeight / 2));
      } else {
        vp.scrollLeft = Math.round((20000 - vp.clientWidth) / 2);
        vp.scrollTop = Math.round((20000 - vp.clientHeight) / 2);
      }
      didRebaseRef.current = true;
    } else {
      // fallback: keep previous behavior
      if (tasks.length > 0) {
        const avgX = Math.round(tasks.reduce((s, t) => s + t.position.x, 0) / tasks.length);
        const avgY = Math.round(tasks.reduce((s, t) => s + t.position.y, 0) / tasks.length);
        const s = currentScaleRef.current || scale || 1;
        vp.scrollLeft = Math.max(0, Math.round(avgX * s - vp.clientWidth / 2));
        vp.scrollTop = Math.max(0, Math.round(avgY * s - vp.clientHeight / 2));
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupDragListenersRef.current?.();
    };
  }, []);

  // while user is creating a link, disable text selection and change cursor to crosshair
  useEffect(() => {
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    if (tempLink) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.userSelect = prevSelect || '';
      document.body.style.cursor = prevCursor || '';
    }
    return () => {
      document.body.style.userSelect = prevSelect || '';
      document.body.style.cursor = prevCursor || '';
    };
  }, [tempLink]);

  // cancel link creation with Escape
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && tempLink) {
        setTempLink(null);
        linkStateRef.current = null;
        setHoverTargetId(null);
        setPointerScreen(null);
      }
    };
    if (tempLink) document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [tempLink]);

  const addNewTask = () => {
    const id = `T-${Date.now().toString().slice(-6)}`;
    // place new task at center of the canvas and center the viewport on it (like Reset)
    const canvasCenter = { x: 10000, y: 10000 };
    // Task visual size ~420x64, position is top-left; center task on canvas center
    const taskHalfWidth = 210; // 420 / 2
    const taskHalfHeight = 32; // 64 / 2
    let pos = { x: Math.max(20, canvasCenter.x - taskHalfWidth), y: Math.max(20, canvasCenter.y - taskHalfHeight) };
    try {
      if (viewportRef.current) {
        // after placing, center viewport on the new task
        const vp = viewportRef.current;
        const s = currentScaleRef.current || scale || 1;
        const left = Math.round(pos.x * s - vp.clientWidth / 2);
        const top = Math.round(pos.y * s - vp.clientHeight / 2);
        requestAnimationFrame(() => {
          vp.scrollLeft = Math.max(0, left);
          vp.scrollTop = Math.max(0, top);
        });
      }
    } catch {}
    const newTask: Task = {
      id,
      axisId: axes[0].id,
      title: "New Task",
      status: "draft",
      priority: "low",
      assignee: null,
      start: null,
      due: null,
      description: "",
      duration: null,
      position: pos,
      temporary: true,
    };
    setTasks((prev) => [...prev, newTask]);
    setSelectedTask(id);
    setEditedTask(newTask);
    setEditMode(true);
  };

  const filteredTasks = tasks.filter(t => {
    if (activeAxis && t.axisId !== activeAxis) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const visibleTaskIds = useMemo(() => new Set(filteredTasks.map(t => t.id)), [filteredTasks]);

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <Toolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        STATUSES={STATUSES}
        PRIORITIES={PRIORITIES}
        statusConfig={statusConfig}
        priorityConfig={priorityConfig}
        axes={axes}
        activeAxis={activeAxis}
        setActiveAxis={setActiveAxis}
        showCriticalPath={showCriticalPath}
        setShowCriticalPath={setShowCriticalPath}
        onAddTask={addNewTask}
      />

      {/* Canvas */}
      <main className="p-6">
        {/* manual zoom controls + scrollable viewport */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <ZoomControls
            zoomIn={() => {
              const newScale = Math.min(2, +(scale + 0.1).toFixed(2));
              // adjust scroll to keep center
              if (viewportRef.current) {
                const vp = viewportRef.current;
                const rect = vp.getBoundingClientRect();
                const cx = vp.scrollLeft + rect.width / 2;
                const cy = vp.scrollTop + rect.height / 2;
                const ratio = newScale / scale;
                const newLeft = Math.round(cx * ratio - rect.width / 2);
                const newTop = Math.round(cy * ratio - rect.height / 2);
                setScale(newScale);
                currentScaleRef.current = newScale;
                requestAnimationFrame(() => {
                  vp.scrollLeft = newLeft;
                  vp.scrollTop = newTop;
                });
              } else {
                setScale(newScale);
                currentScaleRef.current = newScale;
              }
            }}
            zoomOut={() => {
              const newScale = Math.max(0.3, +(scale - 0.1).toFixed(2));
              if (viewportRef.current) {
                const vp = viewportRef.current;
                const rect = vp.getBoundingClientRect();
                const cx = vp.scrollLeft + rect.width / 2;
                const cy = vp.scrollTop + rect.height / 2;
                const ratio = newScale / scale;
                const newLeft = Math.round(cx * ratio - rect.width / 2);
                const newTop = Math.round(cy * ratio - rect.height / 2);
                setScale(newScale);
                currentScaleRef.current = newScale;
                requestAnimationFrame(() => {
                  vp.scrollLeft = newLeft;
                  vp.scrollTop = newTop;
                });
              } else {
                setScale(newScale);
                currentScaleRef.current = newScale;
              }
            }}
            resetTransform={() => {
              const newScale = 1;
              setScale(1);
              currentScaleRef.current = 1;
              if (viewportRef.current) {
                const vp = viewportRef.current;
                vp.scrollLeft = Math.round((20000 - vp.clientWidth) / 2);
                vp.scrollTop = Math.round((20000 - vp.clientHeight) / 2);
              }
            }}
          />
        </div>

        <div ref={viewportRef} style={{ width: "100%", height: "calc(100vh - 200px)", overflow: 'auto' }}>
          <div style={{ width: 20000, height: 20000 }}>
            {/* scaled canvas container */}
            <div
              ref={containerRef}
              onDoubleClick={(e) => {
                // double-click on background to add task
                if (!viewportRef.current) return;
                // if double-click happened on a task or a connection path, ignore here
                const targetEl = (e.target as Element) || null;
                if (targetEl && (targetEl.closest('[data-task-id]') || targetEl.closest('path') || targetEl.closest('g'))) {
                  return;
                }
                const rect = viewportRef.current.getBoundingClientRect();
                const scaleLocal = currentScaleRef.current || scale || 1;
                const clientX = (e as React.MouseEvent).clientX ?? 0;
                const clientY = (e as React.MouseEvent).clientY ?? 0;
                const canvasX = (viewportRef.current.scrollLeft + clientX - rect.left) / scaleLocal;
                const canvasY = (viewportRef.current.scrollTop + clientY - rect.top) / scaleLocal;
                try { /* dblclick debug removed */ } catch {}
                const id = `T-${Date.now().toString().slice(-6)}`;
                // place new task so its left area is near the cursor (not centered)
                const leftOffset = 80; // px from left edge of task to place cursor over
                const topOffset = 32; // half task height to roughly center vertically
                const newTask: Task = {
                  id,
                  axisId: axes[0].id,
                  title: "New Task",
                  status: "draft",
                  priority: "low",
                  assignee: null,
                  start: null,
                  due: null,
                  description: "",
                  duration: null,
                  position: { x: Math.max(20, Math.round(canvasX - leftOffset)), y: Math.max(20, Math.round(canvasY - topOffset)) },
                  temporary: true,
                };
                setTasks((prev) => [...prev, newTask]);
                setSelectedTask(id);
                setEditedTask(newTask);
                setEditMode(true);
              }}
              onPointerDown={(e) => {
                // start panning when clicking on background
                if (!viewportRef.current) return;
                isPanningRef.current = true;
                panStartRef.current = { x: e.clientX, y: e.clientY, left: viewportRef.current.scrollLeft, top: viewportRef.current.scrollTop };
                (e.target as Element).setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isPanningRef.current || !viewportRef.current || !panStartRef.current) return;
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;
                viewportRef.current.scrollLeft = Math.max(0, Math.round(panStartRef.current.left - dx));
                viewportRef.current.scrollTop = Math.max(0, Math.round(panStartRef.current.top - dy));
              }}
              onPointerUp={(e) => {
                isPanningRef.current = false;
                panStartRef.current = null;
                try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
              }}
              onPointerCancel={() => { isPanningRef.current = false; panStartRef.current = null; }}
              className="relative bg-white rounded-lg shadow-sm border border-gray-200"
              style={{ width: "20000px", height: "20000px", transform: `scale(${scale})`, transformOrigin: '0 0', touchAction: 'none', cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
            >
              {/* SVG for connections */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#374151" />
                  </marker>
                </defs>
                {edges.map((edge, idx) => {
                  const fromTask = taskById[edge.from];
                  const toTask = taskById[edge.to];
                  if (!fromTask || !toTask) return null;
                  if (!visibleTaskIds.has(edge.from) || !visibleTaskIds.has(edge.to)) return null;
                  if (activeAxis && (fromTask.axisId !== activeAxis || toTask.axisId !== activeAxis)) return null;
                  // render path and allow click to edit/remove link
                  return (
                    <g key={idx}>
                      <ConnectionLine from={fromTask} to={toTask} offsets={tempOffsetsRef.current} />
                      {/* clickable wide invisible path computed from task positions */}
                      <path
                        d={(() => {
                          const fromX = (fromTask.position?.x ?? 0) + (tempOffsetsRef.current[fromTask.id]?.x ?? 0) + TASK_WIDTH;
                          const fromY = (fromTask.position?.y ?? 0) + (tempOffsetsRef.current[fromTask.id]?.y ?? 0) + TASK_HEIGHT / 2;
                          const toX = (toTask.position?.x ?? 0) + (tempOffsetsRef.current[toTask.id]?.x ?? 0);
                          const toY = (toTask.position?.y ?? 0) + (tempOffsetsRef.current[toTask.id]?.y ?? 0) + TASK_HEIGHT / 2;
                          const dx = toX - fromX;
                          const controlX1 = fromX + dx * 0.4;
                          const controlX2 = toX - dx * 0.4;
                          return `M ${fromX} ${fromY} C ${controlX1} ${fromY}, ${controlX2} ${toY}, ${toX} ${toY}`;
                        })()}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        onClick={() => {
                          if (confirm('Remove this link?')) {
                          }
                        }}
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      />
                    </g>
                  );
                })}
                {/* temporary link while creating a connection */}
                {tempLink && (
                  <path
                    d={(() => {
                      const fromX = tempLink.x1;
                      const fromY = tempLink.y1;
                      const toX = tempLink.x2;
                      const toY = tempLink.y2;
                      const dx = toX - fromX;
                      const controlX1 = fromX + dx * 0.3;
                      const controlX2 = toX - dx * 0.3;
                      return `M ${fromX} ${fromY} C ${controlX1} ${fromY}, ${controlX2} ${toY}, ${toX} ${toY}`;
                    })()}
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="none"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </svg>
              {/* helper tooltip shown near pointer while creating a link */}
              {tempLink && pointerScreen && (
                <div style={{ position: 'fixed', left: pointerScreen.x + 12, top: pointerScreen.y + 12, zIndex: 9999, pointerEvents: 'none' }}>
                  <div style={{ background: 'rgba(15,23,42,0.9)', color: 'white', padding: '6px 8px', borderRadius: 6, fontSize: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.4)' }}>
                    {hoverTargetId ? 'Release to connect' : 'Drag to create a link'}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  data-task-id={task.id}
                  onDoubleClick={(e: React.MouseEvent) => {
                    try { (e as unknown as Event).stopPropagation(); } catch {}
                    setSelectedTask(task.id);
                    setEditedTask(task);
                    setEditMode(true);
                  }}
                  onPointerEnter={() => { try { setHoveredTaskId(task.id); } catch {} }}
                  onPointerLeave={() => { try { if (hoveredTaskId === task.id) setHoveredTaskId(null); if (hoverLinkZone?.taskId === task.id) setHoverLinkZone(null); } catch {} }}
                  onPointerDown={(e: React.PointerEvent) => {
                    try { e.stopPropagation(); } catch {}
                    const pt = extractClientPoint(e.nativeEvent as unknown as Event);
                    const canvasPt = pt ? getCanvasPoint(pt.x, pt.y) : null;
                    const HANDLE_ZONE = 20;
                    if (canvasPt) {
                      const localX = Math.round(canvasPt.x - task.position.x);
                      if (localX <= HANDLE_ZONE || localX >= TASK_WIDTH - HANDLE_ZONE) {
                        // start link creation immediately so the temporary trace follows the pointer
                        const side: 'left' | 'right' = localX <= HANDLE_ZONE ? 'left' : 'right';
                        const startPoint = { x: task.position.x + (side === 'left' ? 0 : TASK_WIDTH), y: task.position.y + TASK_HEIGHT / 2 };
                        linkStateRef.current = { fromId: task.id, fromSide: side, start: startPoint };
                        setTempLink({ x1: startPoint.x, y1: startPoint.y, x2: canvasPt.x, y2: canvasPt.y });
                        const host = viewportRef.current ?? (e.currentTarget as Element);
                        try { (host as any).setPointerCapture?.(e.pointerId); } catch {}
                        const move = (ev: Event) => {
                          const p = extractClientPoint(ev);
                          if (!p) return;
                          const c = getCanvasPoint(p.x, p.y);
                          if (!c) return;
                          setTempLink(prev => prev ? { ...prev, x2: c.x, y2: c.y } : null);
                        };
                        const up = (ev: Event) => {
                          try { (host as any).releasePointerCapture?.((ev as any).pointerId); } catch {}
                          const p = extractClientPoint(ev);
                          const c = p ? getCanvasPoint(p.x, p.y) : null;
                          if (c && linkStateRef.current) {
                            const fromId = linkStateRef.current.fromId;
                            const target = tasks.find(t => {
                              if (t.id === fromId) return false;
                              const rx = t.position.x;
                              const ry = t.position.y;
                              return c.x >= rx && c.x <= rx + TASK_WIDTH && c.y >= ry && c.y <= ry + TASK_HEIGHT;
                            });
                            if (target) {
                              setEdges(prev => (prev.some(e => e.from === fromId && e.to === target.id) ? prev : [...prev, { from: fromId, to: target.id }]));
                            }
                          }
                          setTempLink(null);
                          linkStateRef.current = null;
                          try { host.removeEventListener('pointermove', move as EventListener); } catch {}
                          try { host.removeEventListener('pointerup', up as EventListener); } catch {}
                        };
                        try { host.addEventListener('pointermove', move as EventListener); } catch {}
                        try { host.addEventListener('pointerup', up as EventListener); } catch {}
                        return;
                      }
                    }
                    // start normal drag
                    try { setDraggedTask(task.id); } catch {}
                    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch {}
                    beginDrag(task, e.nativeEvent as unknown as Event, e.currentTarget as Element);
                  }}
                  onPointerMove={(e: React.PointerEvent) => {
                    // update hover indicator for link zone
                    try { e.stopPropagation(); } catch {}
                    if (linkStateRef.current) return; // don't update hover while actively linking
                    const pt = extractClientPoint(e.nativeEvent as unknown as Event);
                    const c = pt ? getCanvasPoint(pt.x, pt.y) : null;
                    const HANDLE_ZONE = 20;
                    if (c) {
                      const localX = Math.round(c.x - task.position.x);
                      if (localX <= HANDLE_ZONE) {
                        setHoverLinkZone({ taskId: task.id, side: 'left' });
                        return;
                      } else if (localX >= TASK_WIDTH - HANDLE_ZONE) {
                        setHoverLinkZone({ taskId: task.id, side: 'right' });
                        return;
                      }
                    }
                    // if pointer not in edge zone for this task, clear only if we previously hovered this task
                    if (hoverLinkZone?.taskId === task.id) setHoverLinkZone(null);
                  }}
                  // show handles when task hovered
                  onPointerUp={(e: React.PointerEvent) => {
                    try { (e as unknown as Event).stopPropagation(); } catch {}
                    try { cleanupDragListenersRef.current?.(); } catch {}
                    try { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); } catch {}
                    try { dragStateRef.current = null; } catch {}
                    try { delete dragStartPosRef.current[task.id]; } catch {}
                    setDraggedTask(null);
                  }}
                  onClick={(e) => {
                    // shift+click to create a link from the currently selected task to this one
                    const evt = e as React.MouseEvent;
                    if (evt.shiftKey && selectedTask && selectedTask !== task.id) {
                      if (!edges.some((ed) => ed.from === selectedTask && ed.to === task.id)) {
                        setEdges((prev) => [...prev, { from: selectedTask!, to: task.id }]);
                        try { toast?.({ title: 'Link added', description: `${selectedTask} → ${task.id}` }); } catch {}
                      }
                      setSelectedTask(null);
                      return;
                    }
                    // otherwise select this task (do not open editor on single click)
                    setSelectedTask(task.id);
                    // if the side panel is already open (editMode), change which task is being edited
                    if (editMode) {
                      setEditedTask(task);
                    }
                  }}
                  // when using manual drag, background panning is prevented by pointer handlers above
                  style={{ position: "absolute", left: task.position.x, top: task.position.y, zIndex: 10, cursor: (hoverLinkZone?.taskId === task.id ? 'crosshair' : isPanningRef.current ? 'grabbing' : 'grab') }}
                >
                  {/* point handles will render below; removed the transparent edge vignette per request */}
                  {/* connection handles shown when hovering the task */}
                  {(hoveredTaskId === task.id || hoverLinkZone?.taskId === task.id) && (
                    <>
                      <div
                        onPointerDown={(e: React.PointerEvent) => {
                          try { e.stopPropagation(); e.preventDefault(); } catch {}
                          startLinkFrom(task, 'left', viewportRef.current ?? (e.currentTarget as Element), e.nativeEvent as unknown as Event);
                        }}
                        onPointerEnter={() => { try { setHoveredHandle({ taskId: task.id, side: 'left' }); } catch {} }}
                        onPointerLeave={() => { try { if (hoveredHandle?.taskId === task.id && hoveredHandle.side === 'left') setHoveredHandle(null); } catch {} }}
                        style={{ position: 'absolute', left: -8, top: TASK_HEIGHT / 2 - 8, width: 16, height: 16, borderRadius: 9999, background: '#fff', border: '2px solid rgba(37,99,235,0.95)', boxShadow: '0 2px 6px rgba(2,6,23,0.12)', zIndex: 22, cursor: 'crosshair' }}
                      />
                      <div
                        onPointerDown={(e: React.PointerEvent) => {
                          try { e.stopPropagation(); e.preventDefault(); } catch {}
                          startLinkFrom(task, 'right', viewportRef.current ?? (e.currentTarget as Element), e.nativeEvent as unknown as Event);
                        }}
                        onPointerEnter={() => { try { setHoveredHandle({ taskId: task.id, side: 'right' }); } catch {} }}
                        onPointerLeave={() => { try { if (hoveredHandle?.taskId === task.id && hoveredHandle.side === 'right') setHoveredHandle(null); } catch {} }}
                        style={{ position: 'absolute', right: -8, top: TASK_HEIGHT / 2 - 8, width: 16, height: 16, borderRadius: 9999, background: '#fff', border: '2px solid rgba(37,99,235,0.95)', boxShadow: '0 2px 6px rgba(2,6,23,0.12)', zIndex: 22, cursor: 'crosshair' }}
                      />
                    </>
                  )}
                  {/* removed right-edge vignette */}
                  {/* highlight target task when dragging a link over it */}
                  {hoverTargetId === task.id && (
                    <div style={{ position: 'absolute', left: 0, top: 0, width: TASK_WIDTH, height: TASK_HEIGHT, borderRadius: 8, boxShadow: '0 8px 20px rgba(37,99,235,0.12)', border: '2px solid rgba(37,99,235,0.85)', pointerEvents: 'none', zIndex: 21 }} />
                  )}
                  {/* tooltip when hovering a handle (non-active) */}
                  {hoveredHandle?.taskId === task.id && !tempLink && (
                    <div style={{ position: 'absolute', left: hoveredHandle.side === 'left' ? -120 : undefined, right: hoveredHandle.side === 'right' ? -120 : undefined, top: -28, zIndex: 30, pointerEvents: 'none' }}>
                      <div style={{ background: 'rgba(15,23,42,0.95)', color: 'white', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
                        Drag from this handle to create a dependency
                      </div>
                    </div>
                  )}
                  <TaskCard
                    task={task}
                    onDoubleClick={(e: React.MouseEvent) => {
                      try { e.stopPropagation(); } catch {}
                      setSelectedTask(task.id);
                      setEditedTask(task);
                      setEditMode(true);
                    }}
                    isDragging={draggedTask === task.id}
                    axisColor={axisById[task.axisId]?.color || "#000"}
                    statusConfig={statusConfig}
                    priorityConfig={priorityConfig}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Active dependencies = solid line. Completed source = dashed line.
        </div>
      </main>

      {/* Side panel: only show when editMode is true (double-click or Add opens it). Single-click selects only. */}
      <AnimatePresence>
        {editMode && selectedTaskData && (
          <SidePanel
            selectedTaskData={selectedTaskData}
            editedTask={editedTask}
            editMode={editMode}
            setEditedTask={setEditedTask}
            setEditMode={setEditMode}
            setSelectedTask={setSelectedTask}
            tasks={tasks}
            edges={edges}
            setEdges={setEdges}
            setTasks={setTasks}
            taskById={taskById}
            axisById={axisById}
            statusConfig={statusConfig}
            priorityConfig={priorityConfig}
            STATUSES={STATUSES}
            PRIORITIES={PRIORITIES}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
