import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Loader2, 
  Trash2, 
  Check,
  BookOpen,
  MapPin,
  Clock,
  AlertTriangle,
  Target,
  GraduationCap,
  Bell,
  List,
  LayoutGrid,
  Eye,
  ListTodo,
  Flag,
  MoreVertical,
  Edit2,
  Timer,
  CheckCircle2,
  Circle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek, formatDistanceToNow, isSameDay, addDays, startOfDay, endOfWeek } from "date-fns";
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

// === TYPES ===
interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_type: string;
  due_date: string;
  reminder_at: string | null;
  roadmap_id: string | null;
  topic_id: string | null;
  is_completed: boolean;
  roadmap_title?: string;
  topic_title?: string;
}

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

interface Roadmap {
  id: string;
  title: string;
}

interface Topic {
  id: string;
  title: string;
}

// === CONFIGS ===
const typeConfig: Record<string, { label: string; icon: typeof CalendarIcon; color: string; bgColor: string }> = {
  exam: { label: "Exam", icon: GraduationCap, color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
  deadline: { label: "Deadline", icon: AlertTriangle, color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20" },
  revision: { label: "Revision", icon: BookOpen, color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/20" },
  general: { label: "Reminder", icon: Bell, color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/20" },
};

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

type TabType = "show-dates" | "add-dates" | "show-tasks" | "add-tasks";

const ImportantDatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>("show-dates");
  
  // Dates state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateViewMode, setDateViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  
  // Tasks state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [taskViewMode, setTaskViewMode] = useState<"list" | "grouped">("list");
  const [deleteTodoId, setDeleteTodoId] = useState<string | null>(null);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  
  // Form states for Add Date
  const [dateTitle, setDateTitle] = useState("");
  const [dateDescription, setDateDescription] = useState("");
  const [dateType, setDateType] = useState("general");
  const [dateDueDate, setDateDueDate] = useState<Date | undefined>();
  const [dateReminderAt, setDateReminderAt] = useState<Date | undefined>();
  const [dateRoadmap, setDateRoadmap] = useState("");
  const [dateTopic, setDateTopic] = useState("");
  
  // Form states for Add Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [taskCategory, setTaskCategory] = useState("general");
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>();
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskEstimated, setTaskEstimated] = useState("");
  const [taskRoadmap, setTaskRoadmap] = useState("");
  const [taskTopic, setTaskTopic] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  
  // Shared state
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAllData();
    fetchRoadmaps();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchReminders(), fetchTodos()]);
    setLoading(false);
  };

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (reminder) => {
          let roadmap_title: string | undefined;
          let topic_title: string | undefined;

          if (reminder.roadmap_id) {
            const { data: roadmap } = await supabase
              .from("roadmaps")
              .select("title")
              .eq("id", reminder.roadmap_id)
              .maybeSingle();
            roadmap_title = roadmap?.title;
          }

          if (reminder.topic_id) {
            const { data: topic } = await supabase
              .from("topics")
              .select("title")
              .eq("id", reminder.topic_id)
              .maybeSingle();
            topic_title = topic?.title;
          }

          return { ...reminder, roadmap_title, topic_title };
        })
      );

      setReminders(enriched);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      const enriched = await Promise.all(
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
      const parentTodos = enriched.filter((t) => !t.parent_id);
      const subtaskMap = new Map<string, Todo[]>();
      
      enriched.filter((t) => t.parent_id).forEach((subtask) => {
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
    }
  };

  const fetchRoadmaps = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("roadmaps")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRoadmaps(data || []);
  };

  const fetchTopics = async (roadmapId: string) => {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id")
      .eq("roadmap_id", roadmapId);

    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.map((s) => s.id);
      const { data: topicsData } = await supabase
        .from("topics")
        .select("id, title")
        .in("subject_id", subjectIds)
        .order("order_index", { ascending: true });
      setTopics(topicsData || []);
    } else {
      setTopics([]);
    }
  };

  // === DATE HANDLERS ===
  const handleCompleteReminder = async (id: string) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      const newStatus = !reminder?.is_completed;

      const { error } = await supabase
        .from("reminders")
        .update({ is_completed: newStatus })
        .eq("id", id);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_completed: newStatus } : r))
      );

      toast.success(newStatus ? "Marked as complete" : "Marked as incomplete");
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update");
    }
  };

  const handleDeleteReminder = async () => {
    if (!deleteReminderId) return;
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", deleteReminderId);
      if (error) throw error;
      setReminders((prev) => prev.filter((r) => r.id !== deleteReminderId));
      toast.success("Date deleted");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleteReminderId(null);
    }
  };

  const handleAddDate = async () => {
    if (!user || !dateTitle.trim() || !dateDueDate) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reminders").insert({
        user_id: user.id,
        title: dateTitle.trim(),
        description: dateDescription.trim() || null,
        reminder_type: dateType,
        due_date: dateDueDate.toISOString(),
        reminder_at: dateReminderAt?.toISOString() || null,
        roadmap_id: dateRoadmap && dateRoadmap !== "none" ? dateRoadmap : null,
        topic_id: dateTopic && dateTopic !== "none" ? dateTopic : null,
      });

      if (error) throw error;

      toast.success("Date added successfully!");
      resetDateForm();
      await fetchReminders();
      setActiveTab("show-dates");
    } catch (error) {
      console.error("Error adding date:", error);
      toast.error("Failed to add date");
    } finally {
      setSubmitting(false);
    }
  };

  const resetDateForm = () => {
    setDateTitle("");
    setDateDescription("");
    setDateType("general");
    setDateDueDate(undefined);
    setDateReminderAt(undefined);
    setDateRoadmap("");
    setDateTopic("");
  };

  // === TASK HANDLERS ===
  const handleTaskStatusChange = async (id: string, newStatus: Todo["status"]) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase.from("todos").update(updateData).eq("id", id);
      if (error) throw error;

      setTodos((prev) =>
        prev.map((t) => {
          if (t.id === id) return { ...t, ...updateData };
          if (t.subtasks) {
            return { ...t, subtasks: t.subtasks.map((st) => st.id === id ? { ...st, ...updateData } : st) };
          }
          return t;
        })
      );

      toast.success(newStatus === "completed" ? "Task completed!" : "Status updated");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async () => {
    if (!deleteTodoId) return;
    try {
      const { error } = await supabase.from("todos").delete().eq("id", deleteTodoId);
      if (error) throw error;
      setTodos((prev) =>
        prev.filter((t) => t.id !== deleteTodoId)
          .map((t) => ({ ...t, subtasks: t.subtasks?.filter((st) => st.id !== deleteTodoId) }))
      );
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setDeleteTodoId(null);
    }
  };

  const handleAddTask = async () => {
    if (!user || !taskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("todos").insert({
        user_id: user.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        category: taskCategory,
        due_date: taskDueDate?.toISOString().split('T')[0] || null,
        due_time: taskDueTime || null,
        estimated_minutes: taskEstimated ? parseInt(taskEstimated) : null,
        roadmap_id: taskRoadmap && taskRoadmap !== "none" ? taskRoadmap : null,
        topic_id: taskTopic && taskTopic !== "none" ? taskTopic : null,
        notes: taskNotes.trim() || null,
      });

      if (error) throw error;

      toast.success("Task added successfully!");
      resetTaskForm();
      await fetchTodos();
      setActiveTab("show-tasks");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskCategory("general");
    setTaskDueDate(undefined);
    setTaskDueTime("");
    setTaskEstimated("");
    setTaskRoadmap("");
    setTaskTopic("");
    setTaskNotes("");
  };

  const toggleExpand = (id: string) => {
    setExpandedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // === COMPUTED VALUES ===
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (dateFilter === "all") return true;
      if (dateFilter === "completed") return r.is_completed;
      if (dateFilter === "upcoming") return !r.is_completed;
      if (dateFilter === "today") return isToday(new Date(r.due_date));
      if (dateFilter === "thisWeek") return isThisWeek(new Date(r.due_date));
      if (dateFilter === "overdue") return isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)) && !r.is_completed;
      return r.reminder_type === dateFilter;
    });
  }, [reminders, dateFilter]);

  const dateStats = useMemo(() => {
    const today = reminders.filter((r) => isToday(new Date(r.due_date)) && !r.is_completed).length;
    const thisWeek = reminders.filter((r) => isThisWeek(new Date(r.due_date)) && !r.is_completed).length;
    const overdue = reminders.filter((r) => isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)) && !r.is_completed).length;
    const upcoming = reminders.filter((r) => !r.is_completed).length;
    return { today, thisWeek, overdue, upcoming };
  }, [reminders]);

  const datesWithReminders = useMemo(() => {
    const dateMap = new Map<string, Reminder[]>();
    reminders.forEach((r) => {
      const dateKey = format(new Date(r.due_date), "yyyy-MM-dd");
      const existing = dateMap.get(dateKey) || [];
      dateMap.set(dateKey, [...existing, r]);
    });
    return dateMap;
  }, [reminders]);

  const selectedDateReminders = useMemo(() => {
    return reminders.filter((r) => isSameDay(new Date(r.due_date), selectedDate));
  }, [reminders, selectedDate]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = taskFilter === "all" || todo.status === taskFilter;
      const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || todo.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [todos, searchQuery, taskFilter, priorityFilter, categoryFilter]);

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

  const taskStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === "completed").length;
    const pending = todos.filter((t) => t.status === "pending").length;
    const inProgress = todos.filter((t) => t.status === "in_progress").length;
    const overdue = todos.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "completed").length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, inProgress, overdue, progress };
  }, [todos]);

  // === RENDER HELPERS ===
  const renderReminderCard = (reminder: Reminder) => {
    const dueDateObj = new Date(reminder.due_date);
    const isOverdue = isPast(dueDateObj) && !reminder.is_completed && !isToday(dueDateObj);
    const isDueToday = isToday(dueDateObj);
    const isDueTomorrow = isTomorrow(dueDateObj);
    const config = typeConfig[reminder.reminder_type] || typeConfig.general;
    const TypeIcon = config.icon;

    return (
      <div
        key={reminder.id}
        className={cn(
          "glass-card p-4 transition-all hover:shadow-md group",
          reminder.is_completed && "opacity-60",
          isOverdue && "border-destructive/30"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleCompleteReminder(reminder.id)}
            className={cn(
              "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
              reminder.is_completed ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {reminder.is_completed && <Check className="w-3 h-3 text-primary-foreground" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={cn("text-xs gap-1", config.bgColor, config.color)}>
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </Badge>
              {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
              {isDueToday && !isOverdue && <Badge className="text-xs bg-orange-500 text-white">Due Today</Badge>}
              {isDueTomorrow && <Badge className="text-xs bg-primary/20 text-primary">Tomorrow</Badge>}
            </div>

            <h3 className={cn("font-display font-semibold text-foreground mb-1", reminder.is_completed && "line-through")}>
              {reminder.title}
            </h3>

            {reminder.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{reminder.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{format(dueDateObj, "EEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isOverdue ? `${formatDistanceToNow(dueDateObj)} ago` :
                   isDueToday ? "Today" : `in ${formatDistanceToNow(dueDateObj)}`}
                </span>
              </div>
              {reminder.roadmap_title && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{reminder.roadmap_title}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteReminderId(reminder.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

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
        <div className={cn(
          "glass-card p-4 transition-all hover:shadow-md",
          isCompleted && "opacity-60",
          isOverdue && "border-destructive/30"
        )}>
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => handleTaskStatusChange(todo.id, checked ? "completed" : "pending")}
              className="mt-1"
            />

            {hasSubtasks && (
              <button onClick={() => toggleExpand(todo.id)} className="mt-1 p-0.5">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> :
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: todo.priority === 'urgent' ? 'hsl(var(--destructive))' :
                    todo.priority === 'high' ? 'rgb(249 115 22)' :
                    todo.priority === 'medium' ? 'rgb(59 130 246)' : 'hsl(var(--muted-foreground))'
                }} />
                <Badge variant="outline" className={cn("text-xs gap-1", categoryInfo.color)}>
                  <CategoryIcon className="w-3 h-3" />
                  {categoryInfo.label}
                </Badge>
                {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
              </div>

              <h3 className={cn("font-medium text-foreground", isCompleted && "line-through")}>{todo.title}</h3>

              {todo.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {todo.due_date && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>
                      {isToday(new Date(todo.due_date)) ? "Today" :
                       isTomorrow(new Date(todo.due_date)) ? "Tomorrow" : format(new Date(todo.due_date), "MMM d")}
                      {todo.due_time && ` at ${todo.due_time}`}
                    </span>
                  </div>
                )}
                {todo.estimated_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{todo.estimated_minutes}m</span>
                  </div>
                )}
                {hasSubtasks && (
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{todo.subtasks?.filter((st) => st.status === "completed").length}/{todo.subtasks?.length} subtasks</span>
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTaskStatusChange(todo.id, "in_progress")}>
                  <Timer className="w-4 h-4 mr-2" />
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteTodoId(todo.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && hasSubtasks && (
          <div className="mt-2 space-y-2">
            {todo.subtasks!.map((subtask) => renderTodoItem(subtask, true))}
          </div>
        )}
      </div>
    );
  };

  // === TAB BUTTON COMPONENT ===
  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: typeof Eye }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
        activeTab === tab
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Productivity Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your important dates and tasks in one place
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card p-2 mb-6 inline-flex gap-1 flex-wrap">
          <TabButton tab="show-dates" label="Show Dates" icon={Eye} />
          <TabButton tab="add-dates" label="Add Date" icon={Plus} />
          <TabButton tab="show-tasks" label="Show Tasks" icon={ListTodo} />
          <TabButton tab="add-tasks" label="Add Task" icon={Plus} />
        </div>

        {/* Content with Animation */}
        <div className="animate-fade-in">
          {/* SHOW DATES TAB */}
          {activeTab === "show-dates" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDateFilter("today")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-orange-500 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Today</span>
                    </div>
                    <p className="text-2xl font-bold">{dateStats.today}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDateFilter("thisWeek")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">This Week</span>
                    </div>
                    <p className="text-2xl font-bold">{dateStats.thisWeek}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDateFilter("overdue")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Overdue</span>
                    </div>
                    <p className="text-2xl font-bold">{dateStats.overdue}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDateFilter("upcoming")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-xs font-medium">Upcoming</span>
                    </div>
                    <p className="text-2xl font-bold">{dateStats.upcoming}</p>
                  </CardContent>
                </Card>
              </div>

              {/* View Toggle & Filters */}
              <div className="glass-card p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={dateViewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateViewMode("list")}
                      className="gap-2"
                    >
                      <List className="w-4 h-4" />
                      List
                    </Button>
                    <Button
                      variant={dateViewMode === "calendar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateViewMode("calendar")}
                      className="gap-2"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Calendar
                    </Button>
                  </div>
                  <div className="flex-1" />
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="exam">Exams</SelectItem>
                      <SelectItem value="deadline">Deadlines</SelectItem>
                      <SelectItem value="revision">Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content */}
              {dateViewMode === "list" ? (
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                  {filteredReminders.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-display font-semibold text-foreground mb-2">No dates found</h3>
                      <p className="text-muted-foreground mb-4">
                        {reminders.length === 0 ? "Add your first important date" : "No dates match this filter"}
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("add-dates")}>Add Date</Button>
                    </div>
                  ) : (
                    filteredReminders.map((reminder) => renderReminderCard(reminder))
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="glass-card lg:col-span-2">
                    <CardContent className="p-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        className="w-full"
                        modifiers={{ hasReminder: (date) => datesWithReminders.has(format(date, "yyyy-MM-dd")) }}
                        modifiersClassNames={{ hasReminder: "bg-primary/20 font-bold" }}
                      />
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        {format(selectedDate, "EEEE, MMMM d")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[300px] overflow-y-auto">
                      {selectedDateReminders.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm mb-3">No events on this day</p>
                          <Button variant="outline" size="sm" onClick={() => setActiveTab("add-dates")}>
                            <Plus className="w-4 h-4 mr-2" />Add Event
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDateReminders.map((reminder) => {
                            const config = typeConfig[reminder.reminder_type] || typeConfig.general;
                            const TypeIcon = config.icon;
                            return (
                              <div key={reminder.id} className={cn("p-3 rounded-lg border", config.bgColor, reminder.is_completed && "opacity-60")}>
                                <div className="flex items-start gap-2">
                                  <button
                                    onClick={() => handleCompleteReminder(reminder.id)}
                                    className={cn(
                                      "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                      reminder.is_completed ? "bg-primary border-primary" : "border-muted-foreground/50"
                                    )}
                                  >
                                    {reminder.is_completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <TypeIcon className={cn("w-3 h-3", config.color)} />
                                      <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                                    </div>
                                    <p className={cn("text-sm font-medium", reminder.is_completed && "line-through")}>{reminder.title}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ADD DATES TAB */}
          {activeTab === "add-dates" && (
            <Card className="glass-card max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Add Important Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date-title">Title *</Label>
                  <Input
                    id="date-title"
                    placeholder="e.g., Final Exam, Assignment Due"
                    value={dateTitle}
                    onChange={(e) => setDateTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-description">Description</Label>
                  <Textarea
                    id="date-description"
                    placeholder="Add any notes or details..."
                    value={dateDescription}
                    onChange={(e) => setDateDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={dateType} onValueChange={setDateType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateDueDate ? format(dateDueDate, "MMM d, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateDueDate} onSelect={setDateDueDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remind me on</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateReminderAt && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateReminderAt ? format(dateReminderAt, "MMM d, yyyy") : "Optional reminder date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateReminderAt} onSelect={setDateReminderAt} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Attach to Roadmap</Label>
                  <Select value={dateRoadmap} onValueChange={(val) => { setDateRoadmap(val); if (val && val !== "none") fetchTopics(val); else setTopics([]); }}>
                    <SelectTrigger><SelectValue placeholder="None (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {roadmaps.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {dateRoadmap && dateRoadmap !== "none" && topics.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attach to Topic</Label>
                    <Select value={dateTopic} onValueChange={setDateTopic}>
                      <SelectTrigger><SelectValue placeholder="None (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { resetDateForm(); setActiveTab("show-dates"); }} className="flex-1">Cancel</Button>
                  <Button variant="gradient" onClick={handleAddDate} disabled={!dateTitle.trim() || !dateDueDate || submitting} className="flex-1">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Date
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SHOW TASKS TAB */}
          {activeTab === "show-tasks" && (
            <div className="space-y-6">
              {/* Task Stats - 5 columns like TodosPage */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ListTodo className="w-4 h-4" />
                      <span className="text-xs font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold">{taskStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Circle className="w-4 h-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold">{taskStats.pending}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <Timer className="w-4 h-4" />
                      <span className="text-xs font-medium">In Progress</span>
                    </div>
                    <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-bold">{taskStats.completed}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card col-span-2 md:col-span-1">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <Flag className="w-4 h-4" />
                      <span className="text-xs font-medium">Overdue</span>
                    </div>
                    <p className="text-2xl font-bold">{taskStats.overdue}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Progress */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-medium">{Math.round(taskStats.progress)}%</span>
                  </div>
                  <Progress value={taskStats.progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Filters */}
              <Card className="glass-card">
                <CardContent className="p-4">
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
                      <Select value={taskFilter} onValueChange={setTaskFilter}>
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
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                </CardContent>
              </Card>

              {/* View Toggle & Tasks */}
              <Tabs value={taskViewMode} onValueChange={(v) => setTaskViewMode(v as "list" | "grouped")} className="space-y-4">
                <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="grouped">Grouped</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                  {filteredTodos.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-display font-semibold text-foreground mb-2">No tasks found</h3>
                      <p className="text-muted-foreground mb-4">
                        {todos.length === 0 ? "Create your first task to get started" : "No tasks match your filters"}
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("add-tasks")}>Add Task</Button>
                    </div>
                  ) : (
                    filteredTodos.map((todo) => renderTodoItem(todo))
                  )}
                </TabsContent>

                <TabsContent value="grouped" className="max-h-[500px] overflow-y-auto pr-2">
                  {filteredTodos.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-display font-semibold text-foreground mb-2">No tasks found</h3>
                      <p className="text-muted-foreground mb-4">
                        {todos.length === 0 ? "Create your first task to get started" : "No tasks match your filters"}
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab("add-tasks")}>Add Task</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedTodos).map(([key, items]) => {
                        if (items.length === 0) return null;
                        const groupLabels: { [key: string]: { label: string; icon: typeof CalendarIcon } } = {
                          overdue: { label: "Overdue", icon: Flag },
                          today: { label: "Today", icon: CalendarIcon },
                          tomorrow: { label: "Tomorrow", icon: CalendarIcon },
                          thisWeek: { label: "This Week", icon: CalendarIcon },
                          upcoming: { label: "Upcoming", icon: CalendarIcon },
                          noDueDate: { label: "No Due Date", icon: ListTodo },
                        };
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
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ADD TASKS TAB */}
          {activeTab === "add-tasks" && (
            <Card className="glass-card max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title *</Label>
                  <Input
                    id="task-title"
                    placeholder="What do you need to do?"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Add more details..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={taskCategory} onValueChange={setTaskCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !taskDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {taskDueDate ? format(taskDueDate, "MMM d, yyyy") : "Optional"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={taskDueDate} onSelect={setTaskDueDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-time">Due Time</Label>
                    <Input
                      id="task-time"
                      type="time"
                      value={taskDueTime}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-estimated">Estimated Time (minutes)</Label>
                  <Input
                    id="task-estimated"
                    type="number"
                    placeholder="e.g., 30"
                    value={taskEstimated}
                    onChange={(e) => setTaskEstimated(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attach to Roadmap</Label>
                  <Select value={taskRoadmap} onValueChange={(val) => { setTaskRoadmap(val); if (val && val !== "none") fetchTopics(val); else setTopics([]); }}>
                    <SelectTrigger><SelectValue placeholder="None (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {roadmaps.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {taskRoadmap && taskRoadmap !== "none" && topics.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attach to Topic</Label>
                    <Select value={taskTopic} onValueChange={setTaskTopic}>
                      <SelectTrigger><SelectValue placeholder="None (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="task-notes">Notes</Label>
                  <Textarea
                    id="task-notes"
                    placeholder="Any additional notes..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { resetTaskForm(); setActiveTab("show-tasks"); }} className="flex-1">Cancel</Button>
                  <Button variant="gradient" onClick={handleAddTask} disabled={!taskTitle.trim() || submitting} className="flex-1">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Delete Reminder Confirmation */}
      <AlertDialog open={!!deleteReminderId} onOpenChange={() => setDeleteReminderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this date?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReminder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Todo Confirmation */}
      <AlertDialog open={!!deleteTodoId} onOpenChange={() => setDeleteTodoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTodo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportantDatesPage;
