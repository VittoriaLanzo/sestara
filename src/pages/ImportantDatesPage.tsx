import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
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
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek, isThisMonth, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
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

const typeConfig: Record<string, { label: string; icon: typeof CalendarIcon; color: string; bgColor: string }> = {
  exam: { 
    label: "Exam", 
    icon: GraduationCap, 
    color: "text-destructive", 
    bgColor: "bg-destructive/10 border-destructive/20" 
  },
  deadline: { 
    label: "Deadline", 
    icon: AlertTriangle, 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10 border-orange-500/20" 
  },
  revision: { 
    label: "Revision", 
    icon: BookOpen, 
    color: "text-purple-500", 
    bgColor: "bg-purple-500/10 border-purple-500/20" 
  },
  general: { 
    label: "Reminder", 
    icon: Bell, 
    color: "text-blue-500", 
    bgColor: "bg-blue-500/10 border-blue-500/20" 
  },
};

const ImportantDatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Enrich with roadmap/topic titles
      const enrichedReminders = await Promise.all(
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

      setReminders(enrichedReminders);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
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
      toast.error("Failed to update reminder");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("reminders").delete().eq("id", deleteId);

      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Reminder deleted");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddReminder = async (data: {
    title: string;
    description?: string;
    reminderType: string;
    dueDate: Date;
    reminderAt?: Date;
    roadmapId?: string;
    topicId?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("reminders").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        reminder_type: data.reminderType,
        due_date: data.dueDate.toISOString(),
        reminder_at: data.reminderAt?.toISOString(),
        roadmap_id: data.roadmapId && data.roadmapId !== "none" ? data.roadmapId : null,
        topic_id: data.topicId && data.topicId !== "none" ? data.topicId : null,
      });

      if (error) throw error;

      toast.success("Reminder added successfully");
      fetchData();
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Failed to add reminder");
    }
  };

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (filter === "all") return true;
      if (filter === "completed") return r.is_completed;
      if (filter === "upcoming") return !r.is_completed;
      if (filter === "today") return isToday(new Date(r.due_date));
      if (filter === "thisWeek") return isThisWeek(new Date(r.due_date));
      if (filter === "overdue") return isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)) && !r.is_completed;
      return r.reminder_type === filter;
    });
  }, [reminders, filter]);

  const stats = useMemo(() => {
    const today = reminders.filter((r) => isToday(new Date(r.due_date)) && !r.is_completed).length;
    const thisWeek = reminders.filter((r) => isThisWeek(new Date(r.due_date)) && !r.is_completed).length;
    const overdue = reminders.filter((r) => isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)) && !r.is_completed).length;
    const upcoming = reminders.filter((r) => !r.is_completed).length;
    
    return { today, thisWeek, overdue, upcoming };
  }, [reminders]);

  // Calendar helpers
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
          {/* Complete button */}
          <button
            onClick={() => handleComplete(reminder.id)}
            className={cn(
              "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
              reminder.is_completed
                ? "bg-primary border-primary"
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {reminder.is_completed && <Check className="w-3 h-3 text-primary-foreground" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={cn("text-xs gap-1", config.bgColor, config.color)}>
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">Overdue</Badge>
              )}
              {isDueToday && !isOverdue && (
                <Badge className="text-xs bg-orange-500 text-white">Due Today</Badge>
              )}
              {isDueTomorrow && (
                <Badge className="text-xs bg-primary/20 text-primary">Tomorrow</Badge>
              )}
            </div>

            <h3 className={cn(
              "font-display font-semibold text-foreground mb-1",
              reminder.is_completed && "line-through"
            )}>
              {reminder.title}
            </h3>

            {reminder.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {reminder.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{format(dueDateObj, "EEE, MMM d, yyyy")}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isOverdue
                    ? `${formatDistanceToNow(dueDateObj)} ago`
                    : isDueToday
                    ? "Today"
                    : `in ${formatDistanceToNow(dueDateObj)}`}
                </span>
              </div>

              {reminder.roadmap_title && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{reminder.roadmap_title}</span>
                </div>
              )}

              {reminder.topic_title && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{reminder.topic_title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteId(reminder.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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
              Important Dates
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your exams, deadlines, and revision reminders
            </p>
          </div>
          <Button variant="gradient" onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Date
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("today")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Today</span>
              </div>
              <p className="text-2xl font-bold">{stats.today}</p>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("thisWeek")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-xs font-medium">This Week</span>
              </div>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("overdue")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("upcoming")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Upcoming</span>
              </div>
              <p className="text-2xl font-bold">{stats.upcoming}</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle & Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="w-auto">
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <Select value={filter} onValueChange={setFilter}>
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
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredReminders.length} {filteredReminders.length === 1 ? "date" : "dates"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "list" ? (
          <>
            {filteredReminders.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  No dates found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {reminders.length === 0 ? "Add your first important date" : "No dates match this filter"}
                </p>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Add Date
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReminders.map((reminder) => renderReminderCard(reminder))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="glass-card lg:col-span-2">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="w-full"
                  modifiers={{
                    hasReminder: (date) => datesWithReminders.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    hasReminder: "bg-primary/20 font-bold",
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Date Details */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-3">No events on this day</p>
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateReminders.map((reminder) => {
                      const config = typeConfig[reminder.reminder_type] || typeConfig.general;
                      const TypeIcon = config.icon;
                      
                      return (
                        <div
                          key={reminder.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            config.bgColor,
                            reminder.is_completed && "opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => handleComplete(reminder.id)}
                              className={cn(
                                "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                reminder.is_completed
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/50"
                              )}
                            >
                              {reminder.is_completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <TypeIcon className={cn("w-3 h-3", config.color)} />
                                <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                              </div>
                              <p className={cn("text-sm font-medium", reminder.is_completed && "line-through")}>
                                {reminder.title}
                              </p>
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
      </main>

      {/* Add Dialog */}
      <AddReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddReminder}
        userId={user?.id || ""}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this date?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportantDatesPage;
