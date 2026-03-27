import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, userId } = await req.json();

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    if (!GROK_API_KEY) throw new Error("GROK_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch top 10 schools only to stay within token limits
    const { data: schools } = await supabase
      .from("schools")
      .select("*, programs(*)")
      .order("satisfaction_score", { ascending: false })
      .limit(10);

    if (!schools || schools.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Tu es un système de recommandation d'écoles marocaines.
Analyse les préférences de l'étudiant et les écoles disponibles, puis retourne les 5 meilleures écoles.

Préférences de l'étudiant:
${JSON.stringify(answers, null, 2)}

Écoles disponibles:
${JSON.stringify(schools.map(s => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  city: s.city,
  satisfaction_score: s.satisfaction_score,
  programs: s.programs?.slice(0, 3).map((p: any) => ({ domain: p.domain, level: p.level, language: p.language }))
})), null, 2)}

Réponds UNIQUEMENT en JSON valide sans texte avant ou après, dans ce format exact:
{
  "recommendations": [
    {
      "school_id": "id de l'école",
      "name": "Nom de l'école",
      "slug": "slug",
      "city": "Ville",
      "satisfaction_score": 4.5,
      "match_score": 92,
      "reasons": ["Raison 1", "Raison 2", "Raison 3"]
    }
  ]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Tu es un système de recommandation d'écoles. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const groqData = await response.json();
    console.log("Groq raw response:", JSON.stringify(groqData));

    const text = groqData.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Grok returned empty: " + JSON.stringify(groqData));

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const recommendations = parsed.recommendations || [];

    // Save recommendations if user is logged in
    if (userId && recommendations.length > 0) {
      for (const rec of recommendations) {
        if (rec.school_id) {
          try {
            await supabase.from("ai_recommendations").insert({
              user_id: userId,
              school_id: rec.school_id,
              match_score: rec.match_score,
              reasons: rec.reasons,
              questionnaire_answers: answers,
            });
          } catch { /* Ignore duplicates */ }
        }
      }
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});