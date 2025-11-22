import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExplainRequest {
  code_snippet: string;
  selected_code: string;
  language: string;
  snippet_id?: string;
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { code_snippet, selected_code, language, snippet_id }: ExplainRequest =
      await req.json();

    console.log("Explaining code:", { language, selected_length: selected_code.length });

    // Get Claude API key
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Construct prompt for Claude
    const systemPrompt = `You are Metis Clew, an AI code explanation assistant that helps developers understand code through adaptive learning.

When explaining code:
1. Be concise and clear (aim for 2-3 sentences per section)
2. Assume the user has basic programming knowledge but may be learning this specific pattern
3. Structure your response as JSON with these sections:
   - whatItDoes: Plain English explanation
   - whyItMatters: Practical significance and use cases
   - keyConcepts: Array of 2-4 key concepts/patterns used
   - relatedPatterns: Array of related programming patterns to explore

Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const userPrompt = `Full code context:
\`\`\`${language}
${code_snippet}
\`\`\`

The user has selected this portion:
\`\`\`${language}
${selected_code}
\`\`\`

Explain the selected code in context. Return JSON only.`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse: ClaudeResponse = await response.json();
    const explanationText = claudeResponse.content[0].text;

    // Parse JSON response
    let explanation;
    try {
      explanation = JSON.parse(explanationText);
    } catch (e) {
      console.error("Failed to parse Claude response:", explanationText);
      throw new Error("Invalid response from AI");
    }

    // Store explanation in database if snippet_id provided
    if (snippet_id) {
      const { error: insertError } = await supabaseClient
        .from("explanations")
        .insert({
          snippet_id,
          user_id: user.id,
          selected_code,
          explanation,
        });

      if (insertError) {
        console.error("Error storing explanation:", insertError);
      }

      // Update or create learning pattern
      const patternTypes = explanation.keyConcepts || [];
      for (const patternType of patternTypes) {
        const { data: existing } = await supabaseClient
          .from("learning_patterns")
          .select("*")
          .eq("user_id", user.id)
          .eq("pattern_type", patternType)
          .single();

        if (existing) {
          await supabaseClient
            .from("learning_patterns")
            .update({
              frequency: existing.frequency + 1,
              last_seen: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabaseClient.from("learning_patterns").insert({
            user_id: user.id,
            pattern_type: patternType,
            frequency: 1,
            insights: {
              summary: `Learning about ${patternType}`,
            },
          });
        }
      }
    }

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-code function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
