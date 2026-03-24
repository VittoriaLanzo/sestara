import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const prompts: Record<string, string> = {
  notes:
    "Extract concise, well-structured study notes from the following message. Use markdown headings, bullet points, and highlight key terms in bold. Output only the notes, no preamble.",
  summary:
    "Summarise the following message in 3-5 concise bullet points. Be precise and informative. Output only the summary, no preamble.",
  action_items:
    "Extract actionable study tasks or follow-up items from the following message. Return as a numbered list. If there are no clear action items, suggest 2-3 based on the content. Output only the list, no preamble.",
  follow_up:
    "Based on the following message, generate 3-5 thoughtful follow-up questions a student could explore next. Output as a numbered list, no preamble.",
};

const titles: Record<string, string> = {
  notes: "Study Notes",
  summary: "Summary",
  action_items: "Action Items",
  follow_up: "Follow-Up Questions",
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { artifactType, messageContent, videoId, messageIndex } = body;

    if (!artifactType || !messageContent || !videoId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = prompts[artifactType];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid artifact type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || "";
    const title = `${titles[artifactType] || "Artifact"} — ${new Date().toLocaleDateString()}`;

    // Persist artifact
    const { data: artifact, error: insertError } = await supabaseAdmin
      .from("video_chat_artifacts")
      .insert({
        user_id: userData.user.id,
        video_id: videoId,
        message_index: messageIndex ?? 0,
        artifact_type: artifactType,
        title,
        content: generatedContent,
        source_message: messageContent.slice(0, 2000),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save artifact");
    }

    return new Response(JSON.stringify({ artifact }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-artifact error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
