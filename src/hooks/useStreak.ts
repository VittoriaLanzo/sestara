import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, subDays, parseISO, isToday, isYesterday } from "date-fns";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weekData: boolean[];
  loading: boolean;
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    weekData: [false, false, false, false, false, false, false],
    loading: true,
  });

  const fetchStreakData = useCallback(async () => {
    if (!user) {
      setStreakData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get user streak record
      const { data: streakRecord, error: streakError } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakError) throw streakError;

      // Get activities for the last 7 days
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);
      
      const { data: activities, error: activitiesError } = await supabase
        .from("study_activities")
        .select("activity_date")
        .eq("user_id", user.id)
        .gte("activity_date", format(sevenDaysAgo, "yyyy-MM-dd"))
        .lte("activity_date", format(today, "yyyy-MM-dd"));

      if (activitiesError) throw activitiesError;

      // Create a set of activity dates
      const activityDates = new Set(activities?.map(a => a.activity_date) || []);

      // Generate week data (Monday to Sunday based on current week)
      const weekData: boolean[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        weekData.push(activityDates.has(dateStr));
      }

      // Calculate current streak from activity dates directly
      // Sort all unique activity dates descending
      const sortedDates = Array.from(activityDates).sort().reverse();
      
      // Also fetch more history to compute streak properly
      const { data: allActivities } = await supabase
        .from("study_activities")
        .select("activity_date")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false });

      const allDatesSet = new Set(allActivities?.map(a => a.activity_date) || []);
      const todayStr = format(today, "yyyy-MM-dd");
      
      let currentStreak = 0;
      if (allDatesSet.has(todayStr)) {
        currentStreak = 1;
        let checkDate = subDays(today, 1);
        while (allDatesSet.has(format(checkDate, "yyyy-MM-dd"))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      }

      let longestStreak = Math.max(streakRecord?.longest_streak || 0, currentStreak);

      // Auto-create or update streak record to stay in sync
      if (streakRecord) {
        if (streakRecord.current_streak !== currentStreak || streakRecord.longest_streak !== longestStreak) {
          await supabase
            .from("user_streaks")
            .update({
              current_streak: currentStreak,
              longest_streak: longestStreak,
              last_activity_date: allDatesSet.has(todayStr) ? todayStr : streakRecord.last_activity_date,
            })
            .eq("user_id", user.id);
        }
      } else if (currentStreak > 0) {
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: todayStr,
        });
      }

      setStreakData({
        currentStreak,
        longestStreak,
        weekData,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching streak data:", error);
      setStreakData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const recordActivity = useCallback(async (
    activityType: string,
    topicId?: string,
    roadmapId?: string
  ) => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");

    try {
      // Check if we already have an activity for today
      const { data: existingActivity } = await supabase
        .from("study_activities")
        .select("id")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .limit(1);

      const isFirstActivityToday = !existingActivity || existingActivity.length === 0;

      // Insert the activity
      await supabase.from("study_activities").insert({
        user_id: user.id,
        activity_type: activityType,
        topic_id: topicId,
        roadmap_id: roadmapId,
        activity_date: today,
      });

      // Update streak if this is the first activity today
      if (isFirstActivityToday) {
        const { data: streakRecord } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        let newCurrentStreak = 1;
        let newLongestStreak = 1;

        if (streakRecord) {
          const lastActivityDate = streakRecord.last_activity_date 
            ? parseISO(streakRecord.last_activity_date)
            : null;

          if (lastActivityDate) {
            if (isYesterday(lastActivityDate)) {
              // Consecutive day - increment streak
              newCurrentStreak = streakRecord.current_streak + 1;
            } else if (isToday(lastActivityDate)) {
              // Already recorded today
              newCurrentStreak = streakRecord.current_streak;
            } else {
              // Streak broken - start fresh
              newCurrentStreak = 1;
            }
          }

          newLongestStreak = Math.max(streakRecord.longest_streak, newCurrentStreak);

          await supabase
            .from("user_streaks")
            .update({
              current_streak: newCurrentStreak,
              longest_streak: newLongestStreak,
              last_activity_date: today,
            })
            .eq("user_id", user.id);
        } else {
          // Create new streak record
          await supabase.from("user_streaks").insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
          });
        }

        // Refresh streak data
        fetchStreakData();
      }
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  }, [user, fetchStreakData]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return {
    ...streakData,
    recordActivity,
    refreshStreak: fetchStreakData,
  };
};