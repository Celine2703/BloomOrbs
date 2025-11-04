import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Lock, ZoomIn, ZoomOut, Maximize2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Status = "draft" | "to-do" | "doing" | "done";
type Priority = "low" | "medium" | "high" | "critical";

type Task = {
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
};

const STATUSES: Status[] = ["draft", "to-do", "doing", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

type Edge = { from: string; to: string };

type Axis = { id: string; name: string; color: string };

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

function TaskCard({ task, onDoubleClick, isDragging, axisColor }: { task: Task; onDoubleClick: () => void; isDragging: boolean; axisColor: string }) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const initials = task.assignee?.split(" ").map(n => n[0]).join("") || "?";

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  };

  const dateRange = task.start && task.due 
    ? `${formatDate(task.start)} -> ${formatDate(task.due)}`
    : task.due 
    ? formatDate(task.due)
    : "";

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`relative bg-white rounded-full shadow-md border border-gray-200 h-16 w-[420px] flex items-center cursor-move transition-shadow ${isDragging ? "shadow-lg" : ""}`}
      style={{
        boxShadow: `0 0 0 3px ${axisColor}20`,
      }}
    >
      {/* Status indicator - left semi-circle */}
      <div
        className="absolute left-0 h-16 w-16 rounded-l-full flex items-center justify-center"
        style={{ backgroundColor: status.bg }}
      >
        <span className="text-[9px] font-bold uppercase px-1 text-center leading-tight" style={{ color: status.text }}>
          {status.label}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 px-16 py-2">
        <div className="font-semibold text-sm text-gray-900 line-clamp-1 mb-0.5">{task.title}</div>
        {dateRange && (
          <div className="text-xs text-gray-600">{dateRange}</div>
        )}
      </div>

      {/* Priority & assignee - right semi-circle */}
      <div
        className="absolute right-0 h-16 w-16 rounded-r-full flex flex-col items-center justify-center gap-1 px-2"
        style={{ backgroundColor: priority.bg }}
      >
        <span className="text-[9px] font-bold uppercase" style={{ color: priority.text }}>
          {priority.label}
        </span>
        <div 
          className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-[10px] font-semibold"
          style={{ color: priority.text }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

function ConnectionLine({ from, to, containerRef }: { from: Task; to: Task; containerRef: React.RefObject<HTMLDivElement> }) {
  const fromEl = containerRef.current?.querySelector(`[data-task-id="${from.id}"]`);
  const toEl = containerRef.current?.querySelector(`[data-task-id="${to.id}"]`);

  if (!fromEl || !toEl || !containerRef.current) return null;

  const container = containerRef.current.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  // Calculate connection points
  const fromX = fromRect.right - container.left;
  const fromY = fromRect.top + fromRect.height / 2 - container.top;
  const toX = toRect.left - container.left;
  const toY = toRect.top + toRect.height / 2 - container.top;

  // Create smooth curve
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

  const handleDrag = useCallback((taskId: string, event: any, info: any) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, position: { x: t.position.x + info.delta.x, y: t.position.y + info.delta.y } }
        : t
    ));
  }, []);

  const axisById = Object.fromEntries(axes.map(a => [a.id, a]));
  const taskById = Object.fromEntries(tasks.map(t => [t.id, t]));
  const selectedTaskData = selectedTask ? taskById[selectedTask] : null;

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
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          <Button 
            variant={showCriticalPath ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowCriticalPath(!showCriticalPath)}
          >
            Critical Path
          </Button>
        </div>

        {/* Filter Panel */}
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
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
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
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{priorityConfig[p].label}</option>
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

        {/* Legend */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap text-xs">
          {axes.map(axis => (
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
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig["to-do"].bg }} /><span>To-do</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.doing.bg }} /><span>Doing</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.done.bg }} /><span>Done</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig.draft.bg }} /><span>Draft</span></div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-gray-800" /><span>Active blocker</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-gray-400 border-b border-dashed" /><span>Resolved</span></div>
        </div>
      </header>

      {/* Canvas */}
      <main className="p-6">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={2}
          centerOnInit
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                    <ZoomIn className="w-4 h-4 mr-1" />
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                    <ZoomOut className="w-4 h-4 mr-1" />
                    Zoom Out
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Drag canvas to pan • Scroll to zoom • Double-click task to edit
                </div>
              </div>

              <TransformComponent
                wrapperStyle={{ width: "100%", height: "600px" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div 
                  ref={containerRef}
                  className="relative bg-white rounded-lg shadow-sm border border-gray-200"
                  style={{ width: "2400px", height: "800px" }}
                >
                  {/* SVG for connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
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
                      return <ConnectionLine key={idx} from={fromTask} to={toTask} containerRef={containerRef} />;
                    })}
                  </svg>

                  {/* Tasks */}
                  {filteredTasks.map(task => (
                    <motion.div
                      key={task.id}
                      data-task-id={task.id}
                      drag
                      dragMomentum={false}
                      onDrag={(e, info) => handleDrag(task.id, e, info)}
                      onDragStart={() => setDraggedTask(task.id)}
                      onDragEnd={() => setDraggedTask(null)}
                      style={{
                        position: "absolute",
                        left: task.position.x,
                        top: task.position.y,
                        zIndex: 10,
                      }}
                    >
                      <TaskCard
                        task={task}
                        onDoubleClick={() => setSelectedTask(task.id)}
                        isDragging={draggedTask === task.id}
                        axisColor={axisById[task.axisId]?.color || "#000"}
                      />
                    </motion.div>
                  ))}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Active dependencies = solid line. Completed source = dashed line.
        </div>
      </main>

      {/* Side panel */}
      <AnimatePresence>
        {selectedTaskData && (() => {
          const currentTask = editedTask || selectedTaskData;
          const hasChanges = editedTask !== null;

          const handleEdit = () => {
            setEditedTask(selectedTaskData);
            setEditMode(true);
          };

          const handleSave = () => {
            if (editedTask) {
              setTasks(prev => prev.map(t => t.id === editedTask.id ? editedTask : t));
              toast({ title: "Task updated", description: "Changes have been saved." });
              setEditedTask(null);
              setEditMode(false);
            }
          };

          const handleCancel = () => {
            setEditedTask(null);
            setEditMode(false);
          };

          const updateField = <K extends keyof Task>(field: K, value: Task[K]) => {
            if (editedTask) {
              setEditedTask({ ...editedTask, [field]: value });
            }
          };

          return (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{editMode ? "Edit Task" : "Task Details"}</h2>
                <Button variant="ghost" size="icon" onClick={() => { setSelectedTask(null); setEditedTask(null); setEditMode(false); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {editMode ? (
                  <>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={currentTask.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          value={currentTask.status}
                          onChange={(e) => updateField('status', e.target.value as Status)}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{statusConfig[s].label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={currentTask.priority}
                          onChange={(e) => updateField('priority', e.target.value as Priority)}
                          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {PRIORITIES.map(p => (
                            <option key={p} value={p}>{priorityConfig[p].label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="assignee">Assigned to</Label>
                      <Input
                        id="assignee"
                        value={currentTask.assignee || ''}
                        onChange={(e) => updateField('assignee', e.target.value || null)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="start">Start Date</Label>
                        <Input
                          id="start"
                          type="date"
                          value={currentTask.start || ''}
                          onChange={(e) => updateField('start', e.target.value || null)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="due">Due Date</Label>
                        <Input
                          id="due"
                          type="date"
                          value={currentTask.due || ''}
                          onChange={(e) => updateField('due', e.target.value || null)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={currentTask.duration || ''}
                        onChange={(e) => updateField('duration', e.target.value ? parseInt(e.target.value) : null)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={currentTask.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="mb-2 block">Dependencies</Label>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-2">Blocked by:</div>
                          <div className="space-y-2">
                            {edges.filter(e => e.to === currentTask.id).map(e => {
                              const dep = taskById[e.from];
                              return dep ? (
                                <div key={e.from} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <span>{dep.title}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEdges(prev => prev.filter(edge => !(edge.from === e.from && edge.to === e.to)));
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : null;
                            })}
                            <select
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                              value=""
                              onChange={(e) => {
                                if (e.target.value && !edges.some(edge => edge.from === e.target.value && edge.to === currentTask.id)) {
                                  setEdges(prev => [...prev, { from: e.target.value, to: currentTask.id }]);
                                }
                              }}
                            >
                              <option value="">+ Add blocker...</option>
                              {tasks.filter(t => t.id !== currentTask.id && !edges.some(e => e.from === t.id && e.to === currentTask.id)).map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-600 mb-2">Blocks:</div>
                          <div className="space-y-2">
                            {edges.filter(e => e.from === currentTask.id).map(e => {
                              const dep = taskById[e.to];
                              return dep ? (
                                <div key={e.to} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <span>{dep.title}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setEdges(prev => prev.filter(edge => !(edge.from === e.from && edge.to === e.to)));
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : null;
                            })}
                            <select
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                              value=""
                              onChange={(e) => {
                                if (e.target.value && !edges.some(edge => edge.from === currentTask.id && edge.to === e.target.value)) {
                                  setEdges(prev => [...prev, { from: currentTask.id, to: e.target.value }]);
                                }
                              }}
                            >
                              <option value="">+ Add blocked task...</option>
                              {tasks.filter(t => t.id !== currentTask.id && !edges.some(e => e.from === currentTask.id && e.to === t.id)).map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div 
                        className="inline-block px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: statusConfig[currentTask.status].bg,
                          color: statusConfig[currentTask.status].text 
                        }}
                      >
                        {statusConfig[currentTask.status].label}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Title</div>
                      <div className="font-semibold">{currentTask.title}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Priority</div>
                      <div 
                        className="inline-block px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: priorityConfig[currentTask.priority].bg,
                          color: priorityConfig[currentTask.priority].text 
                        }}
                      >
                        {priorityConfig[currentTask.priority].label}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Assigned to</div>
                      <div>{currentTask.assignee || "—"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Start</div>
                        <div className="text-sm">{currentTask.start ? new Date(currentTask.start).toLocaleDateString("en-US") : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Due</div>
                        <div className="text-sm">{currentTask.due ? new Date(currentTask.due).toLocaleDateString("en-US") : "—"}</div>
                      </div>
                    </div>

                    {currentTask.duration && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="text-sm">{currentTask.duration} days</div>
                      </div>
                    )}

                    {currentTask.description && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Description</div>
                        <p className="text-sm text-gray-700">{currentTask.description}</p>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Research Axis</div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: axisById[currentTask.axisId]?.color }} />
                        <span className="text-sm">{axisById[currentTask.axisId]?.name}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Dependencies</div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Blocked by:</span>
                          <ul className="ml-4 mt-1">
                            {edges.filter(e => e.to === currentTask.id).map(e => {
                              const dep = taskById[e.from];
                              return dep ? <li key={e.from}>• {dep.title}</li> : null;
                            })}
                            {edges.filter(e => e.to === currentTask.id).length === 0 && <li className="text-gray-500">None</li>}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Blocks:</span>
                          <ul className="ml-4 mt-1">
                            {edges.filter(e => e.from === currentTask.id).map(e => {
                              const dep = taskById[e.to];
                              return dep ? <li key={e.to}>• {dep.title}</li> : null;
                            })}
                            {edges.filter(e => e.from === currentTask.id).length === 0 && <li className="text-gray-500">None</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-2">
                {editMode ? (
                  <>
                    <Button onClick={handleSave} className="flex-1">Save</Button>
                    <Button onClick={handleCancel} variant="outline">Cancel</Button>
                  </>
                ) : (
                  <Button onClick={handleEdit} className="w-full">Edit</Button>
                )}
              </div>
            </motion.aside>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
