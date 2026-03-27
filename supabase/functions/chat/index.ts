import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    if (!GROK_API_KEY) throw new Error("GROK_API_KEY is not configured");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es l'assistant IA d'EtudAfrik, une plateforme qui aide les étudiants africains à trouver des écoles privées au Maroc.

Tu dois:
- Répondre en français par défaut (ou en anglais si l'étudiant écrit en anglais)
- Être chaleureux, encourageant et professionnel
- Donner des informations fiables sur les études au Maroc
- Aider avec: choix d'écoles, coût de la vie, démarches administratives, bourses, logement, visa
- Recommander d'utiliser le système de recommandation IA pour un conseil personnalisé
- Si tu ne connais pas une information précise, le dire honnêtement
- IMPORTANT: Ne jamais mentionner ou recommander des écoles publiques. EtudAfrik répertorie UNIQUEMENT des écoles privées.
- IMPORTANT: Ne jamais inventer ou citer des noms d'écoles spécifiques. Oriente toujours l'étudiant vers le système de recommandation IA pour découvrir les écoles disponibles sur la plateforme.

Informations utiles:
- Coût de vie moyen: 3000-5000 MAD/mois
- Villes principales: Casablanca, Rabat, Marrakech, Fès, Tanger
- Frais de scolarité moyens: 30 000 - 80 000 MAD/an (privé)
- Visa étudiant nécessaire pour les non-marocains`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});