import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AddReminderDialog } from "@/components/reminders/AddReminderDialog";
import { 
  Calendar, 
  Plus, 
  Loader2, 
  ArrowLeft, 
  Trash2, 
  Check,
  BookOpen,
  MapPin,
  Clock,
  Edit2
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
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

const ImportantDatesPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

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
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      // Fetch reminders
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

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "exam":
        return { label: "Exam", className: "bg-destructive/10 text-destructive border-destructive/20" };
      case "deadline":
        return { label: "Deadline", className: "bg-warning/10 text-warning border-warning/20" };
      case "revision":
        return { label: "Revision", className: "bg-primary/10 text-primary border-primary/20" };
      default:
        return { label: "Reminder", className: "bg-muted text-muted-foreground border-muted" };
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === "all") return true;
    if (filter === "completed") return r.is_completed;
    if (filter === "upcoming") return !r.is_completed;
    return r.reminder_type === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSignOut={signOut} displayName={displayName} />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Important Dates
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your exams, deadlines, and revision reminders
            </p>
          </div>
          <Button variant="gradient" onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Date
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredReminders.length} {filteredReminders.length === 1 ? "date" : "dates"}
          </span>
        </div>

        {/* Reminders List */}
        {filteredReminders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              No dates found
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === "all" ? "Add your first important date" : "No dates match this filter"}
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Add Date
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => {
              const dueDateObj = new Date(reminder.due_date);
              const isOverdue = isPast(dueDateObj) && !reminder.is_completed && !isToday(dueDateObj);
              const isDueToday = isToday(dueDateObj);
              const isDueTomorrow = isTomorrow(dueDateObj);
              const typeConfig = getTypeConfig(reminder.reminder_type);

              return (
                <div
                  key={reminder.id}
                  className={cn(
                    "glass-card p-5 transition-all",
                    reminder.is_completed && "opacity-60",
                    isOverdue && "border-destructive/30"
                  )}
                >
                  <div className="flex items-start gap-4">
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
                        <Badge variant="outline" className={cn("text-xs", typeConfig.className)}>
                          {typeConfig.label}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                        {isDueToday && !isOverdue && (
                          <Badge className="text-xs bg-warning text-warning-foreground">Due Today</Badge>
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
                        <p className="text-sm text-muted-foreground mb-3">
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(dueDateObj, "EEEE, MMMM d, yyyy")}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {isOverdue
                              ? `${formatDistanceToNow(dueDateObj)} ago`
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(reminder.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
      </main>
    </div>
  );
};

export default ImportantDatesPage;