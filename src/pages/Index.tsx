import { useState, useRef, useCallback, useEffect } from "react";
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
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const axisById = Object.fromEntries(axes.map(a => [a.id, a]));
  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]));
  const selectedTaskData = selectedTask ? taskById[selectedTask] : null;

  // center viewport on load so horizontal panning feels natural
  useEffect(() => {
    if (!viewportRef.current) return;
    const vp = viewportRef.current;
    // center on average of existing tasks so initial tasks are visible
    if (tasks.length > 0) {
      const avgX = Math.round(tasks.reduce((s, t) => s + t.position.x, 0) / tasks.length);
      const avgY = Math.round(tasks.reduce((s, t) => s + t.position.y, 0) / tasks.length);
      const s = currentScaleRef.current || scale || 1;
      vp.scrollLeft = Math.max(0, Math.round(avgX * s - vp.clientWidth / 2));
      vp.scrollTop = Math.max(0, Math.round(avgY * s - vp.clientHeight / 2));
    } else {
      vp.scrollLeft = Math.round((20000 - vp.clientWidth) / 2);
      vp.scrollTop = Math.round((20000 - vp.clientHeight) / 2);
    }
  }, []);

  const addNewTask = () => {
    const id = `T-${Date.now().toString().slice(-6)}`;
    // place new task at center of current viewport
    let pos = { x: 200 + tasks.length * 40, y: 200 + (tasks.length % 5) * 40 };
    try {
      if (viewportRef.current) {
        const vp = viewportRef.current;
        const s = currentScaleRef.current || scale || 1;
        pos = { x: Math.round((vp.scrollLeft + vp.clientWidth / 2) / s), y: Math.round((vp.scrollTop + vp.clientHeight / 2) / s) };
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
                // if click was on a task or link, ignore here (events should have stopped propagation)
                const rect = viewportRef.current.getBoundingClientRect();
                const scaleLocal = currentScaleRef.current || scale || 1;
                const clientX = (e as React.MouseEvent).clientX ?? 0;
                const clientY = (e as React.MouseEvent).clientY ?? 0;
                const canvasX = (viewportRef.current.scrollLeft + clientX - rect.left) / scaleLocal;
                const canvasY = (viewportRef.current.scrollTop + clientY - rect.top) / scaleLocal;
                try { console.debug('dblclick addTask', { clientX, clientY, rectLeft: rect.left, rectTop: rect.top, scale: scaleLocal, canvasX, canvasY }); } catch {}
                const id = `T-${Date.now().toString().slice(-6)}`;
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
                  position: { x: Math.max(20, Math.round(canvasX)), y: Math.max(20, Math.round(canvasY)) },
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
                  if (activeAxis && (fromTask.axisId !== activeAxis || toTask.axisId !== activeAxis)) return null;
                  // render path and allow click to edit/remove link
                  return (
                    <g key={idx}>
                      <ConnectionLine from={fromTask} to={toTask} containerRef={containerRef} />
                      <path
                        d={(() => {
                          // recompute path same as ConnectionLine to attach events
                          const fromEl = containerRef.current?.querySelector(`[data-task-id="${fromTask.id}"]`);
                          const toEl = containerRef.current?.querySelector(`[data-task-id="${toTask.id}"]`);
                          if (!fromEl || !toEl || !containerRef.current) return "";
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
                          return `M ${fromX} ${fromY} C ${controlX1} ${fromY}, ${controlX2} ${toY}, ${toX} ${toY}`;
                        })()}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        onClick={() => {
                          // simple edit: ask to remove the link
                          if (confirm('Remove this link?')) {
                            setEdges((prev) => prev.filter((e) => !(e.from === edge.from && e.to === edge.to)));
                          }
                        }}
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tasks */}
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  data-task-id={task.id}
                  drag
                  dragMomentum={false}
                  onDragStart={(e) => {
                    try { (e as unknown as Event).stopPropagation(); } catch {}
                    setDraggedTask(task.id);
                  }}
                  onDrag={(e) => { try { (e as unknown as Event).stopPropagation(); } catch {} }}
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
                  }}
                  onPointerDown={(e) => {
                    // prevent pointer events from bubbling to the background panning handler
                    try { (e as unknown as Event).stopPropagation(); } catch {}
                  }}
                  onDragEnd={(e, info) => {
                    try { (e as unknown as Event).stopPropagation(); } catch {}
                    if (!viewportRef.current) { setDraggedTask(null); return; }
                    const scaleLocal = currentScaleRef.current || scale || 1;
                    // try to read the transform applied by framer-motion during drag
                    const target = (e as any).target as HTMLElement | null;
                    let tx = 0;
                    let ty = 0;
                    try {
                      if (target) {
                        const cs = window.getComputedStyle(target);
                        const tr = cs.transform || (cs as any).webkitTransform;
                        if (tr && tr !== 'none') {
                          // matrix(a, b, c, d, tx, ty) or matrix3d(..., tx, ty)
                          const m = tr.match(/matrix.*\((.+)\)/);
                          if (m) {
                            const parts = m[1].split(',').map(s => parseFloat(s.trim()));
                            if (parts.length >= 6) {
                              tx = parts[4];
                              ty = parts[5];
                            } else if (parts.length === 16) {
                              // matrix3d
                              tx = parts[12];
                              ty = parts[13];
                            }
                          }
                        }
                      }
                    } catch (err) {
                      // fallback: use info.offset as rough estimate
                      tx = info?.offset?.x ?? 0;
                      ty = info?.offset?.y ?? 0;
                    }
                    // convert the pixel translation into canvas units
                    const deltaX = tx / (scaleLocal || 1);
                    const deltaY = ty / (scaleLocal || 1);
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, position: { x: Math.max(0, Math.round(t.position.x + deltaX)), y: Math.max(0, Math.round(t.position.y + deltaY)) } } : t));
                    setDraggedTask(null);
                  }}
                  style={{ position: "absolute", left: task.position.x, top: task.position.y, zIndex: 10 }}
                >
                  <TaskCard
                    task={task}
                    onDoubleClick={(e: React.MouseEvent) => {
                      // prevent the background double-click handler from firing
                      try { e.stopPropagation(); } catch {}
                      // open editor on double-click
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

      {/* Side panel */}
      <AnimatePresence>
        {selectedTaskData && (
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
