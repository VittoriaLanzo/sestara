import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const WOLFRAM_APP_ID = Deno.env.get("WOLFRAM_APP_ID");
    if (!WOLFRAM_APP_ID) {
      return new Response(
        JSON.stringify({ error: "WOLFRAM_APP_ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL("https://api.wolframalpha.com/v1/llm-api");
    url.searchParams.set("appid", WOLFRAM_APP_ID);
    url.searchParams.set("input", query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Wolfram API error:", resp.status, body);
      return new Response(
        JSON.stringify({ error: "Wolfram API error", status: resp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await resp.text();

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("wolfram-verify error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
