import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface CustomQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  keywordsEnglish?: string[];
  keywordsLocal?: string[];
}

export interface CustomQuiz {
  quizTitle: string;
  description?: string;
  examLevel?: string;
  language?: string;
  durationMode?: 'timer' | 'track';
  timerMinutes?: number;
  questions: CustomQuizQuestion[];
}

export interface SavedQuiz {
  id: string;
  quiz: CustomQuiz;
  groupId?: string;
  groupName?: string;
  lastOpenedAt: string;
  timesPlayed: number;
  bestScore: number;
  previousScore: number;
  createdAt: string;
}

export interface QuizGroup {
  id: string;
  name: string;
  color: string;
}

// Fetch saved quizzes from database
export const useCustomQuizzes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom-quizzes', user?.id],
    queryFn: async (): Promise<SavedQuiz[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('custom_quizzes')
        .select('*')
        .order('last_opened_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        quiz: row.quiz_data as unknown as CustomQuiz,
        groupId: row.group_id || undefined,
        groupName: row.group_name || 'General',
        lastOpenedAt: row.last_opened_at || row.created_at,
        timesPlayed: row.times_played || 0,
        bestScore: row.best_score || 0,
        previousScore: row.previous_score || 0,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
  });
};

// Fetch quiz groups from database
export const useQuizGroups = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-groups', user?.id],
    queryFn: async (): Promise<QuizGroup[]> => {
      if (!user) return [{ id: 'default', name: 'General', color: 'blue' }];
      
      const { data, error } = await supabase
        .from('quiz_groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const groups = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        color: row.color || 'blue',
      }));

      // Always include a default group
      if (!groups.some(g => g.name === 'General')) {
        return [{ id: 'default', name: 'General', color: 'blue' }, ...groups];
      }

      return groups;
    },
    enabled: !!user,
  });
};

// Save a new quiz
export const useSaveQuiz = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quiz, groupId, groupName }: { quiz: CustomQuiz; groupId?: string; groupName?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('custom_quizzes')
        .insert({
          user_id: user.id,
          quiz_data: quiz as unknown as Json,
          group_id: groupId === 'default' ? null : groupId,
          group_name: groupName || 'General',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quizzes'] });
      toast.success("Quiz saved to library!");
    },
    onError: (error) => {
      console.error('Failed to save quiz:', error);
      toast.error("Failed to save quiz");
    },
  });
};

// Update quiz metadata
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, groupId, groupName }: { id: string; title: string; groupId: string; groupName: string }) => {
      const { error } = await supabase
        .from('custom_quizzes')
        .update({
          quiz_data: supabase.rpc ? undefined : undefined, // We'll handle this separately
          group_id: groupId === 'default' ? null : groupId,
          group_name: groupName,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quizzes'] });
      toast.success("Quiz updated!");
    },
    onError: (error) => {
      console.error('Failed to update quiz:', error);
      toast.error("Failed to update quiz");
    },
  });
};

// Update quiz with full data (including title in quiz_data)
export const useUpdateQuizFull = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quiz, groupId, groupName }: { id: string; quiz: CustomQuiz; groupId?: string; groupName?: string }) => {
      const { error } = await supabase
        .from('custom_quizzes')
        .update({
          quiz_data: quiz as unknown as Json,
          group_id: groupId === 'default' ? null : groupId,
          group_name: groupName || 'General',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quizzes'] });
    },
  });
};

// Update quiz play stats
export const useUpdateQuizStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, timesPlayed, bestScore, previousScore }: { id: string; timesPlayed?: number; bestScore?: number; previousScore?: number }) => {
      const updates: Record<string, unknown> = {
        last_opened_at: new Date().toISOString(),
      };
      
      if (timesPlayed !== undefined) updates.times_played = timesPlayed;
      if (bestScore !== undefined) updates.best_score = bestScore;
      if (previousScore !== undefined) updates.previous_score = previousScore;

      const { error } = await supabase
        .from('custom_quizzes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quizzes'] });
    },
  });
};

// Delete a quiz
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quizzes'] });
      toast.success("Quiz deleted");
    },
    onError: (error) => {
      console.error('Failed to delete quiz:', error);
      toast.error("Failed to delete quiz");
    },
  });
};

// Create a new group
export const useCreateGroup = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('quiz_groups')
        .insert({
          user_id: user.id,
          name,
          color: color || 'blue',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-groups'] });
      toast.success("Group created!");
    },
    onError: (error) => {
      console.error('Failed to create group:', error);
      toast.error("Failed to create group");
    },
  });
};

// Delete a group
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quiz_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-groups'] });
      toast.success("Group deleted");
    },
  });
};
