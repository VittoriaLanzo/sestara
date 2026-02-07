import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
import { validateQuizForChallenge, createQuizSnapshot } from "@/lib/quizValidation";
 
 export interface Challenge {
   id: string;
   creatorId: string;
   challengeCode: string;
   title: string;
   quizData: CustomQuiz;
   quizType: string;
   sourceQuizId?: string;
   isActive: boolean;
   maxAttempts: number;
   createdAt: string;
   expiresAt?: string;
 }
 
 export interface ChallengeAttempt {
   id: string;
   challengeId: string;
   userId: string;
   userName: string;
   score: number;
   maxScore: number;
   accuracy: number;
   timeTakenSeconds: number;
   answers?: Record<string, string>;
   isBestAttempt: boolean;
   completedAt: string;
   createdAt: string;
 }
 
 // Generate a short unique code
 const generateChallengeCode = (): string => {
   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   let code = '';
   for (let i = 0; i < 6; i++) {
     code += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return code;
 };
 
 // Fetch a challenge by code
 export const useChallengeByCode = (code: string | null) => {
   return useQuery({
     queryKey: ['challenge', code],
     queryFn: async (): Promise<Challenge | null> => {
       if (!code) return null;
       
       const { data, error } = await supabase
         .from('quiz_challenges')
         .select('*')
         .eq('challenge_code', code.toUpperCase())
         .eq('is_active', true)
         .maybeSingle();
 
       if (error) throw error;
       if (!data) return null;
 
       return {
         id: data.id,
         creatorId: data.creator_id,
         challengeCode: data.challenge_code,
         title: data.title,
         quizData: data.quiz_data as unknown as CustomQuiz,
         quizType: data.quiz_type,
         sourceQuizId: data.source_quiz_id || undefined,
         isActive: data.is_active,
         maxAttempts: data.max_attempts || 1,
         createdAt: data.created_at,
         expiresAt: data.expires_at || undefined,
       };
     },
     enabled: !!code,
   });
 };
 
 // Fetch leaderboard for a challenge
 export const useChallengeLeaderboard = (challengeId: string | null) => {
   return useQuery({
     queryKey: ['challenge-leaderboard', challengeId],
     queryFn: async (): Promise<ChallengeAttempt[]> => {
       if (!challengeId) return [];
       
       const { data, error } = await supabase
         .from('challenge_attempts')
         .select('*')
         .eq('challenge_id', challengeId)
         .eq('is_best_attempt', true)
         .order('score', { ascending: false })
         .order('time_taken_seconds', { ascending: true });
 
       if (error) throw error;
 
       return (data || []).map(row => ({
         id: row.id,
         challengeId: row.challenge_id,
         userId: row.user_id,
         userName: row.user_name,
         score: row.score,
         maxScore: row.max_score,
         accuracy: Number(row.accuracy),
         timeTakenSeconds: row.time_taken_seconds,
         answers: row.answers as Record<string, string> | undefined,
         isBestAttempt: row.is_best_attempt,
         completedAt: row.completed_at,
         createdAt: row.created_at,
       }));
     },
     enabled: !!challengeId,
     refetchInterval: 5000, // Auto-refresh every 5 seconds
   });
 };
 
 // Fetch user's challenges (created and joined)
 export const useUserChallenges = () => {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['user-challenges', user?.id],
     queryFn: async () => {
       if (!user) return { created: [], joined: [] };
       
       // Get created challenges
       const { data: createdData, error: createdError } = await supabase
         .from('quiz_challenges')
         .select('*')
         .eq('creator_id', user.id)
         .order('created_at', { ascending: false });
 
       if (createdError) throw createdError;
 
       // Get joined challenges (where user has attempts)
       const { data: attemptsData, error: attemptsError } = await supabase
         .from('challenge_attempts')
         .select('*, quiz_challenges!inner(*)')
         .eq('user_id', user.id)
         .neq('quiz_challenges.creator_id', user.id)
         .order('completed_at', { ascending: false });
 
       if (attemptsError) throw attemptsError;
 
       const created: Challenge[] = (createdData || []).map(row => ({
         id: row.id,
         creatorId: row.creator_id,
         challengeCode: row.challenge_code,
         title: row.title,
         quizData: row.quiz_data as unknown as CustomQuiz,
         quizType: row.quiz_type,
         sourceQuizId: row.source_quiz_id || undefined,
         isActive: row.is_active,
         maxAttempts: row.max_attempts || 1,
         createdAt: row.created_at,
         expiresAt: row.expires_at || undefined,
       }));
 
       // Deduplicate joined challenges
       const joinedMap = new Map<string, Challenge>();
       (attemptsData || []).forEach((row: any) => {
         const challenge = row.quiz_challenges;
         if (!joinedMap.has(challenge.id)) {
           joinedMap.set(challenge.id, {
             id: challenge.id,
             creatorId: challenge.creator_id,
             challengeCode: challenge.challenge_code,
             title: challenge.title,
             quizData: challenge.quiz_data as unknown as CustomQuiz,
             quizType: challenge.quiz_type,
             sourceQuizId: challenge.source_quiz_id || undefined,
             isActive: challenge.is_active,
             maxAttempts: challenge.max_attempts || 1,
             createdAt: challenge.created_at,
             expiresAt: challenge.expires_at || undefined,
           });
         }
       });
 
       return { created, joined: Array.from(joinedMap.values()) };
     },
     enabled: !!user,
   });
 };
 
// Create a new challenge with validated and frozen quiz snapshot
export const useCreateChallenge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quiz, title, sourceQuizId }: { quiz: CustomQuiz; title?: string; sourceQuizId?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate quiz before creating challenge
      const validation = validateQuizForChallenge(quiz);
      if (!validation.isValid) {
        throw new Error(`Quiz validation failed: ${validation.errors.join(', ')}`);
      }

      // Create an immutable snapshot of the quiz
      const frozenQuiz = createQuizSnapshot(quiz);

      const challengeCode = generateChallengeCode();
      
      const { data, error } = await supabase
        .from('quiz_challenges')
        .insert({
          creator_id: user.id,
          challenge_code: challengeCode,
          title: title || frozenQuiz.quizTitle,
          quiz_data: frozenQuiz as any,
          quiz_type: 'custom',
          source_quiz_id: sourceQuizId,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, challenge_code: challengeCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      toast.success("Challenge created!");
    },
    onError: (error: Error) => {
      console.error('Failed to create challenge:', error);
      if (error.message.includes('Quiz validation failed')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create challenge");
      }
    },
  });
};

// Submit a challenge attempt with proper creator handling
export const useSubmitChallengeAttemptWithCreator = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      userName,
      score,
      maxScore,
      timeTakenSeconds,
      answers,
      isCreator = false,
    }: {
      challengeId: string;
      userName: string;
      score: number;
      maxScore: number;
      timeTakenSeconds: number;
      answers: Record<string, string>;
      isCreator?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Check if user already has a best attempt
      const { data: existingAttempts } = await supabase
        .from('challenge_attempts')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .eq('is_best_attempt', true);

      const existingBest = existingAttempts?.[0];
      
      // Determine if this is the new best attempt
      let isBestAttempt = true;
      if (existingBest) {
        const existingScore = existingBest.score;
        const existingTime = existingBest.time_taken_seconds;
        
        // New attempt is better if: higher score, or same score with less time
        if (score < existingScore || (score === existingScore && timeTakenSeconds >= existingTime)) {
          isBestAttempt = false;
        } else {
          // Mark old best as not best
          await supabase
            .from('challenge_attempts')
            .update({ is_best_attempt: false })
            .eq('id', existingBest.id);
        }
      }

      const { data, error } = await supabase
        .from('challenge_attempts')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          user_name: userName,
          score,
          max_score: maxScore,
          accuracy,
          time_taken_seconds: timeTakenSeconds,
          answers: answers as any,
          is_best_attempt: isBestAttempt,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['challenge-leaderboard', variables.challengeId] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
    },
    onError: (error) => {
      console.error('Failed to submit attempt:', error);
      toast.error("Failed to submit your score");
    },
  });
};
 
 // Submit a challenge attempt
 export const useSubmitChallengeAttempt = () => {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({
       challengeId,
       userName,
       score,
       maxScore,
       timeTakenSeconds,
       answers,
     }: {
       challengeId: string;
       userName: string;
       score: number;
       maxScore: number;
       timeTakenSeconds: number;
       answers: Record<string, string>;
     }) => {
       if (!user) throw new Error("Not authenticated");
 
       const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;
 
       // Check if user already has a best attempt
       const { data: existingAttempts } = await supabase
         .from('challenge_attempts')
         .select('*')
         .eq('challenge_id', challengeId)
         .eq('user_id', user.id)
         .eq('is_best_attempt', true);
 
       const existingBest = existingAttempts?.[0];
       
       // Determine if this is the new best attempt
       let isBestAttempt = true;
       if (existingBest) {
         const existingScore = existingBest.score;
         const existingTime = existingBest.time_taken_seconds;
         
         // New attempt is better if: higher score, or same score with less time
         if (score < existingScore || (score === existingScore && timeTakenSeconds >= existingTime)) {
           isBestAttempt = false;
         } else {
           // Mark old best as not best
           await supabase
             .from('challenge_attempts')
             .update({ is_best_attempt: false })
             .eq('id', existingBest.id);
         }
       }
 
       const { data, error } = await supabase
         .from('challenge_attempts')
         .insert({
           challenge_id: challengeId,
           user_id: user.id,
           user_name: userName,
           score,
           max_score: maxScore,
           accuracy,
           time_taken_seconds: timeTakenSeconds,
           answers: answers as any,
           is_best_attempt: isBestAttempt,
         })
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['challenge-leaderboard', variables.challengeId] });
       queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
     },
     onError: (error) => {
       console.error('Failed to submit attempt:', error);
       toast.error("Failed to submit your score");
     },
   });
 };
 
// Permanently delete a challenge and all its attempts
export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      // First delete all challenge attempts (leaderboard data)
      const { error: attemptsError } = await supabase
        .from('challenge_attempts')
        .delete()
        .eq('challenge_id', challengeId);

      if (attemptsError) throw attemptsError;

      // Then delete the challenge itself
      const { error: challengeError } = await supabase
        .from('quiz_challenges')
        .delete()
        .eq('id', challengeId);

      if (challengeError) throw challengeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-leaderboard'] });
      toast.success("Challenge deleted permanently");
    },
    onError: (error) => {
      console.error('Failed to delete challenge:', error);
      toast.error("Failed to delete challenge");
    },
  });
};

// Legacy deactivate function (kept for backwards compatibility but uses delete)
export const useDeactivateChallenge = () => {
  return useDeleteChallenge();
};