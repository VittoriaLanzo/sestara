import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReminderCard } from "./ReminderCard";
import { AddReminderDialog } from "./AddReminderDialog";
import { Calendar, Plus, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface RemindersWidgetProps {
  limit?: number;
  showAddButton?: boolean;
  onViewAll?: () => void;
}

export const RemindersWidget = ({
  limit = 5,
  showAddButton = true,
  onViewAll,
}: RemindersWidgetProps) => {
  const { user } = useAuth();
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
        .select(`
          id,
          title,
          description,
          reminder_type,
          due_date,
          reminder_at,
          roadmap_id,
          topic_id,
          is_completed
        `)
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Fetch related roadmap and topic titles
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);

      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reminder deleted");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const upcomingReminders = reminders.filter((r) => !r.is_completed);
  const completedReminders = reminders.filter((r) => r.is_completed);

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            Important Dates
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {showAddButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
          {onViewAll && reminders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="gap-1 text-muted-foreground"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No upcoming deadlines or exams.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setDialogOpen(true)}
          >
            Add your first reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              id={reminder.id}
              title={reminder.title}
              description={reminder.description}
              reminderType={reminder.reminder_type}
              dueDate={reminder.due_date}
              reminderAt={reminder.reminder_at}
              roadmapTitle={reminder.roadmap_title}
              topicTitle={reminder.topic_title}
              isCompleted={reminder.is_completed}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))}

          {completedReminders.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground uppercase tracking-wide pt-2">
                Completed
              </div>
              {completedReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  id={reminder.id}
                  title={reminder.title}
                  description={reminder.description}
                  reminderType={reminder.reminder_type}
                  dueDate={reminder.due_date}
                  reminderAt={reminder.reminder_at}
                  roadmapTitle={reminder.roadmap_title}
                  topicTitle={reminder.topic_title}
                  isCompleted={reminder.is_completed}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
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
