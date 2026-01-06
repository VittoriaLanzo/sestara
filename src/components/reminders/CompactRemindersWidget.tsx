import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Plus, ChevronRight, Loader2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { AddReminderDialog } from "./AddReminderDialog";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  reminder_type: string;
  due_date: string;
  is_completed: boolean;
}

export const CompactRemindersWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("id, title, reminder_type, due_date, is_completed")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("due_date", { ascending: true })
        .limit(6);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
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
      fetchReminders();
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Failed to add reminder");
    }
  };

  const getTypeDot = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-destructive";
      case "deadline":
        return "bg-warning";
      case "revision":
        return "bg-primary";
      default:
        return "bg-muted-foreground";
    }
  };

  const getDueDateLabel = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "Overdue";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (loading) {
    return (
      <div className="glass-card-elevated p-4 flex items-center justify-center h-[180px] border-border/60">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card-elevated p-4 border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm text-foreground">
            Important Dates
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/important-dates")}
            className="gap-1 h-7 px-2 text-xs text-muted-foreground"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">
            No upcoming dates
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            Add reminder
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[120px]">
          <div className="space-y-2 pr-2">
            {reminders.map((reminder) => {
              const isOverdue = isPast(new Date(reminder.due_date)) && !isToday(new Date(reminder.due_date));
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
                    isOverdue && "bg-destructive/5"
                  )}
                  onClick={() => navigate("/important-dates")}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", getTypeDot(reminder.reminder_type))} />
                  <span className={cn(
                    "text-sm truncate flex-1",
                    isOverdue ? "text-destructive" : "text-foreground"
                  )}>
                    {reminder.title}
                  </span>
                  <span className={cn(
                    "text-xs shrink-0",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {getDueDateLabel(reminder.due_date)}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <AddReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddReminder}
        userId={user?.id || ""}
      />
    </div>
  );
};