// supabase/functions/explain-code/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ----------------------------
// CORS HEADERS
// ----------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ----------------------------
// ENVIRONMENT VARIABLES (Supabase CLI v2)
// ----------------------------
const SUPA_URL = Deno.env.get("SUPA_URL");
const SUPA_ANON_KEY = Deno.env.get("SUPA_ANON_KEY");
const METIS_CLEW = Deno.env.get("METIS_CLEW");

if (!SUPA_URL || !SUPA_ANON_KEY) {
  console.error("❌ Missing SUPA_URL or SUPA_ANON_KEY");
  throw new Error("Supabase env vars not set.");
}

if (!METIS_CLEW) {
  console.error("❌ Missing METIS_CLEW");
  throw new Error("METIS_CLEW not set (Claude API key).");
}

// ----------------------------
// AI MODEL CONFIG
// ----------------------------
const CLAUDE_MODEL = "claude-3-haiku-20240307"; // stable + cheap

// ----------------------------
// SUPABASE CLIENT FACTORY
// ----------------------------
function getClient(req: Request) {
  return createClient(SUPA_URL!, SUPA_ANON_KEY!, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });
}

// ----------------------------
// SERVER ENTRYPOINT
// ----------------------------
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -----------------------------------------------------
    // 1. Parse request
    // -----------------------------------------------------
    const body = await req.json();
    const { snippet_id, code_snippet, selected_code, language } = body;

    if (!selected_code || !code_snippet || !language) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: selected_code, code_snippet, language",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------
    // 2. Authenticate user via RLS
    // -----------------------------------------------------
    const supabase = getClient(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------------------------------
    // 3. Build Claude prompt
    // -----------------------------------------------------
    const prompt = `
Explain the selected code using simple, accurate language.
Output valid JSON with this structure:

{
  "whatItDoes": "...",
  "whyItMatters": "...",
  "keyConcepts": ["...", "..."],
  "relatedPatterns": ["...", "..."]
}

Full code:

${code_snippet}

Selected code:

${selected_code}
`;

    // -----------------------------------------------------
    // 4. Call Claude Messages API
    // -----------------------------------------------------
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": METIS_CLEW!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errTxt = await aiResponse.text();
      console.error("Claude error:", errTxt);
      throw new Error(`Claude API error: ${aiResponse.status}`);
    }

    const aiJson = await aiResponse.json();
    const explanationText = aiJson?.content?.[0]?.text;

    let explanation;
    try {
      explanation = JSON.parse(explanationText);
    } catch {
      console.error("Invalid Claude JSON:", explanationText);
      explanation = { error: "Invalid response from AI" };
    }

    // -----------------------------------------------------
    // 5. Save explanation into DB (optional but expected)
    // -----------------------------------------------------
    let explanationId = null;

    if (snippet_id) {
      const { data, error } = await supabase
        .from("explanations")
        .insert({
          snippet_id,
          user_id: user.id,
          selected_code,
          explanation,
        })
        .select("id")
        .single();

      if (!error) {
        explanationId = data.id;
      }
    }

    // -----------------------------------------------------
    // 6. Return result
    // -----------------------------------------------------
    return new Response(JSON.stringify({ explanation, explanationId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Function crashed:", err);

    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
