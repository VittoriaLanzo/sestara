import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTodoDialog } from "@/components/todos/AddTodoDialog";
import { EditTodoDialog } from "@/components/todos/EditTodoDialog";
import {
  Plus,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  Timer,
  BookOpen,
  Target,
  Layers,
  ListTodo,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow, startOfDay, addDays, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  due_time: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  roadmap_id: string | null;
  topic_id: string | null;
  parent_id: string | null;
  order_index: number;
  tags: string[] | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  roadmap_title?: string;
  topic_title?: string;
  subtasks?: Todo[];
}

const priorityConfig = {
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted", icon: Flag },
  medium: { label: "Medium", color: "text-blue-500", bg: "bg-blue-500/10", icon: Flag },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", icon: Flag },
  urgent: { label: "Urgent", color: "text-destructive", bg: "bg-destructive/10", icon: Flag },
};

const categoryConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  general: { label: "General", icon: ListTodo, color: "text-muted-foreground" },
  study: { label: "Study", icon: BookOpen, color: "text-blue-500" },
  revision: { label: "Revision", icon: Layers, color: "text-purple-500" },
  assignment: { label: "Assignment", icon: Target, color: "text-orange-500" },
  exam: { label: "Exam", icon: Timer, color: "text-destructive" },
  project: { label: "Project", icon: Sparkles, color: "text-emerald-500" },
  reading: { label: "Reading", icon: BookOpen, color: "text-cyan-500" },
  practice: { label: "Practice", icon: Target, color: "text-pink-500" },
};

const TodosPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Enrich with roadmap/topic titles
      const enrichedTodos = await Promise.all(
        (data || []).map(async (todo) => {
          let roadmap_title: string | undefined;
          let topic_title: string | undefined;

          if (todo.roadmap_id) {
            const { data: roadmap } = await supabase
              .from("roadmaps")
              .select("title")
              .eq("id", todo.roadmap_id)
              .maybeSingle();
            roadmap_title = roadmap?.title;
          }

          if (todo.topic_id) {
            const { data: topic } = await supabase
              .from("topics")
              .select("title")
              .eq("id", todo.topic_id)
              .maybeSingle();
            topic_title = topic?.title;
          }

          return { ...todo, roadmap_title, topic_title } as Todo;
        })
      );

      // Organize subtasks
      const parentTodos = enrichedTodos.filter((t) => !t.parent_id);
      const subtaskMap = new Map<string, Todo[]>();
      
      enrichedTodos.filter((t) => t.parent_id).forEach((subtask) => {
        const existing = subtaskMap.get(subtask.parent_id!) || [];
        subtaskMap.set(subtask.parent_id!, [...existing, subtask]);
      });

      const todosWithSubtasks = parentTodos.map((todo) => ({
        ...todo,
        subtasks: subtaskMap.get(todo.id) || [],
      }));

      setTodos(todosWithSubtasks);
    } catch (error) {
      console.error("Error fetching todos:", error);
      toast.error("Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Todo["status"]) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("todos")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === id) return { ...t, ...updateData };
          if (t.subtasks) {
            return {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === id ? { ...st, ...updateData } : st
              ),
            };
          }
          return t;
        })
      );

      toast.success(newStatus === "completed" ? "Task completed!" : "Status updated");
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("todos").delete().eq("id", deleteId);
      if (error) throw error;

      setTodos((prev) =>
        prev
          .filter((t) => t.id !== deleteId)
          .map((t) => ({
            ...t,
            subtasks: t.subtasks?.filter((st) => st.id !== deleteId),
          }))
      );
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete task");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesSearch =
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || todo.status === filterStatus;
      const matchesPriority = filterPriority === "all" || todo.priority === filterPriority;
      const matchesCategory = filterCategory === "all" || todo.category === filterCategory;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [todos, searchQuery, filterStatus, filterPriority, filterCategory]);

  const groupedTodos = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const weekEnd = endOfWeek(today);

    const groups: { [key: string]: Todo[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      upcoming: [],
      noDueDate: [],
    };

    filteredTodos.forEach((todo) => {
      if (!todo.due_date) {
        groups.noDueDate.push(todo);
      } else {
        const dueDate = new Date(todo.due_date);
        if (isPast(dueDate) && !isToday(dueDate) && todo.status !== "completed") {
          groups.overdue.push(todo);
        } else if (isToday(dueDate)) {
          groups.today.push(todo);
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.push(todo);
        } else if (dueDate <= weekEnd) {
          groups.thisWeek.push(todo);
        } else {
          groups.upcoming.push(todo);
        }
      }
    });

    return groups;
  }, [filteredTodos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === "completed").length;
    const pending = todos.filter((t) => t.status === "pending").length;
    const inProgress = todos.filter((t) => t.status === "in_progress").length;
    const overdue = todos.filter(
      (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "completed"
    ).length;
    
    return { total, completed, pending, inProgress, overdue, progress: total > 0 ? (completed / total) * 100 : 0 };
  }, [todos]);

  const renderTodoItem = (todo: Todo, isSubtask = false) => {
    const priorityInfo = priorityConfig[todo.priority];
    const categoryInfo = categoryConfig[todo.category] || categoryConfig.general;
    const CategoryIcon = categoryInfo.icon;
    const isExpanded = expandedTodos.has(todo.id);
    const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
    const isCompleted = todo.status === "completed";
    const isOverdue = todo.due_date && isPast(new Date(todo.due_date)) && !isToday(new Date(todo.due_date)) && !isCompleted;

    return (
      <div key={todo.id} className={cn("group", isSubtask && "ml-8")}>
        <div
          className={cn(
            "glass-card p-4 transition-all hover:shadow-md",
            isCompleted && "opacity-60",
            isOverdue && "border-destructive/30"
          )}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) =>
                handleStatusChange(todo.id, checked ? "completed" : "pending")
              }
              className="mt-1"
            />

            {/* Expand button for subtasks */}
            {hasSubtasks && (
              <button onClick={() => toggleExpand(todo.id)} className="mt-1 p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {/* Priority indicator */}
                <div className={cn("w-2 h-2 rounded-full", priorityInfo.bg.replace("/10", ""))} 
                  style={{ backgroundColor: todo.priority === 'urgent' ? 'hsl(var(--destructive))' : 
                    todo.priority === 'high' ? 'rgb(249 115 22)' : 
                    todo.priority === 'medium' ? 'rgb(59 130 246)' : 
                    'hsl(var(--muted-foreground))' }} />
                
                {/* Category badge */}
                <Badge variant="outline" className={cn("text-xs gap-1", categoryInfo.color)}>
                  <CategoryIcon className="w-3 h-3" />
                  {categoryInfo.label}
                </Badge>

                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                )}
              </div>

              <h3 className={cn("font-medium text-foreground", isCompleted && "line-through")}>
                {todo.title}
              </h3>

              {todo.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {todo.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {todo.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {isToday(new Date(todo.due_date))
                        ? "Today"
                        : isTomorrow(new Date(todo.due_date))
                        ? "Tomorrow"
                        : format(new Date(todo.due_date), "MMM d")}
                      {todo.due_time && ` at ${todo.due_time}`}
                    </span>
                  </div>
                )}

                {todo.estimated_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{todo.estimated_minutes}m estimated</span>
                  </div>
                )}

                {todo.roadmap_title && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>{todo.roadmap_title}</span>
                  </div>
                )}

                {todo.topic_title && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{todo.topic_title}</span>
                  </div>
                )}

                {hasSubtasks && (
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>
                      {todo.subtasks?.filter((st) => st.status === "completed").length}/{todo.subtasks?.length} subtasks
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange(todo.id, "in_progress")}>
                  <Timer className="w-4 h-4 mr-2" />
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditTodo(todo)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteId(todo.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subtasks */}
        {isExpanded && hasSubtasks && (
          <div className="mt-2 space-y-2">
            {todo.subtasks!.map((subtask) => renderTodoItem(subtask, true))}
          </div>
        )}
      </div>
    );
  };

  const renderGroupedView = () => {
    const groupLabels: { [key: string]: { label: string; icon: typeof Calendar } } = {
      overdue: { label: "Overdue", icon: Flag },
      today: { label: "Today", icon: Calendar },
      tomorrow: { label: "Tomorrow", icon: Calendar },
      thisWeek: { label: "This Week", icon: Calendar },
      upcoming: { label: "Upcoming", icon: Calendar },
      noDueDate: { label: "No Due Date", icon: ListTodo },
    };

    return (
      <div className="space-y-6">
        {Object.entries(groupedTodos).map(([key, items]) => {
          if (items.length === 0) return null;
          const group = groupLabels[key];
          const GroupIcon = group.icon;

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <GroupIcon className={cn("w-4 h-4", key === "overdue" && "text-destructive")} />
                <h3 className={cn("font-display font-semibold", key === "overdue" && "text-destructive")}>
                  {group.label}
                </h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((todo) => renderTodoItem(todo))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              My Tasks
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Stay organized and track your study tasks
            </p>
          </div>
          <Button variant="gradient" onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ListTodo className="w-4 h-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Circle className="w-4 h-4" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Timer className="w-4 h-4" />
              <span className="text-xs">In Progress</span>
            </div>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">Completed</span>
            </div>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="glass-card p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <Flag className="w-4 h-4" />
              <span className="text-xs">Overdue</span>
            </div>
            <p className="text-2xl font-bold">{stats.overdue}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium">{Math.round(stats.progress)}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* View Toggle & Tasks */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "grouped")} className="space-y-4">
          <TabsList className="grid w-full max-w-[200px] grid-cols-2">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="grouped">Grouped</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  No tasks found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {todos.length === 0 ? "Create your first task to get started" : "No tasks match your filters"}
                </p>
                <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                  Add Task
                </Button>
              </div>
            ) : (
              filteredTodos.map((todo) => renderTodoItem(todo))
            )}
          </TabsContent>

          <TabsContent value="grouped">
            {filteredTodos.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  No tasks found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {todos.length === 0 ? "Create your first task to get started" : "No tasks match your filters"}
                </p>
                <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                  Add Task
                </Button>
              </div>
            ) : (
              renderGroupedView()
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Dialog */}
      <AddTodoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={fetchTodos}
        userId={user?.id || ""}
      />

      {/* Edit Dialog */}
      {editTodo && (
        <EditTodoDialog
          open={!!editTodo}
          onOpenChange={() => setEditTodo(null)}
          todo={editTodo}
          onUpdate={fetchTodos}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All subtasks will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TodosPage;
