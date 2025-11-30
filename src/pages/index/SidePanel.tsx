import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Task, Edge, Axis, Status, Priority, Subtask } from "./types";

const GROUPS = [
  { id: "group-1", label: "Group 1 (Green)", bg: "hsl(140, 50%, 92%)" },
  { id: "group-2", label: "Group 2 (Blue)", bg: "hsl(210, 60%, 92%)" },
  { id: "group-3", label: "Group 3 (Purple)", bg: "hsl(270, 50%, 92%)" },
  { id: "group-4", label: "Group 4 (Orange)", bg: "hsl(30, 70%, 92%)" },
  { id: "group-5", label: "Group 5 (Pink)", bg: "hsl(350, 60%, 92%)" },
];

export default function SidePanel(props: {
  selectedTaskData: Task | null;
  editedTask: Task | null;
  editMode: boolean;
  setEditedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<string | null>>;
  tasks: Task[];
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskById: Record<string, Task>;
  axisById: Record<string, Axis>;
  statusConfig: Record<Status, { bg: string; text: string; label: string }>;
  priorityConfig: Record<Priority, { bg: string; text: string; label: string }>;
  STATUSES: Status[];
  PRIORITIES: Priority[];
}) {
  const {
    selectedTaskData,
    editedTask,
    editMode,
    setEditedTask,
    setEditMode,
    setSelectedTask,
    tasks,
    edges,
    setEdges,
    setTasks,
    taskById,
    axisById,
    statusConfig,
    priorityConfig,
    STATUSES,
    PRIORITIES,
  } = props;
  const { toast } = useToast();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  if (!selectedTaskData) return null;

  const currentTask = editedTask || selectedTaskData;

  const handleEdit = () => {
    setEditedTask(selectedTaskData);
    setEditMode(true);
  };

  const handleSave = () => {
    if (editedTask) {
      setTasks((prev) => prev.map((t) => (t.id === editedTask.id ? { ...editedTask, temporary: undefined } : t)));
      toast({ title: "Task updated", description: "Changes have been saved." });
      setEditedTask(null);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    // if this was a newly-created temporary task, remove it
    if (editedTask && (editedTask as any).temporary) {
      setTasks((prev) => prev.filter((t) => t.id !== editedTask.id));
      setSelectedTask(null);
    }
    setEditedTask(null);
    setEditMode(false);
  };

  const handleDelete = () => {
    const taskToDelete = editedTask || selectedTaskData;
    if (taskToDelete) {
      console.log("Deleting task:", taskToDelete.id); // Debug log
      // Remove the task
      setTasks((prev) => {
        const newTasks = prev.filter((t) => t.id !== taskToDelete.id);
        console.log("Tasks before:", prev.length, "after:", newTasks.length); // Debug log
        return newTasks;
      });
      // Remove all edges connected to this task
      setEdges((prev) => {
        const newEdges = prev.filter((e) => e.from !== taskToDelete.id && e.to !== taskToDelete.id);
        console.log("Edges before:", prev.length, "after:", newEdges.length); // Debug log
        return newEdges;
      });
      // Close the panel
      setSelectedTask(null);
      setEditedTask(null);
      setEditMode(false);
      // Show confirmation toast
      toast({ 
        title: "Task deleted", 
        description: `Task "${taskToDelete.title}" and its connections have been removed.`,
        variant: "destructive"
      });
    } else {
      console.log("No task to delete"); // Debug log
    }
  };

  const updateField = <K extends keyof Task>(field: K, value: Task[K]) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, [field]: value });
    }
  };

  const addSubtask = () => {
    if (!editedTask || !newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `ST-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updatedSubtasks = [...(editedTask.subtasks || []), newSubtask];
    updateField("subtasks", updatedSubtasks);
    setNewSubtaskTitle("");
  };

  const removeSubtask = (subtaskId: string) => {
    if (!editedTask) return;
    const updatedSubtasks = (editedTask.subtasks || []).filter((st) => st.id !== subtaskId);
    updateField("subtasks", updatedSubtasks);
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!editedTask) return;
    const updatedSubtasks = (editedTask.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    updateField("subtasks", updatedSubtasks);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedTask(null);
            setEditedTask(null);
            setEditMode(false);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {editMode ? (
          <>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={currentTask.title} onChange={(e) => updateField("title", e.target.value)} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={currentTask.status}
                  onChange={(e) => updateField("status", e.target.value as Status)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusConfig[s].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={currentTask.priority}
                  onChange={(e) => updateField("priority", e.target.value as Priority)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {priorityConfig[p].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="assignee">Assigned to</Label>
              <Input id="assignee" value={currentTask.assignee || ""} onChange={(e) => updateField("assignee", e.target.value || null)} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="group">Group</Label>
              <select
                id="group"
                value={currentTask.group || ""}
                onChange={(e) => updateField("group", e.target.value || undefined)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No Group</option>
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="date" value={currentTask.start || ""} onChange={(e) => updateField("start", e.target.value || null)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="due">Due Date</Label>
                <Input id="due" type="date" value={currentTask.due || ""} onChange={(e) => updateField("due", e.target.value || null)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="created">Created On</Label>
              <Input 
                id="created" 
                type="text" 
                value={new Date(currentTask.createdAt).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })} 
                readOnly 
                className="mt-1 bg-gray-100 cursor-not-allowed" 
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input id="duration" type="number" min="1" value={currentTask.duration || ""} onChange={(e) => updateField("duration", e.target.value ? parseInt(e.target.value) : null)} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={currentTask.description || ""} onChange={(e) => updateField("description", e.target.value)} className="mt-1 min-h-[100px]" />
            </div>

            {/* Subtasks Section */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Subtasks</Label>
              <div className="space-y-2">
                {(currentTask.subtasks || []).map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(subtask.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        subtask.completed ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                      }`}
                    >
                      {subtask.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${subtask.completed ? "text-gray-500 line-through" : "text-gray-700"}`}>
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="New subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={addSubtask} size="sm" disabled={!newSubtaskTitle.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="mb-2 block">Dependencies</Label>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-2">Blocked by:</div>
                  <div className="space-y-2">
                    {edges
                      .filter((e) => e.to === currentTask.id)
                      .map((e) => {
                        const dep = taskById[e.from];
                        return dep ? (
                          <div key={e.from} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>{dep.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEdges((prev) => prev.filter((edge) => !(edge.from === e.from && edge.to === e.to)));
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
                        if (e.target.value && !edges.some((edge) => edge.from === e.target.value && edge.to === currentTask.id)) {
                          setEdges((prev) => [...prev, { from: e.target.value, to: currentTask.id }]);
                        }
                      }}
                    >
                      <option value="">+ Add blocker...</option>
                      {tasks
                        .filter((t) => t.id !== currentTask.id && !edges.some((e) => e.from === t.id && e.to === currentTask.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-2">Blocks:</div>
                  <div className="space-y-2">
                    {edges
                      .filter((e) => e.from === currentTask.id)
                      .map((e) => {
                        const dep = taskById[e.to];
                        return dep ? (
                          <div key={e.to} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>{dep.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEdges((prev) => prev.filter((edge) => !(edge.from === e.from && edge.to === e.to)));
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
                        if (e.target.value && !edges.some((edge) => edge.from === currentTask.id && edge.to === e.target.value)) {
                          setEdges((prev) => [...prev, { from: currentTask.id, to: e.target.value }]);
                        }
                      }}
                    >
                      <option value="">+ Add blocked task...</option>
                      {tasks
                        .filter((t) => t.id !== currentTask.id && !edges.some((e) => e.from === currentTask.id && e.to === t.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
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
                  color: statusConfig[currentTask.status].text,
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
                  color: priorityConfig[currentTask.priority].text,
                }}
              >
                {priorityConfig[currentTask.priority].label}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned to</div>
              <div>{currentTask.assignee || "—"}</div>
            </div>

            {currentTask.group && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Group</div>
                <div
                  className="inline-block px-3 py-1.5 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: GROUPS.find(g => g.id === currentTask.group)?.bg || "hsl(var(--muted))",
                  }}
                >
                  {GROUPS.find(g => g.id === currentTask.group)?.label || currentTask.group}
                </div>
              </div>
            )}

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

            {/* Subtasks in view mode */}
            {currentTask.subtasks && currentTask.subtasks.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Subtasks ({currentTask.subtasks.filter(st => st.completed).length}/{currentTask.subtasks.length} completed)</div>
                <div className="space-y-1.5">
                  {currentTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        subtask.completed ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                      }`}>
                        {subtask.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={subtask.completed ? "text-gray-500 line-through" : "text-gray-700"}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
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
                    {edges.filter((e) => e.to === currentTask.id).map((e) => {
                      const dep = taskById[e.from];
                      return dep ? <li key={e.from}>• {dep.title}</li> : null;
                    })}
                    {edges.filter((e) => e.to === currentTask.id).length === 0 && <li className="text-gray-500">None</li>}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Blocks:</span>
                  <ul className="ml-4 mt-1">
                    {edges.filter((e) => e.from === currentTask.id).map((e) => {
                      const dep = taskById[e.to];
                      return dep ? <li key={e.to}>• {dep.title}</li> : null;
                    })}
                    {edges.filter((e) => e.from === currentTask.id).length === 0 && <li className="text-gray-500">None</li>}
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
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="destructive" 
              size="sm"
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleEdit} className="flex-1">
              Edit
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="destructive" 
              size="sm"
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </motion.aside>
  );
}
