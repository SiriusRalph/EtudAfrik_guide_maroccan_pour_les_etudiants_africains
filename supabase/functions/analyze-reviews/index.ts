import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { schoolId } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch reviews for this school
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("school_id", schoolId);

    if (!reviews || reviews.length === 0) {
      return new Response(JSON.stringify({
        score: 0,
        summary: "Aucun avis disponible pour cette école.",
        details: {}
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for Gemini
    const reviewsText = reviews.map((r, i) =>
      `Avis ${i + 1}: Note ${r.rating}/5. ${r.comment || ""}` +
      (r.teaching_quality ? ` Enseignement: ${r.teaching_quality}/5.` : "") +
      (r.facilities_rating ? ` Infrastructures: ${r.facilities_rating}/5.` : "") +
      (r.student_life ? ` Vie étudiante: ${r.student_life}/5.` : "") +
      (r.internship_opportunities ? ` Stages: ${r.internship_opportunities}/5.` : "") +
      (r.value_for_money ? ` Rapport qualité-prix: ${r.value_for_money}/5.` : "")
    ).join("\n");

    const prompt = `Tu es un analyseur d'avis étudiants pour une plateforme marocaine d'orientation scolaire.
Analyse ces ${reviews.length} avis et réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Avis à analyser:
${reviewsText}

Réponds avec exactement ce format JSON:
{
  "overall_score": <nombre de 0 à 5>,
  "summary": "<résumé objectif de 2-3 phrases en français>",
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "weaknesses": ["<point faible 1>", "<point faible 2>"],
  "teaching_score": <moyenne enseignement ou null>,
  "facilities_score": <moyenne infrastructures ou null>,
  "student_life_score": <moyenne vie étudiante ou null>,
  "internship_score": <moyenne stages ou null>,
  "value_score": <moyenne rapport qualité-prix ou null>,
  "sentiment": "<very_positive|positive|neutral|negative|very_negative>"
}`;

    // Call Gemini API (free tier)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      // Fallback: calculate manually
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return new Response(JSON.stringify({
        score: Math.round(avgRating * 10) / 10,
        summary: `Basé sur ${reviews.length} avis, cette école a une note moyenne de ${avgRating.toFixed(1)}/5.`,
        details: {}
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean and parse JSON from Gemini response
    let parsed: any = null;
    try {
      // Strip markdown code blocks if Gemini adds them anyway
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse Gemini response:", rawText);
      // Fallback
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return new Response(JSON.stringify({
        score: Math.round(avgRating * 10) / 10,
        summary: `Basé sur ${reviews.length} avis, cette école a une note moyenne de ${avgRating.toFixed(1)}/5.`,
        details: {}
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = {
      score: parsed.overall_score,
      summary: parsed.summary,
      details: parsed,
    };

    // Update school satisfaction score
    await supabase.from("schools").update({
      satisfaction_score: parsed.overall_score
    }).eq("id", schoolId);

    // Update sentiment on individual reviews
    const sentimentMap: Record<string, number> = {
      very_positive: 1.0,
      positive: 0.75,
      neutral: 0.5,
      negative: 0.25,
      very_negative: 0.0
    };
    for (const review of reviews) {
      if (!review.sentiment_score) {
        await supabase.from("reviews").update({
          sentiment_score: sentimentMap[parsed.sentiment] ?? 0.5,
          ai_summary: parsed.summary
        }).eq("id", review.id);
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});