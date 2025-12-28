import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Roadmap {
  id: string;
  title: string;
}

interface Topic {
  id: string;
  title: string;
  subject_id: string;
}

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    title: string;
    description?: string;
    reminderType: string;
    dueDate: Date;
    reminderAt?: Date;
    roadmapId?: string;
    topicId?: string;
  }) => Promise<void>;
  userId: string;
}

export const AddReminderDialog = ({
  open,
  onOpenChange,
  onAdd,
  userId,
}: AddReminderDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderType, setReminderType] = useState("general");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [reminderAt, setReminderAt] = useState<Date | undefined>(undefined);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRoadmaps();
    }
  }, [open, userId]);

  useEffect(() => {
    if (selectedRoadmap) {
      fetchTopics(selectedRoadmap);
    } else {
      setTopics([]);
      setSelectedTopic("");
    }
  }, [selectedRoadmap]);

  const fetchRoadmaps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("roadmaps")
      .select("id, title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRoadmaps(data || []);
    setLoading(false);
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
        .select("id, title, subject_id")
        .in("subject_id", subjectIds)
        .order("order_index", { ascending: true });
      setTopics(topicsData || []);
    } else {
      setTopics([]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate) return;

    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        reminderType,
        dueDate,
        reminderAt,
        roadmapId: selectedRoadmap || undefined,
        topicId: selectedTopic || undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setReminderType("general");
    setDueDate(undefined);
    setReminderAt(undefined);
    setSelectedRoadmap("");
    setSelectedTopic("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Final Exam, Assignment Due"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add any notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remind me on</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !reminderAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reminderAt ? format(reminderAt, "MMM d, yyyy") : "Optional reminder date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminderAt}
                  onSelect={setReminderAt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Attach to Roadmap</Label>
            <Select value={selectedRoadmap} onValueChange={setSelectedRoadmap}>
              <SelectTrigger>
                <SelectValue placeholder="None (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {roadmaps.map((roadmap) => (
                  <SelectItem key={roadmap.id} value={roadmap.id}>
                    {roadmap.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoadmap && selectedRoadmap !== "none" && topics.length > 0 && (
            <div className="space-y-2">
              <Label>Attach to Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="None (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={!title.trim() || !dueDate || submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
