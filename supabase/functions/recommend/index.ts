import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map budget answer to MAD range
function parseBudget(budgetAnswer: string): { min: number; max: number } {
  switch (budgetAnswer) {
    case "Moins de 30 000":   return { min: 0,     max: 30000  };
    case "30 000 - 50 000":   return { min: 30000, max: 50000  };
    case "50 000 - 80 000":   return { min: 50000, max: 80000  };
    case "Plus de 80 000":    return { min: 80000, max: 999999 };
    default:                  return { min: 0,     max: 999999 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, userId } = await req.json();

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    if (!GROK_API_KEY) throw new Error("GROK_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── STEP 1: Parse student preferences ──────────────────────────────────
    const budget = parseBudget(answers.budget);
    const preferredCity = answers.city;
    const preferredField = answers.field;
    const preferredLevel = answers.level;
    const preferredLanguage = answers.language;

    // ── STEP 2: Fetch schools with programs (include tuition) ───────────────
    let query = supabase
      .from("schools")
      .select("id, name, slug, city, category, satisfaction_score, description, programs(id, name, domain, level, language, tuition_yearly)")
      .order("satisfaction_score", { ascending: false });

    // Hard city filter (only if student has a preference)
    if (preferredCity && preferredCity !== "Pas de préférence") {
      query = query.eq("city", preferredCity);
    }

    const { data: allSchools } = await query.limit(50);

    if (!allSchools || allSchools.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 3: Filter by budget AND domain ────────────────────────────────
    const schoolsInBudget = allSchools
      .map((school: any) => {
        // Programs within budget
        const matchingPrograms = (school.programs || []).filter((p: any) => {
          if (p.tuition_yearly === null || p.tuition_yearly === undefined) return true;
          return p.tuition_yearly >= budget.min && p.tuition_yearly <= budget.max;
        });

        // Programs matching domain exactly
        const fieldPrograms = preferredField
          ? matchingPrograms.filter((p: any) => p.domain === preferredField)
          : matchingPrograms;

        return {
          ...school,
          relevantPrograms: fieldPrograms.length > 0 ? fieldPrograms : matchingPrograms,
          allMatchingPrograms: matchingPrograms,
          hasFieldMatch: fieldPrograms.length > 0,
        };
      })
      .filter((s: any) => s.allMatchingPrograms.length > 0)
      .sort((a: any, b: any) => {
        // Prioritize schools with matching domain first
        if (a.hasFieldMatch && !b.hasFieldMatch) return -1;
        if (!a.hasFieldMatch && b.hasFieldMatch) return 1;
        return (b.satisfaction_score || 0) - (a.satisfaction_score || 0);
      })
      .slice(0, 15);

    // If city + budget filter leaves nothing, relax city filter
    const schoolsForAI = schoolsInBudget.length > 0 ? schoolsInBudget : allSchools.slice(0, 10);

    // ── STEP 4: Build AI prompt ─────────────────────────────────────────────
    const schoolsForPrompt = schoolsForAI.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      city: s.city,
      category: s.category,
      satisfaction_score: s.satisfaction_score,
      has_matching_domain: s.hasFieldMatch,
      programs: (s.relevantPrograms || s.programs || []).slice(0, 4).map((p: any) => ({
        name: p.name,
        domain: p.domain,
        level: p.level,
        language: p.language,
        tuition_yearly: p.tuition_yearly ? `${p.tuition_yearly.toLocaleString()} MAD/an` : "Non spécifié",
      })),
    }));

    const prompt = `Tu es un conseiller d'orientation pour étudiants africains qui veulent étudier au Maroc.

Préférences de l'étudiant:
- Domaine: ${answers.field || "Non spécifié"}
- Niveau: ${answers.level || "Non spécifié"}
- Ville: ${answers.city || "Pas de préférence"}
- Budget: ${answers.budget || "Non spécifié"} (soit entre ${budget.min.toLocaleString()} et ${budget.max === 999999 ? "illimité" : budget.max.toLocaleString()} MAD/an)
- Langue d'enseignement: ${answers.language || "Non spécifié"}
- Priorité: ${answers.priority || "Non spécifié"}

RÈGLES ABSOLUES:
1. Ne recommande JAMAIS une école dont TOUS les programmes dépassent ${budget.max === 999999 ? "le budget" : budget.max.toLocaleString() + " MAD/an"}.
2. Privilégie TOUJOURS les écoles avec has_matching_domain = true (elles ont le bon domaine).
3. Si has_matching_domain = false, ne recommande cette école QUE s'il n'y a pas assez d'écoles avec le bon domaine.

Écoles disponibles (triées par correspondance domaine puis satisfaction):
${JSON.stringify(schoolsForPrompt, null, 2)}

Sélectionne les 5 meilleures écoles. Donne la priorité aux écoles qui correspondent au domaine "${answers.field}".
Mentionne toujours le programme et son coût dans les raisons.

Réponds UNIQUEMENT en JSON valide sans texte avant ou après:
{
  "recommendations": [
    {
      "school_id": "uuid exact de l'école",
      "name": "Nom exact",
      "slug": "slug exact",
      "city": "Ville",
      "satisfaction_score": 4.5,
      "match_score": 92,
      "reasons": [
        "Programme X en ${answers.field} à Y MAD/an correspond à ton budget",
        "Raison 2",
        "Raison 3"
      ]
    }
  ]
}`;

    // ── STEP 5: Call Groq AI ───────────────────────────────────────────────
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Tu es un conseiller d'orientation scolaire. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans markdown."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const groqData = await response.json();
    console.log("Groq response:", JSON.stringify(groqData).slice(0, 500));

    const text = groqData.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Groq returned empty response");

    // ── STEP 6: Parse response ─────────────────────────────────────────────
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const recommendations = parsed.recommendations || [];

    // ── STEP 7: Post-process — enforce budget as final safety check ─────────
    const safeRecommendations = recommendations
      .map((rec: any) => {
        const school = allSchools.find((s: any) => s.id === rec.school_id || s.name === rec.name);
        if (!school) return rec;

        const hasAffordableProgram = (school.programs || []).some((p: any) =>
          p.tuition_yearly === null ||
          p.tuition_yearly === undefined ||
          (p.tuition_yearly >= budget.min && p.tuition_yearly <= budget.max)
        );

        if (!hasAffordableProgram && budget.max < 999999) {
          console.warn(`Filtered out ${school.name} — no programs in budget`);
          return null;
        }

        return {
          ...rec,
          school_id: school.id,
          slug: school.slug,
          satisfaction_score: school.satisfaction_score,
        };
      })
      .filter(Boolean);

    // ── STEP 8: Save to DB ─────────────────────────────────────────────────
    if (userId && safeRecommendations.length > 0) {
      for (const rec of safeRecommendations) {
        if (rec.school_id) {
          try {
            await supabase.from("ai_recommendations").upsert({
              user_id: userId,
              school_id: rec.school_id,
              match_score: rec.match_score,
              reasons: rec.reasons,
              questionnaire_answers: answers,
            }, { onConflict: "user_id,school_id" });
          } catch (e) {
            console.warn("Could not save recommendation:", e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ recommendations: safeRecommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("recommend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});