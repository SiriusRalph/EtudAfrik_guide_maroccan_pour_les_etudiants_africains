import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Star, Globe, Globe2, Phone, Mail, Heart, BookOpen, Users,
  Calendar, Shield, Send, Loader2, Award, Building2, Wifi, Coffee,
  GraduationCap, Sparkles, BarChart3, ThumbsUp, ThumbsDown, TrendingUp, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SchoolDetail = () => {
  const [enrolling, setEnrolling] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<any>(null);
  const { slug } = useParams();
  const { user } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewProfiles, setReviewProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [teachingQuality, setTeachingQuality] = useState(0);
  const [facilitiesRating, setFacilitiesRating] = useState(0);
  const [studentLife, setStudentLife] = useState(0);
  const [internshipOpp, setInternshipOpp] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzingReviews, setAnalyzingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "programs" | "reviews">("overview");
  const [siblingCampuses, setSiblingCampuses] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchool = async () => {
      const { data: schoolData } = await supabase
        .from("schools").select("*").eq("slug", slug).single();
      if (!schoolData) { setLoading(false); return; }
      setSchool(schoolData);

      if (schoolData.group_id) {
        const { data: campuses } = await supabase
          .from("schools")
          .select("id, name, city, address, phone, slug, is_verified")
          .eq("group_id", schoolData.group_id)
          .neq("id", schoolData.id)
          .order("city");
        setSiblingCampuses(campuses || []);
      }

      // Fetch partnerships
      const { data: partnershipsData } = await supabase
        .from("partnerships")
        .select("*")
        .eq("school_id", schoolData.id)
        .order("partner_type");
      setPartnerships(partnershipsData || []);

      const [programsRes, reviewsRes] = await Promise.all([
        supabase.from("programs").select("*").eq("school_id", schoolData.id).eq("is_active", true),
        supabase.from("reviews").select("*")
          .eq("school_id", schoolData.id).order("created_at", { ascending: false }),
      ]);
      setPrograms(programsRes.data || []);
      const reviewsData = reviewsRes.data || [];
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles").select("user_id, full_name, avatar_url, country")
          .in("user_id", userIds);
        if (profiles) {
          const profileMap: Record<string, any> = {};
          profiles.forEach(p => { profileMap[p.user_id] = p; });
          setReviewProfiles(profileMap);
        }
      }

      if (user) {
        const { data: savedData } = await supabase
          .from("saved_schools").select("id")
          .eq("user_id", user.id).eq("school_id", schoolData.id).maybeSingle();
        setIsSaved(!!savedData);
      }
      setLoading(false);
      if (user) {
        const { data: enrollData } = await supabase
          .from("enrollments")
          .select("*")
          .eq("student_id", user.id)
          .eq("school_id", schoolData.id)
          .maybeSingle();
        setExistingEnrollment(enrollData);
      }
    };
    fetchSchool();
  }, [slug, user]);

  const toggleSave = async () => {
    if (!user) { toast.error("Connectez-vous pour sauvegarder"); return; }
    if (isSaved) {
      await supabase.from("saved_schools").delete().eq("user_id", user.id).eq("school_id", school.id);
      setIsSaved(false);
      toast.success("Retirée des favoris");
    } else {
      await supabase.from("saved_schools").insert({ user_id: user.id, school_id: school.id });
      setIsSaved(true);
      toast.success("École sauvegardée !");
    }
  };

  const analyzeReviews = async () => {
    if (!school) return;
    setAnalyzingReviews(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ schoolId: school.id }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiAnalysis(data);
        const { data: updated } = await supabase.from("schools").select("*").eq("id", school.id).single();
        if (updated) setSchool(updated);
      }
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzingReviews(false);
    }
  };

  const declareEnrollment = async (programId?: string) => {
    if (!user) { toast.error("Connectez-vous pour déclarer une inscription"); return; }
    setEnrolling(true);
    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: user.id,
        school_id: school.id,
        program_id: programId || null,
        academic_year: "2025-2026",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") toast.error("Vous avez déjà une inscription dans cette école.");
      else toast.error(error.message);
    } else {
      setExistingEnrollment(data);
      toast.success("Inscription déclarée ! Rendez-vous dans votre dashboard pour la confirmer.");
    }
    setEnrolling(false);
  };

  const submitReview = async () => {
    if (!user) { toast.error("Connectez-vous pour laisser un avis"); return; }
    if (!reviewText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      school_id: school.id,
      rating,
      title: reviewTitle || null,
      comment: reviewText,
      teaching_quality: teachingQuality || null,
      facilities_rating: facilitiesRating || null,
      student_life: studentLife || null,
      internship_opportunities: internshipOpp || null,
      value_for_money: valueForMoney || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Avis publié ! L'analyse IA va être lancée.");
      setReviewText("");
      setReviewTitle("");
      setRating(5);
      setTeachingQuality(0);
      setFacilitiesRating(0);
      setStudentLife(0);
      setInternshipOpp(0);
      setValueForMoney(0);

      const { data } = await supabase.from("reviews").select("*")
        .eq("school_id", school.id).order("created_at", { ascending: false });
      const reviewsData = data || [];
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles").select("user_id, full_name, avatar_url, country")
          .in("user_id", userIds);
        if (profiles) {
          const profileMap: Record<string, any> = {};
          profiles.forEach(p => { profileMap[p.user_id] = p; });
          setReviewProfiles(profileMap);
        }
      }

      analyzeReviews();
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement de l'école...</p>
      </div>
    </div>
  );

  if (!school) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="font-display text-2xl italic text-foreground">École non trouvée</h2>
      <Link to="/schools"><Button className="rounded-xl">Retour aux écoles</Button></Link>
    </div>
  );

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const domains = [...new Set(programs.map(p => p.domain))];

  const RatingStars = ({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: string }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          disabled={!onChange}
          className="transition-transform hover:scale-110"
        >
          <Star className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} transition-colors ${
            s <= value ? "text-accent fill-accent" : "text-border"
          }`} />
        </button>
      ))}
    </div>
  );

  const SubRating = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <RatingStars value={value} onChange={onChange} size="sm" />
    </div>
  );

  const partnershipColor = (type: string) => {
    switch (type) {
      case "Double diplôme": return "bg-green-100 text-green-700";
      case "Accréditation": return "bg-blue-100 text-blue-700";
      case "Recherche": return "bg-purple-100 text-purple-700";
      case "Industrie": return "bg-orange-100 text-orange-700";
      case "Réseau": return "bg-yellow-100 text-yellow-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {school.cover_url ? (
          <img src={school.cover_url} alt={school.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-hero-gradient" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <Link to="/schools">
            <Button variant="ghost" size="icon" className="rounded-xl glass glass-border text-foreground hover:bg-card/90">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-xl glass glass-border text-foreground hover:bg-card/90" onClick={toggleSave}>
            <Heart className={`w-5 h-5 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* School Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-end gap-5 mb-5">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-elevation-2 flex items-center justify-center flex-shrink-0">
              {school.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <GraduationCap className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 mb-1">
                {school.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                    <Shield className="w-3 h-3" /> Vérifiée
                  </span>
                )}
                {school.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold">
                    <Award className="w-3 h-3" /> En vedette
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                  {school.type}{school.category ? ` · ${school.category}` : ""}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl italic text-foreground">{school.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-2 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {school.city}</span>
                {avgRating && (
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Star className="w-4 h-4 text-accent fill-accent" /> {avgRating}
                    <span className="text-muted-foreground font-normal">({reviews.length} avis)</span>
                  </span>
                )}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {school.student_count?.toLocaleString() || 0}</span>
                {school.founded_year && (
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {school.founded_year}</span>
                )}
              </div>
            </div>
          </div>

          {school.description && (
            <p className="text-muted-foreground leading-relaxed max-w-3xl text-[15px]">{school.description}</p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Users, label: "Étudiants", value: school.student_count?.toLocaleString() || "—" },
              { icon: Globe, label: "Internationaux", value: school.international_student_count?.toLocaleString() || "—" },
              { icon: BookOpen, label: "Programmes", value: programs.length },
              { icon: Star, label: "Satisfaction", value: school.satisfaction_score ? `${Number(school.satisfaction_score).toFixed(1)}/5` : "N/A" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border shadow-card">
                <stat.icon className="w-4 h-4 text-primary mb-2" />
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Enrollment CTA */}
          {user && (
            <div className="p-5 rounded-2xl bg-card border border-border shadow-card mt-4">
              <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Vous êtes inscrit(e) ici ?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Déclarez votre inscription pour que EtudAfrik puisse la suivre.
                Vous devrez ensuite la confirmer dans votre dashboard.
              </p>
              {existingEnrollment ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-medium">Inscription déclarée</span>
                  <span className="text-muted-foreground">— Confirmez-la dans votre</span>
                  <Link to="/dashboard" className="text-primary font-medium hover:underline">dashboard</Link>
                </div>
              ) : (
                <Button onClick={() => declareEnrollment()} disabled={enrolling} className="rounded-xl gap-2 bg-hero-gradient text-primary-foreground">
                  {enrolling
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Déclaration...</>
                    : <><GraduationCap className="w-4 h-4" /> Déclarer mon inscription</>
                  }
                </Button>
              )}
            </div>
          )}

          {/* Contact */}
          <div className="flex flex-wrap gap-3 mt-5">
            {school.website && (
              <a href={school.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                <Globe className="w-3.5 h-3.5" /> Site web
              </a>
            )}
            {school.email && (
              <a href={`mailto:${school.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            {school.phone && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                <Phone className="w-3.5 h-3.5" /> {school.phone}
              </span>
            )}
          </div>

          {/* Facilities & Languages */}
          {(school.facilities?.length > 0 || school.languages?.length > 0 || school.accreditations?.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-5">
              {school.accreditations?.map((a: string) => (
                <span key={a} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{a}</span>
              ))}
              {school.languages?.map((l: string) => (
                <span key={l} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium uppercase">{l}</span>
              ))}
              {school.facilities?.map((f: string) => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{f}</span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted mb-8 max-w-md">
          {[
            { key: "overview" as const, label: "Aperçu" },
            { key: "programs" as const, label: `Programmes (${programs.length})` },
            { key: "reviews" as const, label: `Avis (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-elevation-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
            {/* AI Analysis Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Analyse IA
                </h2>
                {reviews.length > 0 && (
                  <Button onClick={analyzeReviews} disabled={analyzingReviews} variant="outline" className="rounded-xl gap-2 text-sm">
                    {analyzingReviews ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {analyzingReviews ? "Analyse en cours..." : "Lancer l'analyse"}
                  </Button>
                )}
              </div>

              {aiAnalysis ? (
                <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-hero-gradient flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-foreground">{aiAnalysis.score?.toFixed(1) || "—"}<span className="text-lg text-muted-foreground">/5</span></div>
                      <p className="text-muted-foreground text-sm mt-1">{aiAnalysis.summary}</p>
                    </div>
                  </div>
                  {aiAnalysis.details?.strengths && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <ThumbsUp className="w-4 h-4 text-success" /> Points forts
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.details.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-success mt-0.5">✓</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <ThumbsDown className="w-4 h-4 text-destructive" /> Points à améliorer
                        </h4>
                        <ul className="space-y-2">
                          {(aiAnalysis.details.weaknesses || []).map((w: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-destructive mt-0.5">✗</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {(aiAnalysis.details?.teaching_score || aiAnalysis.details?.facilities_score) && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: "Enseignement", score: aiAnalysis.details.teaching_score },
                        { label: "Infrastructures", score: aiAnalysis.details.facilities_score },
                        { label: "Vie étudiante", score: aiAnalysis.details.student_life_score },
                        { label: "Stages", score: aiAnalysis.details.internship_score },
                        { label: "Rapport qualité-prix", score: aiAnalysis.details.value_score },
                      ].filter(s => s.score).map((s, i) => (
                        <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                          <div className="text-lg font-bold text-foreground">{s.score?.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : reviews.length > 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Cliquez sur "Lancer l'analyse" pour obtenir un résumé IA des avis étudiants.</p>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center">
                  <p className="text-muted-foreground text-sm">Aucun avis à analyser pour le moment.</p>
                </div>
              )}
            </section>

            {/* Domains */}
            {domains.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Domaines d'études</h2>
                <div className="flex flex-wrap gap-2">
                  {domains.map((d) => (
                    <span key={d} className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground shadow-card">{d}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Partenariats internationaux */}
            {partnerships.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-primary" />
                  Partenariats internationaux ({partnerships.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partnerships.map((p) => (
                    <div key={p.id} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border shadow-card">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Globe2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{p.partner_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.partner_country}</div>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${partnershipColor(p.partner_type)}`}>
                          {p.partner_type}
                        </span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Autres campus */}
            {siblingCampuses.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Autres campus
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {siblingCampuses.map((campus) => (
                    <Link
                      key={campus.id}
                      to={`/schools/${campus.slug}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">{campus.city}</div>
                        {campus.address && <div className="text-xs text-muted-foreground truncate mt-0.5">{campus.address}</div>}
                        {campus.phone && <div className="text-xs text-muted-foreground mt-0.5">{campus.phone}</div>}
                      </div>
                      {campus.is_verified && <Shield className="w-4 h-4 text-success flex-shrink-0" />}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activeTab === "programs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12">
            {programs.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun programme disponible.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-foreground">{p.name}</h3>
                      {p.tuition_yearly !== null && p.tuition_yearly !== undefined && (
                        <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">
                          {p.tuition_yearly === 0 ? "Gratuit" : `${p.tuition_yearly.toLocaleString()} MAD/an`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{p.domain}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">{p.level}</span>
                      {p.duration_months && (
                        <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">{p.duration_months} mois</span>
                      )}
                      {p.language && (
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs uppercase">{p.language}</span>
                      )}
                    </div>
                    {p.description && <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{p.description}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "reviews" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 space-y-6">
            {user && (
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Laisser un avis
                </h3>
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">Note globale</label>
                  <RatingStars value={rating} onChange={setRating} />
                </div>
                <Input
                  placeholder="Titre de votre avis (optionnel)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="rounded-xl mb-3"
                />
                <Textarea
                  placeholder="Partagez votre expérience en détail : qualité des cours, vie étudiante, infrastructures..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="rounded-xl mb-4 min-h-[100px]"
                />
                <div className="p-4 rounded-xl bg-muted/50 mb-4 space-y-1">
                  <p className="text-sm font-medium text-foreground mb-2">Notes détaillées (optionnel)</p>
                  <SubRating label="Qualité de l'enseignement" value={teachingQuality} onChange={setTeachingQuality} />
                  <SubRating label="Infrastructures" value={facilitiesRating} onChange={setFacilitiesRating} />
                  <SubRating label="Vie étudiante" value={studentLife} onChange={setStudentLife} />
                  <SubRating label="Opportunités de stage" value={internshipOpp} onChange={setInternshipOpp} />
                  <SubRating label="Rapport qualité-prix" value={valueForMoney} onChange={setValueForMoney} />
                </div>
                <Button onClick={submitReview} disabled={submitting || !reviewText.trim()} className="bg-hero-gradient text-primary-foreground rounded-xl gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publier l'avis
                </Button>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground text-lg mb-1">Aucun avis</h3>
                <p className="text-muted-foreground text-sm">Soyez le premier à partager votre expérience !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, i) => {
                  const profile = reviewProfiles[r.user_id];
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl bg-card border border-border shadow-card"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {(profile?.full_name || "A")[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">{profile?.full_name || "Anonyme"}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {profile?.country && <span>{profile.country}</span>}
                            <span>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-accent fill-accent" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <h4 className="font-semibold text-foreground mb-1">{r.title}</h4>}
                      <p className="text-muted-foreground text-sm leading-relaxed">{r.comment}</p>
                      {r.ai_summary && (
                        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
                          <span className="text-primary font-semibold flex items-center gap-1 mb-1">
                            <Sparkles className="w-3.5 h-3.5" /> Résumé IA
                          </span>
                          <span className="text-muted-foreground">{r.ai_summary}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetail;