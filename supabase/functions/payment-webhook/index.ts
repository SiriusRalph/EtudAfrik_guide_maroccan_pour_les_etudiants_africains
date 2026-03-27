import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    // Verify webhook signature
    const response = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
      headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}` },
    });

    const event = JSON.parse(body);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "3");

      if (userId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Add credits to user
        const { data: profile } = await supabase
          .from("profiles")
          .select("recommendation_credits")
          .eq("user_id", userId)
          .single();

        await supabase
          .from("profiles")
          .update({ recommendation_credits: (profile?.recommendation_credits || 0) + credits })
          .eq("user_id", userId);

        console.log(`Added ${credits} credits to user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});