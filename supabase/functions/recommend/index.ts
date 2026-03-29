import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️  Set STRIPE_WEBHOOK_SECRET in your Supabase Edge Function secrets
// Get it from: Stripe Dashboard → Webhooks → your endpoint → Signing secret

serve(async (req) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing Stripe env vars");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature", { status: 400 });
    }

    // Verify webhook signature using Stripe's algorithm
    const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("Invalid Stripe webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Stripe event:", event.type);

    // Only handle successful payments
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Only process if payment was actually paid
      if (session.payment_status !== "paid") {
        return new Response("Not paid yet", { status: 200 });
      }

      const userId = session.metadata?.user_id;
      const creditsToAdd = parseInt(session.metadata?.credits || "3");

      if (!userId) {
        console.error("No user_id in session metadata");
        return new Response("No user_id", { status: 400 });
      }

      console.log(`Adding ${creditsToAdd} credits to user ${userId}`);

      // Get current credits
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("recommendation_credits")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        return new Response("Profile not found", { status: 400 });
      }

      const currentCredits = profile?.recommendation_credits ?? 0;
      const newCredits = currentCredits + creditsToAdd;

      // Update credits
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ recommendation_credits: newCredits })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return new Response("Failed to update credits", { status: 500 });
      }

      console.log(`✅ User ${userId} now has ${newCredits} credits`);

      // Log the payment for records
      await supabase.from("payment_logs").insert({
        user_id: userId,
        stripe_session_id: session.id,
        amount_cents: session.amount_total,
        currency: session.currency,
        credits_added: creditsToAdd,
        status: "completed",
      }).select(); // ignore error if table doesn't exist yet
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Verify Stripe webhook signature (HMAC-SHA256)
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
    const expectedSig = parts.find((p) => p.startsWith("v1="))?.slice(3);

    if (!timestamp || !expectedSig) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );

    const computedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSig === expectedSig;
  } catch {
    return false;
  }
}