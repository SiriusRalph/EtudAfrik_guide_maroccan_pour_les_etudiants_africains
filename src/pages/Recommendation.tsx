import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Loader2, Star, MapPin, Sparkles, Check, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const questions = [
  { id: "field", question: "Quel domaine d'études t'intéresse ?", options: ["Informatique & Réseaux", "Data Science & IA", "Management & Gestion", "Finance & Audit", "Marketing & Communication", "Génie Civil & BTP", "Génie Industriel", "Droit", "Architecture & Urbanisme", "Énergie & Environnement"] },
  { id: "level", question: "Quel niveau d'études recherches-tu ?", options: ["Licence (Bac+3)", "Master (Bac+5)", "Doctorat", "Formation professionnelle"] },
  { id: "city", question: "Quelle ville préfères-tu ?", options: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Pas de préférence"] },
  { id: "budget", question: "Quel est ton budget annuel (MAD) ?", options: ["Moins de 30 000", "30 000 - 50 000", "50 000 - 80 000", "Plus de 80 000"] },
  { id: "language", question: "Langue d'enseignement préférée ?", options: ["Français", "Anglais", "Arabe", "Bilingue (FR/EN)"] },
  { id: "priority", question: "Qu'est-ce qui compte le plus ?", options: ["Qualité de l'enseignement", "Opportunités de stage", "Vie étudiante", "Réputation de l'école", "Coût abordable"] },
];

const STORAGE_KEY = "etudafrik_quiz_answers";

const Recommendation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const currentQ = questions[step];
  const isComplete = step >= questions.length;
  const progress = ((step + (answers[currentQ?.id] ? 1 : 0)) / questions.length) * 100;

  // ── Load credits ───────────────────────────────────────────────────────────
  const loadCredits = async () => {
    if (!user) { setLoadingCredits(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("recommendation_credits")
      .eq("user_id", user.id)
      .single();
    setCredits(data?.recommendation_credits ?? 0);
    setLoadingCredits(false);
  };

  useEffect(() => {
    loadCredits();
  }, [user]);

  // ── Restore answers from sessionStorage after Stripe redirect ──────────────
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
        // Jump to last step so user can immediately get recommendations
        setStep(questions.length);
      } catch {}
    }
  }, []);

  // ── Handle Stripe payment redirect ─────────────────────────────────────────
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;

    if (payment === "success") {
      toast.success("Paiement réussi ! 3 crédits ajoutés à ton compte.");
      // Poll credits for up to 10s (webhook may take a moment)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from("profiles")
          .select("recommendation_credits")
          .eq("user_id", user!.id)
          .single();
        const newCredits = data?.recommendation_credits ?? 0;
        if (newCredits > 0 || attempts >= 10) {
          setCredits(newCredits);
          clearInterval(poll);
          if (newCredits > 0) {
            toast.success(`${newCredits} crédit(s) disponible(s) !`);
          }
        }
      }, 1000);
    } else if (payment === "cancelled") {
      toast.error("Paiement annulé.");
    }

    // Clean URL
    window.history.replaceState({}, "", "/recommendation");
  }, [searchParams]);

  // ── Save answers to sessionStorage whenever they change ───────────────────
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const selectAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handlePayment = async () => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    setPaymentLoading(true);
    // Save answers before leaving page
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userId: user.id,
          successUrl: `${window.location.origin}/recommendation?payment=success`,
          cancelUrl: `${window.location.origin}/recommendation?payment=cancelled`,
        }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur paiement");
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du paiement");
      setPaymentLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!user) { toast.error("Connectez-vous d'abord"); return; }
    if (credits !== null && credits <= 0) {
      toast.error("Tu n'as plus de crédits !");
      return;
    }

    setLoading(true);
    try {
      // Optimistic credit deduction
      const prevCredits = credits ?? 1;
      await supabase
        .from("profiles")
        .update({ recommendation_credits: prevCredits - 1 })
        .eq("user_id", user.id);
      setCredits(prevCredits - 1);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ answers, userId: user?.id }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur serveur");
      }

      const data = await resp.json();
      setResults(data.recommendations || []);
      // Clear saved answers once we have results
      sessionStorage.removeItem(STORAGE_KEY);

    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la recommandation");
      // Refund credit on error
      const prevCredits = credits ?? 1;
      await supabase
        .from("profiles")
        .update({ recommendation_credits: prevCredits })
        .eq("user_id", user.id);
      setCredits(prevCredits);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setResults(null);
    setStep(0);
    setAnswers({});
    sessionStorage.removeItem(STORAGE_KEY);
  };

  // ── RESULTS VIEW ───────────────────────────────────────────────────────────
  if (results) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4 h-16 flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="font-semibold text-foreground text-sm">Résultats IA</h1>
            <span className="ml-auto text-xs text-muted-foreground">{credits} crédit(s) restant(s)</span>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-warm">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl italic text-foreground mb-2">Tes recommandations</h2>
            <p className="text-muted-foreground text-sm">Écoles sélectionnées par notre IA selon ton profil</p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-2xl bg-card border border-border">
              <p className="text-muted-foreground mb-4">Aucune école ne correspond exactement. Essaie d'élargir tes préférences.</p>
              <Button onClick={resetQuiz} className="rounded-xl">Recommencer</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r: any, i: number) => (
                <motion.div key={r.school_id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link to={r.slug ? `/schools/${r.slug}` : "#"}
                    className="block p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">#{i + 1}</span>
                        <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{r.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {r.city}</span>
                          {r.satisfaction_score > 0 && (
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-accent fill-accent" /> {Number(r.satisfaction_score).toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-hero-gradient text-primary-foreground text-sm font-bold shadow-warm flex-shrink-0">
                        {r.match_score}%
                      </div>
                    </div>
                    {r.reasons && (
                      <div className="space-y-1.5">
                        {(Array.isArray(r.reasons) ? r.reasons : []).map((reason: string, j: number) => (
                          <p key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" /> {reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 space-y-3">
            <Button onClick={resetQuiz} variant="outline" className="rounded-xl">
              Refaire le questionnaire
            </Button>
            {credits !== null && credits <= 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tu n'as plus de crédits</p>
                <Button onClick={handlePayment} disabled={paymentLoading}
                  className="rounded-xl bg-hero-gradient text-primary-foreground gap-2">
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Acheter 3 crédits — 50 MAD
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTIONNAIRE VIEW ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-semibold text-foreground text-sm">Recommandation IA</h1>
          <div className="ml-auto flex items-center gap-3">
            {!loadingCredits && credits !== null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${credits > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {credits} crédit(s)
              </span>
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {Math.min(step + 1, questions.length)}/{questions.length}
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-muted">
          <motion.div className="h-full bg-hero-gradient" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    <Brain className="w-3.5 h-3.5" /> Question {step + 1}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl italic text-foreground">{currentQ.question}</h2>
                </div>
                <div className="space-y-2.5">
                  {currentQ.options.map((opt) => (
                    <button key={opt} onClick={() => selectAnswer(opt)}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                        answers[currentQ.id] === opt
                          ? "border-primary bg-primary/5 text-foreground font-medium ring-1 ring-primary"
                          : "border-border bg-card text-foreground hover:border-primary/40 shadow-card"
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{opt}</span>
                        {answers[currentQ.id] === opt && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-xl text-sm">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Précédent
                    </Button>
                  ) : <div />}
                  {step === questions.length - 1 && answers[currentQ.id] && (
                    <Button onClick={() => setStep(questions.length)} className="rounded-xl bg-foreground text-background hover:bg-foreground/90 gap-1">
                      Continuer <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-6 shadow-warm">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="font-display text-3xl italic text-foreground mb-3">Questionnaire terminé !</h2>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Notre IA va analyser tes réponses et te recommander les meilleures écoles.
                </p>

                {!loadingCredits && (
                  <div className="mb-6">
                    {credits !== null && credits > 0 ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success text-sm font-medium">
                        <Check className="w-4 h-4" /> {credits} crédit(s) disponible(s)
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-card border border-border shadow-card max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-foreground mb-1">Tu n'as plus de crédits</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Achète 3 crédits pour obtenir tes recommandations personnalisées.
                        </p>
                        <Button onClick={handlePayment} disabled={paymentLoading}
                          className="w-full rounded-xl bg-hero-gradient text-primary-foreground gap-2">
                          {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          Acheter 3 crédits — 50 MAD
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {credits !== null && credits > 0 && (
                  <Button onClick={getRecommendations} disabled={loading}
                    className="bg-hero-gradient text-primary-foreground shadow-warm rounded-xl gap-2 text-sm px-8 h-12">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                    {loading ? "Analyse en cours..." : "Obtenir mes recommandations"}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;