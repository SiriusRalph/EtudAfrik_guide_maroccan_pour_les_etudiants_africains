import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Users, Star, CheckCircle, XCircle, Loader2,
  LogOut, Building2, Megaphone, Settings, BarChart3, MapPin,
  Clock, ArrowRight, Plus, Eye, TrendingUp, Shield, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Tab = "overview" | "enrollments" | "promotions" | "profile";

const SchoolDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // School data
  const [school, setSchool] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEnrollments: 0, pendingEnrollments: 0, confirmedEnrollments: 0, totalViews: 0 });

  // Promotion form
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ title: "", description: "", type: "program_highlight", duration_days: "30", price_mad: "2000" });
  const [promoLoading, setPromoLoading] = useState(false);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Get school linked to this admin
      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("admin_user_id", user!.id)
        .single();

      if (!schoolData) {
        toast.error("Aucune école liée à votre compte.");
        setLoading(false);
        return;
      }

      setSchool(schoolData);
      setProfileForm({
        name: schoolData.name || "",
        description: schoolData.description || "",
        address: schoolData.address || "",
        phone: schoolData.phone || "",
        email: schoolData.email || "",
        website: schoolData.website || "",
      });

      // Fetch enrollments with student profiles
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*, programs(name)")
        .eq("school_id", schoolData.id)
        .limit(1)
        .order("created_at", { ascending: false });

      const enrollList = enrollData || [];

      // Fetch student profiles separately
      if (enrollList.length > 0) {
        const studentIds = [...new Set(enrollList.map((e: any) => e.student_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, country, phone")
          .in("user_id", studentIds);

        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
        enrollList.forEach((e: any) => { e.profile = profileMap[e.student_id] || null; });
      }

      setEnrollments(enrollList);

      // Stats
      const pending = enrollList.filter((e: any) => e.status === "pending" || e.status === "student_confirmed").length;
      const confirmed = enrollList.filter((e: any) => e.status === "school_confirmed" || e.status === "completed").length;
      setStats({
        totalEnrollments: enrollList.length,
        pendingEnrollments: pending,
        confirmedEnrollments: confirmed,
        totalViews: schoolData.student_count || 0,
      });

      // Fetch promotions
      const { data: promoData } = await supabase
        .from("promotions")
        .select("*")
        .eq("school_id", schoolData.id)
        .order("created_at", { ascending: false });
      setPromotions(promoData || []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const confirmEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("enrollments")
      .update({
        school_confirmed_at: new Date().toISOString(),
        status: "school_confirmed",
      })
      .eq("id", enrollmentId);

    if (error) toast.error("Erreur: " + error.message);
    else {
      toast.success("Inscription confirmée ! La commission a été déclenchée.");
      fetchAll();
    }
  };

  const rejectEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("enrollments")
      .update({ status: "cancelled" })
      .eq("id", enrollmentId);

    if (error) toast.error("Erreur: " + error.message);
    else { toast.success("Inscription annulée."); fetchAll(); }
  };

  const submitPromotion = async () => {
    if (!school || !promoForm.title) return;
    setPromoLoading(true);
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(promoForm.duration_days));

    const { error } = await supabase.from("promotions").insert({
      school_id: school.id,
      title: promoForm.title,
      description: promoForm.description,
      type: promoForm.type,
      price_mad: parseFloat(promoForm.price_mad),
      ends_at: endsAt.toISOString(),
      status: "pending",
      is_paid: false,
    });

    if (error) toast.error("Erreur: " + error.message);
    else {
      toast.success("Demande de promotion soumise ! L'équipe EtudAfrik va l'activer après paiement.");
      setShowPromoForm(false);
      setPromoForm({ title: "", description: "", type: "program_highlight", duration_days: "30", price_mad: "2000" });
      fetchAll();
    }
    setPromoLoading(false);
  };

  const saveProfile = async () => {
    if (!school) return;
    setProfileLoading(true);
    const { error } = await supabase
      .from("schools")
      .update(profileForm)
      .eq("id", school.id);

    if (error) toast.error("Erreur: " + error.message);
    else {
      toast.success("Profil mis à jour !");
      setEditingProfile(false);
      fetchAll();
    }
    setProfileLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-800" },
      student_confirmed: { label: "Confirmé étudiant", cls: "bg-blue-100 text-blue-800" },
      school_confirmed: { label: "Confirmé ✓", cls: "bg-green-100 text-green-800" },
      completed: { label: "Complété ✓", cls: "bg-emerald-100 text-emerald-800" },
      cancelled: { label: "Annulé", cls: "bg-gray-100 text-gray-600" },
      disputed: { label: "Litige", cls: "bg-red-100 text-red-800" },
      active: { label: "Active", cls: "bg-green-100 text-green-800" },
      expired: { label: "Expirée", cls: "bg-gray-100 text-gray-600" },
    };
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!school) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Building2 className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-xl font-bold text-foreground">Aucune école liée</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Votre compte n'est pas encore associé à une école. Contactez l'équipe EtudAfrik à <strong>contact@etudafrik.com</strong>
      </p>
      <Button onClick={handleSignOut} variant="outline" className="rounded-xl gap-2">
        <LogOut className="w-4 h-4" /> Déconnexion
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center shadow-warm">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">{school.name}</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {school.city}
                {school.is_verified && <span className="text-green-600 flex items-center gap-0.5"><Shield className="w-3 h-3" /> Vérifiée</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to={`/schools/${school.slug}`} target="_blank">
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
                <Eye className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: "overview" as Tab, label: "Vue d'ensemble", icon: BarChart3 },
              { key: "enrollments" as Tab, label: `Inscriptions (${enrollments.length})`, icon: GraduationCap },
              { key: "promotions" as Tab, label: "Promotions", icon: Megaphone },
              { key: "profile" as Tab, label: "Mon école", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Bonjour 👋</h2>
              <p className="text-muted-foreground text-sm">Voici un aperçu de votre activité sur EtudAfrik.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total inscriptions", value: stats.totalEnrollments, color: "text-blue-500" },
                { icon: Clock, label: "En attente", value: stats.pendingEnrollments, color: "text-yellow-500" },
                { icon: CheckCircle, label: "Confirmées", value: stats.confirmedEnrollments, color: "text-green-500" },
                { icon: Star, label: "Score satisfaction", value: school.satisfaction_score ? `${Number(school.satisfaction_score).toFixed(1)}/5` : "N/A", color: "text-accent" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Pending enrollments alert */}
            {stats.pendingEnrollments > 0 && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">
                      {stats.pendingEnrollments} inscription(s) en attente de confirmation
                    </p>
                    <p className="text-yellow-700 text-xs mt-0.5">
                      Confirmez les inscriptions des étudiants pour déclencher le suivi de commission.
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setActiveTab("enrollments")} className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white whitespace-nowrap gap-1">
                  Voir <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setActiveTab("enrollments")}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Gérer les inscriptions</h3>
                  <p className="text-sm text-muted-foreground">Confirmez ou refusez les demandes d'inscription</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>

              <button onClick={() => setActiveTab("promotions")}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Sponsoriser mon école</h3>
                  <p className="text-sm text-muted-foreground">Augmentez votre visibilité auprès des étudiants</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ENROLLMENTS TAB ── */}
        {activeTab === "enrollments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Inscriptions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmez les inscriptions pour valider la commission EtudAfrik (5% des frais de scolarité).
              </p>
            </div>

            {/* Anti-fraud explanation */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <strong>Système anti-fraude :</strong> La commission n'est déclenchée que lorsque l'étudiant <em>et</em> l'école confirment l'inscription. Vous ne payez que pour les vrais inscrits.
              </p>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">Aucune inscription</h3>
                <p className="text-sm text-muted-foreground">Les étudiants qui déclarent s'inscrire dans votre école apparaîtront ici.</p>
              </div>
            ) : (
              enrollments.map((e) => (
                <div key={e.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                          {(e.profile?.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{e.profile?.full_name || "Étudiant"}</h3>
                          <p className="text-xs text-muted-foreground">{e.profile?.country || "Pays non renseigné"}</p>
                        </div>
                      </div>
                      <div className="ml-11 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Programme : <span className="text-foreground font-medium">{e.programs?.name || "Non spécifié"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Déclaré le {new Date(e.created_at).toLocaleDateString("fr-FR")}
                          {e.academic_year && ` · Année ${e.academic_year}`}
                        </p>
                      </div>
                    </div>
                    {statusBadge(e.status)}
                  </div>

                  {/* Confirmation steps */}
                  <div className="flex gap-3 mt-4 ml-11">
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${e.student_confirmed_at ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle className="w-3.5 h-3.5" /> Étudiant
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${e.school_confirmed_at ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      <CheckCircle className="w-3.5 h-3.5" /> École (vous)
                    </div>
                  </div>

                  {/* Action buttons */}
                  {(e.status === "pending" || e.status === "student_confirmed") && (
                    <div className="flex gap-2 mt-4 ml-11">
                      <Button size="sm" onClick={() => confirmEnrollment(e.id)}
                        className="rounded-xl gap-1 bg-green-500 hover:bg-green-600 text-white text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Confirmer l'inscription
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectEnrollment(e.id)}
                        className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Refuser
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── PROMOTIONS TAB ── */}
        {activeTab === "promotions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Promotions</h2>
                <p className="text-sm text-muted-foreground mt-1">Sponsorisez votre école pour apparaître en tête des résultats.</p>
              </div>
              <Button onClick={() => setShowPromoForm(!showPromoForm)} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Nouvelle promotion
              </Button>
            </div>

            {/* Pricing info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { type: "program_highlight", label: "Mise en avant programme", price: "1 000 MAD/mois", desc: "Votre formation apparaît en premier dans son domaine" },
                { type: "featured_school", label: "École Partenaire", price: "2 000 MAD/mois", desc: "Badge Partenaire + section dédiée sur la page d'accueil" },
                { type: "banner", label: "Bannière promotionnelle", price: "3 000 MAD/mois", desc: "Bannière sur toutes les pages du site" },
              ].map((p, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border shadow-card">
                  <div className="font-semibold text-foreground text-sm mb-1">{p.label}</div>
                  <div className="text-primary font-bold mb-2">{p.price}</div>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* New promotion form */}
            {showPromoForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-card border border-primary/20 shadow-card mb-6 space-y-4">
                <h3 className="font-bold text-foreground">Nouvelle demande de promotion</h3>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Type de promotion</label>
                  <select value={promoForm.type} onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="program_highlight">Mise en avant programme — 1 000 MAD/mois</option>
                    <option value="featured_school">École Partenaire — 2 000 MAD/mois</option>
                    <option value="banner">Bannière promotionnelle — 3 000 MAD/mois</option>
                    <option value="new_formation">Nouvelle formation — 1 500 MAD/mois</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Titre de la promotion *</label>
                  <Input value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                    placeholder="Ex: Nouvelle filière IA — Inscriptions 2025-2026 ouvertes !"
                    className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                  <Textarea value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    placeholder="Décrivez votre offre, vos points forts..."
                    className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Durée (jours)</label>
                    <select value={promoForm.duration_days} onChange={(e) => setPromoForm({ ...promoForm, duration_days: e.target.value })}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                      <option value="30">30 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Budget (MAD)</label>
                    <Input type="number" value={promoForm.price_mad}
                      onChange={(e) => setPromoForm({ ...promoForm, price_mad: e.target.value })}
                      className="rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={submitPromotion} disabled={promoLoading || !promoForm.title}
                    className="rounded-xl bg-hero-gradient text-primary-foreground gap-2">
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                    Soumettre la demande
                  </Button>
                  <Button variant="outline" onClick={() => setShowPromoForm(false)} className="rounded-xl">Annuler</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Après soumission, l'équipe EtudAfrik vous contactera pour le paiement et l'activation.
                </p>
              </motion.div>
            )}

            {/* Existing promotions */}
            {promotions.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune promotion active. Créez votre première promotion !</p>
              </div>
            ) : (
              promotions.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-foreground">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {p.type} · {Number(p.price_mad).toLocaleString()} MAD ·
                        Du {new Date(p.starts_at).toLocaleDateString("fr-FR")} au {new Date(p.ends_at).toLocaleDateString("fr-FR")}
                      </p>
                      {p.status === "active" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          👁 {p.impressions || 0} vues · 🖱 {p.clicks || 0} clics
                        </p>
                      )}
                    </div>
                    {statusBadge(p.status)}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Profil de l'école</h2>
                <p className="text-sm text-muted-foreground mt-1">Ces informations sont visibles par tous les étudiants.</p>
              </div>
              <div className="flex gap-2">
                {editingProfile ? (
                  <>
                    <Button onClick={saveProfile} disabled={profileLoading} className="rounded-xl gap-2">
                      {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Sauvegarder
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)} className="rounded-xl">Annuler</Button>
                  </>
                ) : (
                  <Button onClick={() => setEditingProfile(true)} variant="outline" className="rounded-xl gap-2">
                    <Settings className="w-4 h-4" /> Modifier
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
              {[
                { key: "name", label: "Nom de l'école", type: "input" },
                { key: "description", label: "Description", type: "textarea" },
                { key: "address", label: "Adresse", type: "input" },
                { key: "phone", label: "Téléphone", type: "input" },
                { key: "email", label: "Email", type: "input" },
                { key: "website", label: "Site web", type: "input" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground mb-1 block">{field.label}</label>
                  {editingProfile ? (
                    field.type === "textarea" ? (
                      <Textarea
                        value={profileForm[field.key] || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                        className="rounded-xl"
                      />
                    ) : (
                      <Input
                        value={profileForm[field.key] || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                        className="rounded-xl"
                      />
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {profileForm[field.key] || <span className="italic">Non renseigné</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Verification status */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${school.is_verified ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
              <Shield className={`w-5 h-5 flex-shrink-0 ${school.is_verified ? "text-green-600" : "text-yellow-600"}`} />
              <div>
                <p className={`text-sm font-semibold ${school.is_verified ? "text-green-800" : "text-yellow-800"}`}>
                  {school.is_verified ? "École vérifiée par EtudAfrik ✓" : "Vérification en attente"}
                </p>
                <p className={`text-xs ${school.is_verified ? "text-green-700" : "text-yellow-700"}`}>
                  {school.is_verified
                    ? "Votre école affiche le badge de vérification officiel."
                    : "Contactez contact@etudafrik.com pour obtenir la vérification."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SchoolDashboard;