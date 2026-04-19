import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, BookOpen, Heart, MessageCircle, Sparkles,
  LogOut, Settings, Bell, ChevronRight, Star, MapPin, Brain, TrendingUp,
  ArrowRight, Compass, BarChart3, Globe, Shield, DollarSign, Users,
  CheckCircle, Clock, AlertCircle, Megaphone, Building2, Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [featuredSchools, setFeaturedSchools] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "enrollments" | "commissions" | "promotions">("home");

  // Student enrollment states
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);

  // Admin states
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [allCommissions, setAllCommissions] = useState<any[]>([]);
  const [allPromotions, setAllPromotions] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState({ totalCommissions: 0, paidCommissions: 0, pendingCommissions: 0, totalEnrollments: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, savedRes, recsRes, schoolsRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("saved_schools").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("ai_recommendations").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("schools").select("*").eq("is_featured", true).limit(3),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      setSavedCount(savedRes.count ?? 0);
      setRecommendationsCount(recsRes.count ?? 0);
      setFeaturedSchools(schoolsRes.data || []);
      const roles = roleRes.data?.map((r: any) => r.role) || [];
      setIsAdmin(roles.includes("admin"));

      // Fetch student enrollments
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*, schools(name, city, logo_url), programs(name)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setMyEnrollments(enrollData || []);

      // Fetch admin data if admin
      if (roles.includes("admin")) {
        const [enrollRes, commRes, promoRes] = await Promise.all([
          supabase.from("enrollments").select("*, schools(name), profiles!student_id(full_name)").order("created_at", { ascending: false }).limit(50),
          supabase.from("commissions").select("*, schools(name)").order("created_at", { ascending: false }).limit(50),
          supabase.from("promotions").select("*, schools(name)").order("created_at", { ascending: false }).limit(50),
        ]);
        setAllEnrollments(enrollRes.data || []);
        setAllCommissions(commRes.data || []);
        setAllPromotions(promoRes.data || []);

        const comms = commRes.data || [];
        setAdminStats({
          totalEnrollments: enrollRes.data?.length || 0,
          totalCommissions: comms.reduce((s: number, c: any) => s + Number(c.amount_mad), 0),
          paidCommissions: comms.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount_mad), 0),
          pendingCommissions: comms.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.amount_mad), 0),
        });
      }
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Student confirms their enrollment (anti-fraud)
  const confirmEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("enrollments")
      .update({
        student_confirmed_at: new Date().toISOString(),
        status: "student_confirmed",
      })
      .eq("id", enrollmentId)
      .eq("student_id", user!.id);

    if (error) {
      toast.error("Erreur lors de la confirmation");
    } else {
      toast.success("Inscription confirmée ! La commission sera déclenchée après validation de l'école.");
      const { data } = await supabase
        .from("enrollments")
        .select("*, schools(name, city, logo_url), programs(name)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      setMyEnrollments(data || []);
    }
  };

  // Admin marks commission as paid
  const markCommissionPaid = async (commissionId: string) => {
    const { error } = await supabase
      .from("commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", commissionId);
    if (error) toast.error("Erreur");
    else {
      toast.success("Commission marquée comme payée");
      const { data } = await supabase.from("commissions").select("*, schools(name)").order("created_at", { ascending: false }).limit(50);
      setAllCommissions(data || []);
    }
  };

  // Admin activates a promotion
  const activatePromotion = async (promoId: string) => {
    const { error } = await supabase
      .from("promotions")
      .update({ status: "active", is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", promoId);
    if (error) toast.error("Erreur");
    else {
      toast.success("Promotion activée !");
      const { data } = await supabase.from("promotions").select("*, schools(name)").order("created_at", { ascending: false }).limit(50);
      setAllPromotions(data || []);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Étudiant";

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      pending: { label: "En attente", class: "bg-yellow-100 text-yellow-800" },
      student_confirmed: { label: "Confirmé par toi", class: "bg-blue-100 text-blue-800" },
      school_confirmed: { label: "Confirmé école", class: "bg-purple-100 text-purple-800" },
      completed: { label: "Complété ✓", class: "bg-green-100 text-green-800" },
      disputed: { label: "Litige", class: "bg-red-100 text-red-800" },
      cancelled: { label: "Annulé", class: "bg-gray-100 text-gray-600" },
      paid: { label: "Payé ✓", class: "bg-green-100 text-green-800" },
      invoiced: { label: "Facturé", class: "bg-blue-100 text-blue-800" },
      active: { label: "Active", class: "bg-green-100 text-green-800" },
      expired: { label: "Expirée", class: "bg-gray-100 text-gray-600" },
    };
    const s = map[status] || { label: status, class: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.class}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-warm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">EtudAfrik</span>
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-1">
                ADMIN
              </span>
            )}
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Tab bar — admin sees more tabs */}
      <div className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: "home", label: "Accueil" },
              { key: "enrollments", label: `Inscriptions (${myEnrollments.length})` },
              ...(isAdmin ? [
                { key: "commissions", label: `Commissions (${allCommissions.length})` },
                { key: "promotions", label: `Promotions (${allPromotions.length})` },
              ] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* ============ HOME TAB ============ */}
        {activeTab === "home" && (
          <>
            {/* Welcome Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative p-8 rounded-3xl bg-hero-gradient overflow-hidden mb-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent)]" />
              <div className="relative z-10">
                <p className="text-primary-foreground/70 text-sm font-medium mb-1">Bienvenue !</p>
                <h1 className="font-display text-3xl md:text-4xl italic text-primary-foreground mb-3">
                  Salut, {firstName} 👋
                </h1>
                <p className="text-primary-foreground/80 max-w-md">
                  Explore les meilleures écoles au Maroc et trouve celle qui te correspond.
                </p>
              </div>
            </motion.div>

            {/* Admin Stats */}
            {isAdmin && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Users, label: "Inscriptions", value: adminStats.totalEnrollments, color: "text-blue-500" },
                  { icon: DollarSign, label: "Commissions totales", value: `${adminStats.totalCommissions.toLocaleString()} MAD`, color: "text-green-500" },
                  { icon: CheckCircle, label: "Commissions payées", value: `${adminStats.paidCommissions.toLocaleString()} MAD`, color: "text-emerald-500" },
                  { icon: Clock, label: "En attente", value: `${adminStats.pendingCommissions.toLocaleString()} MAD`, color: "text-yellow-500" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-card border border-border shadow-card">
                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Student Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Heart, label: "Favoris", value: savedCount, color: "text-destructive" },
                { icon: Sparkles, label: "Recommandations", value: recommendationsCount, color: "text-primary" },
                { icon: BookOpen, label: "Inscriptions", value: myEnrollments.length, color: "text-accent" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  className="p-5 rounded-2xl bg-card border border-border shadow-card text-center">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold text-foreground mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Search, title: "Explorer les écoles", desc: "Parcourez les écoles au Maroc", href: "/schools", gradient: "from-[hsl(250,65%,55%)] to-[hsl(280,60%,55%)]" },
                { icon: Brain, title: "Recommandation IA", desc: "Trouvez votre école idéale avec l'IA", href: "/recommendation", gradient: "from-[hsl(170,60%,42%)] to-[hsl(195,70%,50%)]" },
                { icon: MessageCircle, title: "Chatbot IA", desc: "Posez vos questions sur les études", href: "/chat", gradient: "from-[hsl(35,95%,55%)] to-[hsl(20,85%,55%)]" },
                { icon: Compass, title: "Mon profil", desc: "Complétez vos préférences", href: "/profile", gradient: "from-[hsl(340,65%,55%)] to-[hsl(310,55%,55%)]" },
              ].map((action, i) => (
                <motion.div key={action.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                  <Link to={action.href}
                    className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}

              {/* Guide — unlocked only after student confirms enrollment */}
              {(() => {
                const hasConfirmed = myEnrollments.some(e =>
                  ["student_confirmed", "school_confirmed", "completed"].includes(e.status)
                );
                return hasConfirmed ? (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Link to="/guide"
                      className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-green-200 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                        DÉBLOQUÉ 🔓
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(145,60%,40%)] to-[hsl(165,65%,45%)] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Guide de l'étudiant</h3>
                        <p className="text-sm text-muted-foreground">Budget, logement, visa, conseils par ville</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border cursor-not-allowed opacity-70">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                          Guide de l'étudiant
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted border border-border">🔒 Verrouillé</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Confirmez votre inscription dans une école pour débloquer
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Profile completion nudge */}
            {profile && !profile.country && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl bg-accent/10 border border-accent/20 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Complète ton profil 📝</h3>
                    <p className="text-muted-foreground text-sm">Ajoute tes préférences pour des recommandations IA personnalisées.</p>
                  </div>
                  <Link to="/profile">
                    <Button className="rounded-xl gap-1 bg-foreground text-background hover:bg-foreground/90">
                      Compléter <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Partner / Sponsored Schools */}
            {featuredSchools.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Écoles Partenaires</h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                      SPONSORISÉ
                    </span>
                  </div>
                  <Link to="/schools" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    Voir tout <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Promo banner for first featured school */}
                {featuredSchools[0] && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="mb-4">
                    <Link to={`/schools/${featuredSchools[0].slug}`}
                      className="group relative block rounded-2xl overflow-hidden border border-amber-200 shadow-card hover:shadow-card-hover transition-all">
                      <div className="h-40 relative">
                        {featuredSchools[0].cover_url
                          ? <img src={featuredSchools[0].cover_url} alt={featuredSchools[0].name} className="absolute inset-0 w-full h-full object-cover" />
                          : <div className="absolute inset-0 bg-hero-gradient" />
                        }
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-between">
                          <span className="self-start px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
                            ⚡ Partenaire Officiel
                          </span>
                          <div>
                            <h3 className="text-white font-bold text-lg leading-tight">{featuredSchools[0].name}</h3>
                            <p className="text-white/70 text-sm flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {featuredSchools[0].city}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Other featured schools */}
                <div className="grid grid-cols-2 gap-3">
                  {featuredSchools.slice(1).map((school, i) => (
                    <motion.div key={school.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
                      <Link to={`/schools/${school.slug}`}
                        className="group block rounded-2xl border border-amber-200 bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all">
                        <div className="h-24 relative overflow-hidden">
                          {school.cover_url
                            ? <img src={school.cover_url} alt={school.name} className="absolute inset-0 w-full h-full object-cover" />
                            : <div className="absolute inset-0 bg-hero-gradient opacity-80" />
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[9px] font-bold">
                            ⚡ Partenaire
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs leading-tight line-clamp-2">
                            {school.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-2.5 h-2.5" /> {school.city}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ============ ENROLLMENTS TAB ============ */}
        {activeTab === "enrollments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Mes inscriptions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirmez votre inscription pour déclencher le suivi de commission.
                </p>
              </div>
            </div>

            {/* Anti-fraud explanation */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4 flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Comment ça marche ?</strong> Quand tu t'inscris dans une école via EtudAfrik, confirme ici. L'école confirme aussi de son côté. Les deux confirmations déclenchent automatiquement la commission — ce système garantit que personne ne peut tricher.
              </div>
            </div>

            {myEnrollments.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">Aucune inscription</h3>
                <p className="text-sm text-muted-foreground mb-4">Explorez les écoles et lancez votre candidature !</p>
                <Link to="/schools"><Button className="rounded-xl">Explorer les écoles</Button></Link>
              </div>
            ) : (
              myEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{enrollment.schools?.name}</h3>
                        <p className="text-sm text-muted-foreground">{enrollment.programs?.name || "Programme non spécifié"}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.schools?.city} • {enrollment.academic_year || "2025-2026"}</p>
                      </div>
                    </div>
                    {statusBadge(enrollment.status)}
                  </div>

                  {/* Confirmation steps */}
                  <div className="mt-4 flex gap-3">
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${enrollment.student_confirmed_at ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ta confirmation
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${enrollment.school_confirmed_at ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Confirmation école
                    </div>
                  </div>

                  {/* Confirm button — only if not yet confirmed by student */}
                  {!enrollment.student_confirmed_at && enrollment.status === "pending" && (
                    <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-800 mb-3">
                        <strong>Tu t'es inscrit(e) dans cette école ?</strong> Confirme ici pour que EtudAfrik puisse suivre ton inscription.
                      </p>
                      <Button
                        onClick={() => confirmEnrollment(enrollment.id)}
                        className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmer mon inscription
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ============ COMMISSIONS TAB (ADMIN) ============ */}
        {activeTab === "commissions" && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-6">Suivi des commissions</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total généré", value: `${adminStats.totalCommissions.toLocaleString()} MAD`, color: "text-foreground" },
                { label: "Payé", value: `${adminStats.paidCommissions.toLocaleString()} MAD`, color: "text-green-600" },
                { label: "En attente", value: `${adminStats.pendingCommissions.toLocaleString()} MAD`, color: "text-yellow-600" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {allCommissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucune commission pour le moment.</div>
            ) : (
              allCommissions.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{c.schools?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {c.rate_percent}% de {Number(c.tuition_yearly).toLocaleString()} MAD
                        • Échéance: {c.due_date ? new Date(c.due_date).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">{Number(c.amount_mad).toLocaleString()} MAD</span>
                      {statusBadge(c.status)}
                    </div>
                  </div>
                  {c.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => markCommissionPaid(c.id)} className="rounded-lg gap-1 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Marquer payée
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ============ PROMOTIONS TAB (ADMIN) ============ */}
        {activeTab === "promotions" && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Promotions des écoles</h2>
              <div className="text-sm text-muted-foreground">
                {allPromotions.filter(p => p.status === "active").length} actives
              </div>
            </div>

            {allPromotions.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune promotion soumise pour le moment.</p>
              </div>
            ) : (
              allPromotions.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Megaphone className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-foreground">{p.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.schools?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {p.type} • Prix: {Number(p.price_mad).toLocaleString()} MAD
                        • Du {new Date(p.starts_at).toLocaleDateString("fr-FR")} au {new Date(p.ends_at).toLocaleDateString("fr-FR")}
                      </p>
                      {p.status === "active" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          👁 {p.impressions} vues • 🖱 {p.clicks} clics
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(p.status)}
                      {p.status === "pending" && (
                        <Button size="sm" onClick={() => activatePromotion(p.id)} className="rounded-lg gap-1 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" /> Activer
                        </Button>
                      )}
                    </div>
                  </div>
                  {p.description && (
                    <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">{p.description}</p>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;