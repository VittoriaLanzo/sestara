import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalType, goalDetails, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating roadmap for:", { goalType, goalDetails, title });

    const systemPrompt = `You are an expert educational curriculum designer and study planner. 
Your task is to create a comprehensive, well-structured study roadmap based on the user's learning goal.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.

The roadmap should include:
1. A list of subjects (main topics/chapters) with clear titles and descriptions
2. For each subject, a list of topics (sub-topics) with:
   - Clear, specific titles
   - Brief descriptions
   - Estimated study hours (realistic estimates)
   - Logical ordering for progressive learning

Consider:
- Prerequisites and dependencies between topics
- Progressive difficulty curve
- Real-world exam patterns and syllabus coverage
- Best practices for spaced learning

Return a JSON object with this exact structure:
{
  "subjects": [
    {
      "title": "Subject Name",
      "description": "Brief description of this subject",
      "order_index": 0,
      "topics": [
        {
          "title": "Topic Name",
          "description": "What this topic covers",
          "estimated_hours": 2.5,
          "order_index": 0
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create a study roadmap for:
Goal Type: ${goalType}
Title: ${title}
Details: ${JSON.stringify(goalDetails)}

Generate a comprehensive but focused roadmap with 4-8 subjects and 3-6 topics per subject.
Make it practical and achievable.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content);

    // Clean the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let roadmapData;
    try {
      roadmapData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse roadmap data from AI");
    }

    console.log("Parsed roadmap data:", roadmapData);

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in generate-roadmap:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate roadmap";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
