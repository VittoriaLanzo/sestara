import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface StudyTimeData {
  totalMinutesToday: number;
  totalMinutesThisWeek: number;
  loading: boolean;
}

const IDLE_THRESHOLD_MS = 60000; // 1 minute of inactivity = idle
const SAVE_INTERVAL_MS = 30000; // Save every 30 seconds

export const useStudyTime = () => {
  const { user } = useAuth();
  const [studyTimeData, setStudyTimeData] = useState<StudyTimeData>({
    totalMinutesToday: 0,
    totalMinutesThisWeek: 0,
    loading: true,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const activeTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(true);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStudyTime = useCallback(async () => {
    if (!user) {
      setStudyTimeData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get today's study time
      const { data: todayData } = await supabase
        .from("study_activities")
        .select("activity_type")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .eq("activity_type", "time_tracked");

      // Get this week's study time
      const { data: weekData } = await supabase
        .from("study_activities")
        .select("activity_type")
        .eq("user_id", user.id)
        .gte("activity_date", weekAgo)
        .eq("activity_type", "time_tracked");

      // Each time_tracked activity represents ~30 seconds of active time
      const todayMinutes = Math.round((todayData?.length || 0) * 0.5);
      const weekMinutes = Math.round((weekData?.length || 0) * 0.5);

      setStudyTimeData({
        totalMinutesToday: todayMinutes,
        totalMinutesThisWeek: weekMinutes,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching study time:", error);
      setStudyTimeData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const saveActiveTime = useCallback(async () => {
    if (!user || !isActiveRef.current) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Record a time tracking activity
      await supabase.from("study_activities").insert({
        user_id: user.id,
        activity_type: "time_tracked",
        activity_date: today,
      });

      // Update local state
      setStudyTimeData(prev => ({
        ...prev,
        totalMinutesToday: prev.totalMinutesToday + 0.5,
        totalMinutesThisWeek: prev.totalMinutesThisWeek + 0.5,
      }));
    } catch (error) {
      console.error("Error saving study time:", error);
    }
  }, [user]);

  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // If user was idle and is now active again
    if (timeSinceLastActivity > IDLE_THRESHOLD_MS) {
      isActiveRef.current = true;
    }

    lastActivityRef.current = now;
    isActiveRef.current = true;
  }, []);

  const checkIdleStatus = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > IDLE_THRESHOLD_MS) {
      isActiveRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStudyTime();
  }, [fetchStudyTime]);

  useEffect(() => {
    if (!user) return;

    // Track user activity events
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check idle status and save time periodically
    const idleCheckInterval = setInterval(checkIdleStatus, 10000);
    saveIntervalRef.current = setInterval(saveActiveTime, SAVE_INTERVAL_MS);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(idleCheckInterval);
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [user, handleUserActivity, checkIdleStatus, saveActiveTime]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return {
    ...studyTimeData,
    formatTime,
    refreshStudyTime: fetchStudyTime,
  };
};
