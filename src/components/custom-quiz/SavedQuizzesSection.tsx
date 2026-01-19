import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { 
  FolderOpen, Play, MoreVertical, Edit, Download, Trash2, 
  Shuffle, Clock, Trophy, FolderPlus, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  type SavedQuiz,
  type QuizGroup,
  type CustomQuiz,
  useDeleteQuiz,
  useUpdateQuizFull,
  useUpdateQuizStats,
  useCreateGroup,
} from "@/hooks/useCustomQuizzes";

interface SavedQuizzesSectionProps {
  savedQuizzes: SavedQuiz[];
  quizGroups: QuizGroup[];
  isLoading?: boolean;
  onStartQuiz: (quiz: CustomQuiz, mode: 'timer' | 'track', minutes: number, quizId?: string) => void;
}

export const SavedQuizzesSection = ({
  savedQuizzes,
  quizGroups,
  isLoading,
  onStartQuiz,
}: SavedQuizzesSectionProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedForMix, setSelectedForMix] = useState<string[]>([]);
  const [mixQuestionCount, setMixQuestionCount] = useState(10);
  const [showMixDialog, setShowMixDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingQuiz, setEditingQuiz] = useState<SavedQuiz | null>(null);

  const deleteQuizMutation = useDeleteQuiz();
  const updateQuizMutation = useUpdateQuizFull();
  const updateStatsMutation = useUpdateQuizStats();
  const createGroupMutation = useCreateGroup();

  const filteredQuizzes = selectedGroup === "all" 
    ? savedQuizzes 
    : savedQuizzes.filter(q => q.groupId === selectedGroup);

  const handleDeleteQuiz = (id: string) => {
    deleteQuizMutation.mutate(id);
  };

  const handleExportQuiz = (quiz: SavedQuiz) => {
    const jsonStr = JSON.stringify(quiz.quiz, null, 2);
    navigator.clipboard.writeText(jsonStr);
    toast.success("Quiz JSON copied to clipboard!");
  };

  const handlePlayQuiz = (quiz: SavedQuiz) => {
    // Update stats
    updateStatsMutation.mutate({
      id: quiz.id,
      timesPlayed: quiz.timesPlayed + 1,
    });
    
    const suggestedTime = Math.ceil(quiz.quiz.questions.length * 1.5);
    onStartQuiz(quiz.quiz, quiz.quiz.durationMode || 'track', suggestedTime, quiz.id);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
    createGroupMutation.mutate(
      { name: newGroupName.trim(), color: colors[quizGroups.length % 5] },
      {
        onSuccess: () => {
          setNewGroupName("");
          setShowGroupDialog(false);
        },
      }
    );
  };

  const handleStartMixedQuiz = () => {
    if (selectedForMix.length < 2) {
      toast.error("Select at least 2 quizzes to mix");
      return;
    }

    const selectedQuizzes = savedQuizzes.filter(q => selectedForMix.includes(q.id));
    const allQuestions = selectedQuizzes.flatMap(q => q.quiz.questions);
    
    // Shuffle and pick
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(mixQuestionCount, shuffled.length));

    const mixedQuiz: CustomQuiz = {
      quizTitle: `Mixed Quiz (${selectedQuizzes.length} sources)`,
      description: `Combined from: ${selectedQuizzes.map(q => q.quiz.quizTitle).join(', ')}`,
      questions: picked.map((q, i) => ({ ...q, id: `mix-${i}` })),
    };

    const suggestedTime = Math.ceil(picked.length * 1.5);
    setShowMixDialog(false);
    setSelectedForMix([]);
    onStartQuiz(mixedQuiz, 'track', suggestedTime);
  };

  const handleUpdateQuizMeta = (id: string, title: string, groupId: string) => {
    const quiz = savedQuizzes.find(q => q.id === id);
    if (!quiz) return;

    const updatedQuiz = { ...quiz.quiz, quizTitle: title };
    const groupName = quizGroups.find(g => g.id === groupId)?.name || 'General';

    updateQuizMutation.mutate(
      { id, quiz: updatedQuiz, groupId, groupName },
      {
        onSuccess: () => {
          setEditingQuiz(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {quizGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Group</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., JEE Physics"
                  />
                </div>
                <Button 
                  onClick={handleCreateGroup} 
                  className="w-full"
                  disabled={createGroupMutation.isPending}
                >
                  {createGroupMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={showMixDialog} onOpenChange={setShowMixDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={savedQuizzes.length < 2}>
              <Shuffle className="w-4 h-4" />
              Mixed Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Mixed Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Select quizzes to combine into a randomized mixed quiz.
              </p>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {savedQuizzes.map(quiz => (
                    <label
                      key={quiz.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedForMix.includes(quiz.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedForMix([...selectedForMix, quiz.id]);
                          } else {
                            setSelectedForMix(selectedForMix.filter(id => id !== quiz.id));
                          }
                        }}
                      />
                      <span className="text-sm">{quiz.quiz.quizTitle}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {quiz.quiz.questions.length}Q
                      </Badge>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              <div className="space-y-2">
                <Label>Number of questions to pick</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={mixQuestionCount}
                  onChange={(e) => setMixQuestionCount(parseInt(e.target.value) || 10)}
                />
              </div>
              <Button 
                onClick={handleStartMixedQuiz} 
                className="w-full gap-2"
                disabled={selectedForMix.length < 2}
              >
                <Play className="w-4 h-4" />
                Start Mixed Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz List */}
      {filteredQuizzes.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No saved quizzes yet</h3>
            <p className="text-sm text-muted-foreground">
              Create a quiz using the Paste JSON tab and save it here for future practice.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredQuizzes.map(quiz => (
            <Card key={quiz.id} className="glass-card hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{quiz.quiz.quizTitle}</h3>
                    {quiz.quiz.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {quiz.quiz.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingQuiz(quiz)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportQuiz(quiz)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">{quiz.quiz.questions.length} questions</Badge>
                  {quiz.groupName && (
                    <Badge variant="outline">{quiz.groupName}</Badge>
                  )}
                  {quiz.quiz.examLevel && (
                    <Badge variant="outline" className="text-xs">{quiz.quiz.examLevel}</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(quiz.lastOpenedAt), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {quiz.timesPlayed}x played
                  </span>
                  {quiz.bestScore > 0 && (
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      {quiz.bestScore}%
                    </span>
                  )}
                </div>

                <Button 
                  onClick={() => handlePlayQuiz(quiz)} 
                  className="w-full gap-2"
                  size="sm"
                >
                  <Play className="w-4 h-4" />
                  Play Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Quiz Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={() => setEditingQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
          </DialogHeader>
          {editingQuiz && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Quiz Title</Label>
                <Input
                  value={editingQuiz.quiz.quizTitle}
                  onChange={(e) => setEditingQuiz({
                    ...editingQuiz,
                    quiz: { ...editingQuiz.quiz, quizTitle: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select 
                  value={editingQuiz.groupId || 'default'}
                  onValueChange={(v) => setEditingQuiz({ ...editingQuiz, groupId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quizGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => handleUpdateQuizMeta(
                  editingQuiz.id, 
                  editingQuiz.quiz.quizTitle, 
                  editingQuiz.groupId || 'default'
                )}
                className="w-full"
                disabled={updateQuizMutation.isPending}
              >
                {updateQuizMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
