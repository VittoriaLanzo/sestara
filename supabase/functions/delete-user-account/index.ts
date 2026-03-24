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

    // Validate confirmation from request body
    const body = await req.json();
    if (body.confirmation !== "DELETE MY ACCOUNT") {
      return new Response(JSON.stringify({ error: "Confirmation text does not match" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Account deletion requested for user:", userId);

    // Get roadmap IDs to cascade-delete dependent data
    const { data: roadmaps } = await supabaseAdmin.from("roadmaps").select("id").eq("user_id", userId);
    const roadmapIds = (roadmaps || []).map((r: any) => r.id);

    let subjectIds: string[] = [];
    let topicIds: string[] = [];

    if (roadmapIds.length > 0) {
      const { data: subjects } = await supabaseAdmin.from("subjects").select("id").in("roadmap_id", roadmapIds);
      subjectIds = (subjects || []).map((s: any) => s.id);

      if (subjectIds.length > 0) {
        const { data: topics } = await supabaseAdmin.from("topics").select("id").in("subject_id", subjectIds);
        topicIds = (topics || []).map((t: any) => t.id);
      }
    }

    // Delete in dependency order (deepest first)
    // 1. Topic-level data
    if (topicIds.length > 0) {
      // Note drawings (depends on note_pages)
      const { data: pages } = await supabaseAdmin.from("note_pages").select("id").eq("user_id", userId).in("topic_id", topicIds);
      const pageIds = (pages || []).map((p: any) => p.id);
      if (pageIds.length > 0) {
        await supabaseAdmin.from("note_drawings").delete().in("page_id", pageIds);
      }

      // Note attachments (depends on topic_notes)
      const { data: notes } = await supabaseAdmin.from("topic_notes").select("id").eq("user_id", userId).in("topic_id", topicIds);
      const noteIds = (notes || []).map((n: any) => n.id);
      if (noteIds.length > 0) {
        await supabaseAdmin.from("note_attachments").delete().in("note_id", noteIds);
      }

      // Quiz doubt reports (depends on quiz_attempts)
      const { data: attempts } = await supabaseAdmin.from("quiz_attempts").select("id").eq("user_id", userId).in("topic_id", topicIds);
      const attemptIds = (attempts || []).map((a: any) => a.id);
      if (attemptIds.length > 0) {
        await supabaseAdmin.from("quiz_doubt_reports").delete().in("quiz_attempt_id", attemptIds);
      }

      await Promise.all([
        supabaseAdmin.from("note_pages").delete().eq("user_id", userId).in("topic_id", topicIds),
        supabaseAdmin.from("topic_notes").delete().eq("user_id", userId).in("topic_id", topicIds),
        supabaseAdmin.from("quiz_attempts").delete().eq("user_id", userId).in("topic_id", topicIds),
        supabaseAdmin.from("flashcard_sets").delete().eq("user_id", userId).in("topic_id", topicIds),
        supabaseAdmin.from("content_sources").delete().eq("user_id", userId).in("topic_id", topicIds),
      ]);
    }

    // 2. Delete topics, subjects
    if (subjectIds.length > 0) {
      await supabaseAdmin.from("topics").delete().in("subject_id", subjectIds);
    }
    if (roadmapIds.length > 0) {
      await supabaseAdmin.from("subjects").delete().in("roadmap_id", roadmapIds);
      await supabaseAdmin.from("roadmap_versions").delete().in("roadmap_id", roadmapIds);
      await supabaseAdmin.from("resource_groups").delete().eq("user_id", userId).in("roadmap_id", roadmapIds);
      await supabaseAdmin.from("roadmap_resources").delete().eq("user_id", userId).in("roadmap_id", roadmapIds);
    }

    // 3. Delete user-level data (no FK dependencies on roadmaps)
    // Challenge attempts first (depends on quiz_challenges)
    const { data: challenges } = await supabaseAdmin.from("quiz_challenges").select("id").eq("creator_id", userId);
    const challengeIds = (challenges || []).map((c: any) => c.id);
    if (challengeIds.length > 0) {
      await supabaseAdmin.from("challenge_attempts").delete().in("challenge_id", challengeIds);
    }
    // Also delete user's own attempts on other challenges
    await supabaseAdmin.from("challenge_attempts").delete().eq("user_id", userId);

    await Promise.all([
      supabaseAdmin.from("roadmaps").delete().eq("user_id", userId),
      supabaseAdmin.from("reminders").delete().eq("user_id", userId),
      supabaseAdmin.from("todos").delete().eq("user_id", userId),
      supabaseAdmin.from("study_activities").delete().eq("user_id", userId),
      supabaseAdmin.from("user_streaks").delete().eq("user_id", userId),
      supabaseAdmin.from("custom_quizzes").delete().eq("user_id", userId),
      supabaseAdmin.from("quiz_groups").delete().eq("user_id", userId),
      supabaseAdmin.from("quiz_challenges").delete().eq("creator_id", userId),
      supabaseAdmin.from("video_chat_messages").delete().eq("user_id", userId),
      supabaseAdmin.from("video_chat_artifacts").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("user_id", userId),
    ]);

    // 4. Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError.message);
      throw new Error("Failed to delete account. Please try again.");
    }

    console.log("Account deleted successfully for user:", userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("delete-user-account error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
