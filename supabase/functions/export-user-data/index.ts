import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    console.log("Data export requested for user:", userId);

    // Fetch all user data in parallel
    const [
      profileRes,
      roadmapsRes,
      remindersRes,
      todosRes,
      streaksRes,
      activitiesRes,
      customQuizzesRes,
      quizGroupsRes,
      challengesRes,
      attemptsRes,
      resourceGroupsRes,
      roadmapResourcesRes,
      videoChatMessagesRes,
      videoChatArtifactsRes,
      flashcardSetsRes,
      contentSourcesRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("user_id", userId),
      supabaseAdmin.from("roadmaps").select("*").eq("user_id", userId),
      // subjects/topics fetched after roadmap IDs are known (see below)
      supabaseAdmin.from("reminders").select("*").eq("user_id", userId),
      supabaseAdmin.from("todos").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_streaks").select("*").eq("user_id", userId),
      supabaseAdmin.from("study_activities").select("*").eq("user_id", userId),
      supabaseAdmin.from("custom_quizzes").select("*").eq("user_id", userId),
      supabaseAdmin.from("quiz_groups").select("*").eq("user_id", userId),
      supabaseAdmin.from("quiz_challenges").select("*").eq("creator_id", userId),
      supabaseAdmin.from("challenge_attempts").select("*").eq("user_id", userId),
      supabaseAdmin.from("resource_groups").select("*").eq("user_id", userId),
      supabaseAdmin.from("roadmap_resources").select("*").eq("user_id", userId),
      supabaseAdmin.from("video_chat_messages").select("*").eq("user_id", userId),
      supabaseAdmin.from("video_chat_artifacts").select("*").eq("user_id", userId),
      supabaseAdmin.from("flashcard_sets").select("*").eq("user_id", userId),
      supabaseAdmin.from("content_sources").select("*").eq("user_id", userId),
    ]);

    // Fetch subjects & topics for user's roadmaps
    const roadmapIds = (roadmapsRes.data || []).map((r: any) => r.id);
    let subjects: any[] = [];
    let topics: any[] = [];
    let topicNotes: any[] = [];
    let quizAttempts: any[] = [];
    let notePages: any[] = [];
    let roadmapVersions: any[] = [];
    let doubtReports: any[] = [];

    if (roadmapIds.length > 0) {
      const [subjectsRes2, versionsRes] = await Promise.all([
        supabaseAdmin.from("subjects").select("*").in("roadmap_id", roadmapIds),
        supabaseAdmin.from("roadmap_versions").select("*").in("roadmap_id", roadmapIds),
      ]);
      subjects = subjectsRes2.data || [];
      roadmapVersions = versionsRes.data || [];

      const subjectIds = subjects.map((s: any) => s.id);
      if (subjectIds.length > 0) {
        const topicsRes = await supabaseAdmin.from("topics").select("*").in("subject_id", subjectIds);
        topics = topicsRes.data || [];

        const topicIds = topics.map((t: any) => t.id);
        if (topicIds.length > 0) {
          const [notesRes, quizRes, pagesRes] = await Promise.all([
            supabaseAdmin.from("topic_notes").select("*").eq("user_id", userId).in("topic_id", topicIds),
            supabaseAdmin.from("quiz_attempts").select("*").eq("user_id", userId).in("topic_id", topicIds),
            supabaseAdmin.from("note_pages").select("*").eq("user_id", userId).in("topic_id", topicIds),
          ]);
          topicNotes = notesRes.data || [];
          quizAttempts = quizRes.data || [];
          notePages = pagesRes.data || [];

          // Fetch doubt reports for quiz attempts
          const quizAttemptIds = quizAttempts.map((q: any) => q.id);
          if (quizAttemptIds.length > 0) {
            const doubtRes = await supabaseAdmin.from("quiz_doubt_reports").select("*").eq("user_id", userId).in("quiz_attempt_id", quizAttemptIds);
            doubtReports = doubtRes.data || [];
          }
        }
      }
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: userId,
        email: userEmail,
        created_at: userData.user.created_at,
      },
      profile: profileRes.data || [],
      roadmaps: roadmapsRes.data || [],
      subjects,
      topics,
      topic_notes: topicNotes,
      note_pages: notePages,
      roadmap_versions: roadmapVersions,
      quiz_attempts: quizAttempts,
      quiz_doubt_reports: doubtReports,
      custom_quizzes: customQuizzesRes.data || [],
      quiz_groups: quizGroupsRes.data || [],
      quiz_challenges: challengesRes.data || [],
      challenge_attempts: attemptsRes.data || [],
      flashcard_sets: flashcardSetsRes.data || [],
      reminders: remindersRes.data || [],
      todos: todosRes.data || [],
      study_activities: activitiesRes.data || [],
      user_streaks: streaksRes.data || [],
      resource_groups: resourceGroupsRes.data || [],
      roadmap_resources: roadmapResourcesRes.data || [],
      video_chat_messages: videoChatMessagesRes.data || [],
      video_chat_artifacts: videoChatArtifactsRes.data || [],
      content_sources: contentSourcesRes.data || [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sestara-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error("export-user-data error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
