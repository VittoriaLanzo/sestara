import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RoadmapProgressOverview } from "@/components/progress/RoadmapProgressOverview";
import { EditableTitle } from "@/components/roadmap/EditableTitle";
import { EditableTopicCard } from "@/components/roadmap/EditableTopicCard";
import { EditableSubjectHeader } from "@/components/roadmap/EditableSubjectHeader";
import { AddItemDialog } from "@/components/roadmap/AddItemDialog";
import { DeleteConfirmDialog } from "@/components/roadmap/DeleteConfirmDialog";
import { DuplicateRoadmapDialog } from "@/components/roadmap/DuplicateRoadmapDialog";
import { RoadmapVersionHistory } from "@/components/roadmap/RoadmapVersionHistory";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  estimated_hours: number | null;
  order_index: number;
  revision_notes: string | null;
}

interface Subject {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  order_index: number;
  topics: Topic[];
}

interface Roadmap {
  id: string;
  title: string;
  goal_type: string;
  goal_details: any;
  target_date: string | null;
  created_at: string;
  user_id: string;
}

const RoadmapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteRoadmapOpen, setDeleteRoadmapOpen] = useState(false);
  const [isDeletingRoadmap, setIsDeletingRoadmap] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    fetchRoadmap();
  }, [user, id]);

  const fetchRoadmap = async () => {
    try {
      const { data: roadmapData, error: roadmapError } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (roadmapError || !roadmapData) {
        toast.error("Roadmap not found");
        navigate("/dashboard");
        return;
      }

      setRoadmap(roadmapData);

      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("roadmap_id", id)
        .order("order_index");

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
        return;
      }

      const subjectIds = subjectsData.map((s) => s.id);
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .in("subject_id", subjectIds.length > 0 ? subjectIds : ['none'])
        .order("order_index");

      if (topicsError) {
        console.error("Error fetching topics:", topicsError);
      }

      const subjectsWithTopics = subjectsData.map((subject) => ({
        ...subject,
        topics: (topicsData || []).filter((t) => t.subject_id === subject.id),
      }));

      setSubjects(subjectsWithTopics);

      if (subjectsWithTopics.length > 0) {
        setExpandedSubjects(new Set([subjectsWithTopics[0].id]));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Roadmap operations
  const updateRoadmapTitle = async (newTitle: string) => {
    const { error } = await supabase
      .from("roadmaps")
      .update({ title: newTitle })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update title");
      throw error;
    }

    setRoadmap((prev) => (prev ? { ...prev, title: newTitle } : null));
    toast.success("Title updated!");
  };

  const deleteRoadmap = async () => {
    setIsDeletingRoadmap(true);
    try {
      const { error } = await supabase.from("roadmaps").delete().eq("id", id);
      if (error) throw error;
      toast.success("Roadmap deleted");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to delete roadmap");
    } finally {
      setIsDeletingRoadmap(false);
    }
  };

  const duplicateRoadmap = async (newTitle: string) => {
    if (!roadmap || !user) return;

    try {
      // Create new roadmap
      const { data: newRoadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert([{
          title: newTitle,
          goal_type: roadmap.goal_type,
          goal_details: roadmap.goal_details,
          target_date: roadmap.target_date,
          user_id: user.id,
        }])
        .select()
        .single();

      if (roadmapError) throw roadmapError;

      // Duplicate subjects
      for (const subject of subjects) {
        const { data: newSubject, error: subjectError } = await supabase
          .from("subjects")
          .insert([{
            roadmap_id: newRoadmap.id,
            title: subject.title,
            description: subject.description,
            order_index: subject.order_index,
          }])
          .select()
          .single();

        if (subjectError) throw subjectError;

        // Duplicate topics
        if (subject.topics.length > 0) {
          const topicsToInsert = subject.topics.map((topic) => ({
            subject_id: newSubject.id,
            title: topic.title,
            description: topic.description,
            estimated_hours: topic.estimated_hours,
            order_index: topic.order_index,
            status: "not-started",
            progress: 0,
          }));

          const { error: topicsError } = await supabase
            .from("topics")
            .insert(topicsToInsert);

          if (topicsError) throw topicsError;
        }
      }

      toast.success("Roadmap duplicated!");
      navigate(`/roadmap/${newRoadmap.id}`);
    } catch (error) {
      console.error("Error duplicating roadmap:", error);
      toast.error("Failed to duplicate roadmap");
    }
  };

  // Subject operations
  const updateSubjectTitle = async (subjectId: string, newTitle: string) => {
    const { error } = await supabase
      .from("subjects")
      .update({ title: newTitle })
      .eq("id", subjectId);

    if (error) {
      toast.error("Failed to update subject");
      throw error;
    }

    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, title: newTitle } : s))
    );
  };

  const addSubject = async (title: string, description: string) => {
    const maxIndex = Math.max(...subjects.map((s) => s.order_index), -1);

    const { data, error } = await supabase
      .from("subjects")
      .insert([{
        roadmap_id: id,
        title,
        description: description || null,
        order_index: maxIndex + 1,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add subject");
      throw error;
    }

    setSubjects((prev) => [...prev, { ...data, topics: [] }]);
    setExpandedSubjects((prev) => new Set(prev).add(data.id));
    toast.success("Subject added!");
  };

  const deleteSubject = async (subjectId: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
    if (error) {
      toast.error("Failed to delete subject");
      throw error;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    toast.success("Subject deleted");
  };

  // Topic operations
  const updateTopicTitle = async (topicId: string, subjectId: string, newTitle: string) => {
    const { error } = await supabase
      .from("topics")
      .update({ title: newTitle })
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to update topic");
      throw error;
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, title: newTitle } : t
              ),
            }
          : s
      )
    );
  };

  const updateTopicStatus = async (
    topicId: string,
    subjectId: string,
    newStatus: string,
    newProgress: number
  ) => {
    const { error } = await supabase
      .from("topics")
      .update({ status: newStatus, progress: newProgress })
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to update status");
      throw error;
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, status: newStatus, progress: newProgress } : t
              ),
            }
          : s
      )
    );
    toast.success("Status updated!");
  };

  const updateTopicRevisionNotes = async (topicId: string, subjectId: string, notes: string) => {
    const { error } = await supabase
      .from("topics")
      .update({ revision_notes: notes })
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to save notes");
      throw error;
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t.id === topicId ? { ...t, revision_notes: notes } : t
              ),
            }
          : s
      )
    );
    toast.success("Notes saved!");
  };

  const addTopic = async (subjectId: string, title: string, description: string, estimatedHours?: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const maxIndex = subject
      ? Math.max(...subject.topics.map((t) => t.order_index), -1)
      : -1;

    const { data, error } = await supabase
      .from("topics")
      .insert([{
        subject_id: subjectId,
        title,
        description: description || null,
        estimated_hours: estimatedHours || null,
        order_index: maxIndex + 1,
        status: "not-started",
        progress: 0,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add topic");
      throw error;
    }

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, data] } : s
      )
    );
    toast.success("Topic added!");
  };

  const deleteTopic = async (topicId: string, subjectId: string) => {
    const { error } = await supabase.from("topics").delete().eq("id", topicId);
    if (error) {
      toast.error("Failed to delete topic");
      throw error;
    }
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s
      )
    );
    toast.success("Topic deleted");
  };

  // Drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "subject") {
      const newSubjects = Array.from(subjects);
      const [removed] = newSubjects.splice(source.index, 1);
      newSubjects.splice(destination.index, 0, removed);

      // Update order indices
      const updatedSubjects = newSubjects.map((s, idx) => ({ ...s, order_index: idx }));
      setSubjects(updatedSubjects);

      // Persist to database
      for (const subject of updatedSubjects) {
        await supabase
          .from("subjects")
          .update({ order_index: subject.order_index })
          .eq("id", subject.id);
      }
    } else if (type === "topic") {
      const sourceSubjectId = source.droppableId;
      const destSubjectId = destination.droppableId;

      const sourceSubject = subjects.find((s) => s.id === sourceSubjectId);
      const destSubject = subjects.find((s) => s.id === destSubjectId);

      if (!sourceSubject || !destSubject) return;

      if (sourceSubjectId === destSubjectId) {
        // Reorder within same subject
        const newTopics = Array.from(sourceSubject.topics);
        const [removed] = newTopics.splice(source.index, 1);
        newTopics.splice(destination.index, 0, removed);

        const updatedTopics = newTopics.map((t, idx) => ({ ...t, order_index: idx }));

        setSubjects((prev) =>
          prev.map((s) => (s.id === sourceSubjectId ? { ...s, topics: updatedTopics } : s))
        );

        for (const topic of updatedTopics) {
          await supabase
            .from("topics")
            .update({ order_index: topic.order_index })
            .eq("id", topic.id);
        }
      } else {
        // Move to different subject
        const sourceTopics = Array.from(sourceSubject.topics);
        const destTopics = Array.from(destSubject.topics);

        const [movedTopic] = sourceTopics.splice(source.index, 1);
        movedTopic.order_index = destination.index;
        destTopics.splice(destination.index, 0, movedTopic);

        const updatedSourceTopics = sourceTopics.map((t, idx) => ({ ...t, order_index: idx }));
        const updatedDestTopics = destTopics.map((t, idx) => ({ ...t, order_index: idx }));

        setSubjects((prev) =>
          prev.map((s) => {
            if (s.id === sourceSubjectId) return { ...s, topics: updatedSourceTopics };
            if (s.id === destSubjectId) return { ...s, topics: updatedDestTopics };
            return s;
          })
        );

        // Update moved topic's subject
        await supabase
          .from("topics")
          .update({ subject_id: destSubjectId, order_index: destination.index })
          .eq("id", movedTopic.id);

        // Update order indices
        for (const topic of updatedSourceTopics) {
          await supabase
            .from("topics")
            .update({ order_index: topic.order_index })
            .eq("id", topic.id);
        }
        for (const topic of updatedDestTopics) {
          await supabase
            .from("topics")
            .update({ order_index: topic.order_index })
            .eq("id", topic.id);
        }
      }
    }
  };

  // Version history
  const getCurrentSnapshot = useCallback(() => {
    return {
      roadmap,
      subjects,
    };
  }, [roadmap, subjects]);

  const restoreVersion = async (snapshot: any) => {
    // Restore roadmap title
    if (snapshot.roadmap && snapshot.roadmap.title !== roadmap?.title) {
      await updateRoadmapTitle(snapshot.roadmap.title);
    }

    // For now, just refetch - full restore would require more complex logic
    await fetchRoadmap();
  };

  // Progress calculations
  const calculateOverallProgress = () => {
    const allTopics = subjects.flatMap((s) => s.topics);
    if (allTopics.length === 0) return 0;
    const totalProgress = allTopics.reduce((sum, t) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / allTopics.length);
  };

  const calculateSubjectProgress = (subject: Subject) => {
    if (subject.topics.length === 0) return 0;
    const totalProgress = subject.topics.reduce((sum, t) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / subject.topics.length);
  };

  const getTotalEstimatedHours = () => {
    return subjects
      .flatMap((s) => s.topics)
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  };

  const getRevisionTopicsCount = () => {
    return subjects.flatMap((s) => s.topics).filter((t) => t.status === "needs-revision").length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!roadmap) return null;

  const overallProgress = calculateOverallProgress();
  const totalHours = getTotalEstimatedHours();
  const completedTopics = subjects.flatMap((s) => s.topics).filter((t) => t.status === "completed").length;
  const totalTopics = subjects.flatMap((s) => s.topics).length;
  const revisionCount = getRevisionTopicsCount();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <RoadmapVersionHistory
              roadmapId={roadmap.id}
              currentSnapshot={getCurrentSnapshot}
              onRestore={restoreVersion}
              onSave={async () => {}}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuplicateOpen(true)}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteRoadmapOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Roadmap Title */}
        <div className="mb-6">
          <EditableTitle
            value={roadmap.title}
            onSave={updateRoadmapTitle}
            variant="heading"
            className="text-2xl"
          />
          {revisionCount > 0 && (
            <p className="text-sm text-warning mt-1">
              {revisionCount} topic{revisionCount > 1 ? "s" : ""} need revision
            </p>
          )}
        </div>

        {/* Progress Overview */}
        <div className="mb-8 animate-slide-up">
          <RoadmapProgressOverview
            roadmapTitle={roadmap.title}
            overallProgress={overallProgress}
            completedTopics={completedTopics}
            totalTopics={totalTopics}
            totalHours={totalHours}
            targetDate={roadmap.target_date}
            subjects={subjects.map((s) => ({
              id: s.id,
              title: s.title,
              completedTopics: s.topics.filter((t) => t.status === "completed").length,
              totalTopics: s.topics.length,
              progress: calculateSubjectProgress(s),
              isCompleted: s.is_completed || calculateSubjectProgress(s) === 100,
            }))}
            streak={0}
            trend="stable"
          />
        </div>

        {/* Subjects List with Drag & Drop */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="subjects" type="subject">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4"
              >
                {subjects.map((subject, index) => {
                  const isExpanded = expandedSubjects.has(subject.id);
                  const subjectProgress = calculateSubjectProgress(subject);

                  return (
                    <Draggable key={subject.id} draggableId={subject.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="animate-slide-up"
                          style={{
                            ...provided.draggableProps.style,
                            animationDelay: `${0.1 * index}s`,
                          }}
                        >
                          <EditableSubjectHeader
                            id={subject.id}
                            title={subject.title}
                            description={subject.description}
                            progress={subjectProgress}
                            completedTopics={subject.topics.filter((t) => t.status === "completed").length}
                            totalTopics={subject.topics.length}
                            isExpanded={isExpanded}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={provided.dragHandleProps}
                            onToggle={() => toggleSubject(subject.id)}
                            onTitleChange={(title) => updateSubjectTitle(subject.id, title)}
                            onAddTopic={() => {
                              setActiveSubjectId(subject.id);
                              setAddTopicOpen(true);
                            }}
                            onDelete={() => deleteSubject(subject.id)}
                          />

                          {/* Topics List */}
                          {isExpanded && (
                            <Droppable droppableId={subject.id} type="topic">
                              {(topicsProvided) => (
                                <div
                                  ref={topicsProvided.innerRef}
                                  {...topicsProvided.droppableProps}
                                  className="mt-2 ml-6 space-y-2 animate-fade-in"
                                >
                                  {subject.topics.map((topic, topicIndex) => (
                                    <Draggable
                                      key={topic.id}
                                      draggableId={topic.id}
                                      index={topicIndex}
                                    >
                                      {(topicProvided, topicSnapshot) => (
                                        <div
                                          ref={topicProvided.innerRef}
                                          {...topicProvided.draggableProps}
                                        >
                                          <EditableTopicCard
                                            id={topic.id}
                                            title={topic.title}
                                            description={topic.description || ""}
                                            progress={topic.progress}
                                            status={topic.status as any}
                                            estimatedTime={topic.estimated_hours ? `${topic.estimated_hours}h` : undefined}
                                            revisionNotes={topic.revision_notes}
                                            isDragging={topicSnapshot.isDragging}
                                            dragHandleProps={topicProvided.dragHandleProps}
                                            onTitleChange={(title) =>
                                              updateTopicTitle(topic.id, subject.id, title)
                                            }
                                            onStatusChange={(status, progress) =>
                                              updateTopicStatus(topic.id, subject.id, status, progress)
                                            }
                                            onRevisionNotesChange={(notes) =>
                                              updateTopicRevisionNotes(topic.id, subject.id, notes)
                                            }
                                            onDelete={() => deleteTopic(topic.id, subject.id)}
                                            onClick={() => navigate(`/topic/${topic.id}`)}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {topicsProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Subject Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setAddSubjectOpen(true)}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>

        {subjects.length === 0 && (
          <div className="glass-card p-12 text-center mt-6">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              No subjects yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start building your roadmap by adding subjects.
            </p>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddItemDialog
        open={addSubjectOpen}
        onOpenChange={setAddSubjectOpen}
        type="subject"
        onAdd={addSubject}
      />

      <AddItemDialog
        open={addTopicOpen}
        onOpenChange={setAddTopicOpen}
        type="topic"
        onAdd={(title, description, hours) =>
          activeSubjectId ? addTopic(activeSubjectId, title, description, hours) : Promise.resolve()
        }
      />

      <DuplicateRoadmapDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        originalTitle={roadmap.title}
        onDuplicate={duplicateRoadmap}
      />

      <DeleteConfirmDialog
        open={deleteRoadmapOpen}
        onOpenChange={setDeleteRoadmapOpen}
        title={roadmap.title}
        itemType="roadmap"
        onConfirm={deleteRoadmap}
        isDeleting={isDeletingRoadmap}
      />
    </div>
  );
};

export default RoadmapView;
