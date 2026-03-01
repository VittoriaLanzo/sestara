import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  roadmapId: z.string().uuid().optional().nullable(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Backend auth is not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session. Please sign in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return new Response(JSON.stringify({ 
        error: "Invalid request parameters", 
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, roadmapId } = parseResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Study assistant request:", { userId, roadmapId, messageCount: messages.length });

    // Fetch user profile for language preference
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("study_language, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    const studyLanguage = profile?.study_language || 'en';
    const displayName = profile?.display_name || 'Student';

    // Fetch user context
    let contextInfo = "";
    if (displayName) {
      contextInfo += `Student Name: ${displayName}\n`;
    }
    if (studyLanguage !== 'en') {
      contextInfo += `Preferred Language: ${studyLanguage} (respond in this language when explaining concepts)\n`;
    }

    // Get user's roadmaps and progress
    const { data: roadmaps } = await supabaseAdmin
      .from("roadmaps")
      .select("id, title, goal_type, target_date")
      .eq("user_id", userId);

    if (roadmaps && roadmaps.length > 0) {
      contextInfo += `\n\nUser's Learning Roadmaps:\n`;
      
      for (const roadmap of roadmaps) {
        const { data: subjects } = await supabaseAdmin
          .from("subjects")
          .select("id, title")
          .eq("roadmap_id", roadmap.id);

        if (subjects && subjects.length > 0) {
          const subjectIds = subjects.map(s => s.id);
          const { data: topics } = await supabaseAdmin
            .from("topics")
            .select("id, title, status, progress")
            .in("subject_id", subjectIds);

          const totalTopics = topics?.length || 0;
          const completedTopics = topics?.filter(t => t.status === "completed").length || 0;
          const inProgressTopics = topics?.filter(t => t.status === "in-progress") || [];
          const notStartedTopics = topics?.filter(t => t.status === "not-started") || [];
          const skippedTopics = topics?.filter(t => t.status === "skipped") || [];
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          const isCurrentRoadmap = roadmapId === roadmap.id;
          contextInfo += `\n${isCurrentRoadmap ? "[CURRENT] " : ""}Roadmap: "${roadmap.title}" (${roadmap.goal_type})`;
          contextInfo += `\n  - Progress: ${progress}% (${completedTopics}/${totalTopics} topics completed)`;
          
          if (roadmap.target_date) {
            const daysLeft = Math.ceil((new Date(roadmap.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const topicsPerDay = daysLeft > 0 ? ((totalTopics - completedTopics) / daysLeft).toFixed(1) : "N/A";
            contextInfo += `\n  - Target date: ${roadmap.target_date} (${daysLeft > 0 ? daysLeft + " days left" : "OVERDUE!"})`;
            contextInfo += `\n  - Required pace: ${topicsPerDay} topics/day to finish on time`;
          }

          if (skippedTopics.length > 0) {
            contextInfo += `\n  - ⚠️ Skipped topics needing attention: ${skippedTopics.map(t => t.title).join(", ")}`;
          }

          if (isCurrentRoadmap) {
            if (inProgressTopics.length > 0) {
              contextInfo += `\n  - Currently working on: ${inProgressTopics.map(t => t.title).join(", ")}`;
            }
            if (notStartedTopics.length > 0) {
              contextInfo += `\n  - Next topics to study: ${notStartedTopics.slice(0, 3).map(t => t.title).join(", ")}`;
            }
            contextInfo += `\n  - Subjects: ${subjects.map(s => s.title).join(", ")}`;
          }
        }
      }
    }

    // Get upcoming reminders and deadlines
    const { data: reminders } = await supabaseAdmin
      .from("reminders")
      .select("title, reminder_type, due_date, is_completed")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .order("due_date", { ascending: true })
      .limit(10);

    if (reminders && reminders.length > 0) {
      contextInfo += `\n\n📅 Upcoming Deadlines & Reminders:\n`;
      for (const reminder of reminders) {
        const daysUntil = Math.ceil((new Date(reminder.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const urgency = daysUntil <= 0 ? "🔴 OVERDUE" : daysUntil <= 3 ? "🟡 URGENT" : "🟢";
        contextInfo += `\n${urgency} ${reminder.reminder_type.toUpperCase()}: "${reminder.title}" - ${reminder.due_date} (${daysUntil > 0 ? daysUntil + " days" : "overdue"})`;
      }
    }

    // Get quiz performance for personalization
    const { data: quizAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("topic_id, score, max_score, quiz_type, completed_at")
      .eq("user_id", userId)
      .not("score", "is", null)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (quizAttempts && quizAttempts.length > 0) {
      const totalScore = quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0);
      const totalMax = quizAttempts.reduce((sum, q) => sum + (q.max_score || 0), 0);
      const avgAccuracy = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      
      contextInfo += `\n\n📊 Quiz Performance:\n`;
      contextInfo += `- Average accuracy: ${avgAccuracy}%`;
      contextInfo += `- Total quizzes taken: ${quizAttempts.length}`;
      
      // Find weak topics (score < 70%)
      const weakTopicIds = new Set<string>();
      quizAttempts.forEach(q => {
        if (q.max_score && q.score && (q.score / q.max_score) < 0.7) {
          weakTopicIds.add(q.topic_id);
        }
      });

      if (weakTopicIds.size > 0) {
        const { data: weakTopics } = await supabaseAdmin
          .from("topics")
          .select("title")
          .in("id", Array.from(weakTopicIds));
        
        if (weakTopics && weakTopics.length > 0) {
          contextInfo += `\n- ⚠️ Topics needing more practice: ${weakTopics.map(t => t.title).join(", ")}`;
        }
      }
    }

    // Get user's recent notes if on a specific roadmap
    if (roadmapId) {
      const { data: subjects } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("roadmap_id", roadmapId);

      if (subjects && subjects.length > 0) {
        const subjectIds = subjects.map(s => s.id);
        const { data: topics } = await supabaseAdmin
          .from("topics")
          .select("id, title")
          .in("subject_id", subjectIds);

        if (topics && topics.length > 0) {
          const topicIds = topics.map(t => t.id);
          const { data: notes } = await supabaseAdmin
            .from("topic_notes")
            .select("content, topic_id")
            .eq("user_id", userId)
            .in("topic_id", topicIds)
            .order("updated_at", { ascending: false })
            .limit(5);

          if (notes && notes.length > 0) {
            contextInfo += `\n\nRecent User Notes:\n`;
            for (const note of notes) {
              const topic = topics.find(t => t.id === note.topic_id);
              if (note.content && note.content.trim()) {
                contextInfo += `\n[${topic?.title}]: ${note.content.slice(0, 200)}${note.content.length > 200 ? "..." : ""}`;
              }
            }
          }
        }
      }
    }

    // --- Wolfram Alpha silent integration ---
    // Step 1: Ask Gemini if this message needs precise computation
    let wolframContext = "";
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    try {
      const triageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a triage classifier. Given a user message, decide if it would benefit from a precise mathematical computation, unit conversion, scientific constant lookup, or factual data query from Wolfram Alpha. Respond ONLY with valid JSON: {"needs_wolfram": true, "query": "the wolfram query"} or {"needs_wolfram": false}. No other text.`,
            },
            { role: "user", content: lastUserMessage },
          ],
          stream: false,
        }),
      });

      if (triageResponse.ok) {
        const triageData = await triageResponse.json();
        const triageContent = triageData.choices?.[0]?.message?.content || "";
        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = triageContent.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const triage = JSON.parse(jsonMatch[0]);
          if (triage.needs_wolfram && triage.query) {
            // Step 2: Call wolfram-verify edge function
            try {
              const wolframUrl = `${SUPABASE_URL}/functions/v1/wolfram-verify`;
              const wController = new AbortController();
              const wTimeout = setTimeout(() => wController.abort(), 10000);

              const wolframResp = await fetch(wolframUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({ query: triage.query }),
                signal: wController.signal,
              });
              clearTimeout(wTimeout);

              if (wolframResp.ok) {
                const wolframData = await wolframResp.json();
                if (wolframData.result) {
                  wolframContext = `\n\nWolfram Alpha computed: ${wolframData.result}. Use this as the ground truth for any calculations in your response.`;
                  console.log("Wolfram result injected for query:", triage.query);
                }
              }
            } catch (wErr) {
              // Silent fallback - proceed without Wolfram
              console.log("Wolfram call failed silently:", wErr);
            }
          }
        }
      }
    } catch (triageErr) {
      // Silent fallback - proceed without triage
      console.log("Triage call failed silently:", triageErr);
    }

    const systemPrompt = `You are an intelligent, friendly AI study assistant designed to help students learn effectively. Your name is StudyBuddy.

Your key capabilities:
1. **Explain concepts** - Break down complex topics into simple, digestible explanations
2. **Study planning** - Help create daily/weekly study schedules based on goals and deadlines
3. **Suggest next steps** - Recommend what to study next based on progress and deadlines
4. **Generate revision plans** - Create spaced repetition and review schedules
5. **Answer questions** - Clarify doubts using the student's own notes and context
6. **Motivation** - Provide encouragement and study tips
7. **Pace adjustment** - If the user is falling behind, suggest realistic catch-up plans

Context about the student:
${contextInfo || "No roadmaps created yet. Encourage the user to create their first learning roadmap!"}
${wolframContext}

Personalization Guidelines:
- If quiz scores are low on certain topics, recommend revisiting those with simpler explanations
- If there are upcoming exams/deadlines, prioritize those topics in your suggestions
- If user is behind schedule, suggest an adjusted study pace without overwhelming them
- If there are skipped topics, gently remind them about the importance of covering fundamentals
- Suggest revision sessions for topics completed more than a week ago
- Celebrate achievements (completed topics, high quiz scores, streaks)

General Guidelines:
- Be encouraging and supportive, but also honest about study requirements
- Give specific, actionable advice based on their actual progress
- When suggesting study plans, consider their target dates and current pace
- Reference their notes and current topics when answering questions
- Keep responses concise but helpful (aim for 2-4 paragraphs max unless they ask for detail)
- Use emojis sparingly to keep things friendly
- If they're behind schedule, be motivating but realistic about what's achievable
- Always end with a helpful next step or question
- Never mention or attribute any information to Wolfram Alpha or any external computation source`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error("Failed to get AI response");
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error: unknown) {
    console.error("Study assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
