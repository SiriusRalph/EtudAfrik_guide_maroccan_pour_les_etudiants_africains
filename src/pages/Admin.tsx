import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Users, School, Star, GraduationCap, CheckCircle, XCircle,
  Loader2, LogOut, BarChart3, Eye, Trash2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ADMIN_PASSWORD = "admin1234"; // Change this!

type Tab = "stats" | "enrollments" | "schools" | "reviews";

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [loading, setLoading] = useState(false);

  // Data
  const [stats, setStats] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadStats();
    } else {
      toast.error("Mot de passe incorrect");
    }
  };

  const loadStats = async () => {
    setLoading(true);
    const [
      { count: totalStudents },
      { count: totalSchools },
      { count: totalReviews },
      { count: totalEnrollments },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("schools").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
    ]);
    setStats({ totalStudents, totalSchools, totalReviews, totalEnrollments });
    setLoading(false);
  };

  const loadEnrollments = async () => {
  setLoading(true);
  
  // Fetch enrollments first
  const { data: enrollmentsData, error } = await supabase
    .from("enrollments")
    .select("*, schools(name, city)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("enrollments error:", error);
    setLoading(false);
    return;
  }

  // Fetch profiles separately
  const studentIds = [...new Set((enrollmentsData || []).map(e => e.student_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", studentIds);

  // Merge manually
  const profileMap: Record<string, any> = {};
  (profilesData || []).forEach(p => { profileMap[p.user_id] = p; });

  const merged = (enrollmentsData || []).map(e => ({
    ...e,
    profiles: profileMap[e.student_id] || null,
  }));

  console.log("merged enrollments:", merged);
  setEnrollments(merged);
  setLoading(false);
};

  const loadSchools = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("schools")
      .select("*, programs(count)")
      .order("created_at", { ascending: false });
    setSchools(data || []);
    setLoading(false);
  };

  const loadReviews = async () => {
  setLoading(true);

  const { data: reviewsData, error } = await supabase
    .from("reviews")
    .select("*, schools(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("reviews error:", error);
    setLoading(false);
    return;
  }

  // Fetch profiles separately
  const userIds = [...new Set((reviewsData || []).map(r => r.user_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);

  const profileMap: Record<string, any> = {};
  (profilesData || []).forEach(p => { profileMap[p.user_id] = p; });

  const merged = (reviewsData || []).map(r => ({
    ...r,
    profiles: profileMap[r.user_id] || null,
  }));

  setReviews(merged);
  setLoading(false);
};

  const updateEnrollmentStatus = async (id: string, status: string) => {
    await supabase.from("enrollments").update({ status }).eq("id", id);
    toast.success(`Inscription ${status === "confirmed" ? "confirmée" : "rejetée"}`);
    loadEnrollments();
  };

  const deleteReview = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Avis supprimé");
    loadReviews();
  };

  const toggleSchoolVerified = async (id: string, current: boolean) => {
    await supabase.from("schools").update({ is_verified: !current }).eq("id", id);
    toast.success(`École ${!current ? "vérifiée" : "non vérifiée"}`);
    loadSchools();
  };

  useEffect(() => {
    if (!authed) return;
    if (activeTab === "stats") loadStats();
    if (activeTab === "enrollments") loadEnrollments();
    if (activeTab === "schools") loadSchools();
    if (activeTab === "reviews") loadReviews();
  }, [activeTab, authed]);

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-warm">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl italic text-foreground">Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">EtudAfrik Dashboard</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <Input
              type="password"
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="rounded-xl"
            />
            <Button onClick={login} className="w-full rounded-xl bg-hero-gradient text-primary-foreground">
              Accéder au dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-hero-gradient flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAuthed(false)} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            {[
              { key: "stats" as Tab, label: "Stats", icon: BarChart3 },
              { key: "enrollments" as Tab, label: "Inscriptions", icon: GraduationCap },
              { key: "schools" as Tab, label: "Écoles", icon: School },
              { key: "reviews" as Tab, label: "Avis", icon: Star },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Stats */}
        {activeTab === "stats" && stats && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Étudiants", value: stats.totalStudents, color: "text-blue-500" },
              { icon: School, label: "Écoles", value: stats.totalSchools, color: "text-green-500" },
              { icon: Star, label: "Avis", value: stats.totalReviews, color: "text-yellow-500" },
              { icon: GraduationCap, label: "Inscriptions", value: stats.totalEnrollments, color: "text-purple-500" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border shadow-card"
              >
                <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
                <div className="text-3xl font-bold text-foreground">{s.value ?? "—"}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Enrollments */}
        {activeTab === "enrollments" && !loading && (
          <div className="space-y-3">
            <h2 className="font-bold text-foreground text-lg mb-4">
              Inscriptions ({enrollments.length})
            </h2>
            {enrollments.length === 0 && (
              <p className="text-muted-foreground text-center py-12">Aucune inscription pour le moment.</p>
            )}
            {enrollments.map((e) => (
              <div key={e.id} className="p-5 rounded-2xl bg-card border border-border shadow-card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-foreground">{e.profiles?.full_name || "Étudiant inconnu"}</div>
                  <div className="text-sm text-muted-foreground">{e.schools?.name} — {e.schools?.city}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(e.created_at).toLocaleDateString("fr-FR")} ·{" "}
                    <span className={`font-medium ${
                      e.status === "confirmed" ? "text-green-600" :
                      e.status === "rejected" ? "text-red-500" : "text-yellow-600"
                    }`}>
                      {e.status === "confirmed" ? "Confirmée" : e.status === "rejected" ? "Rejetée" : "En attente"}
                    </span>
                  </div>
                </div>
                {e.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateEnrollmentStatus(e.id, "confirmed")}
                      className="rounded-xl gap-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateEnrollmentStatus(e.id, "rejected")}
                      className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Schools */}
        {activeTab === "schools" && !loading && (
          <div className="space-y-3">
            <h2 className="font-bold text-foreground text-lg mb-4">
              Écoles ({schools.length})
            </h2>
            {schools.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl bg-card border border-border shadow-card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{s.name}</span>
                    {s.is_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{s.city} · {s.type}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.student_count?.toLocaleString() || 0} étudiants
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSchoolVerified(s.id, s.is_verified)}
                    className={`rounded-xl gap-1 ${s.is_verified ? "text-red-500 border-red-200" : "text-green-600 border-green-200"}`}
                  >
                    {s.is_verified ? <><XCircle className="w-4 h-4" /> Retirer vérification</> : <><CheckCircle className="w-4 h-4" /> Vérifier</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && !loading && (
          <div className="space-y-3">
            <h2 className="font-bold text-foreground text-lg mb-4">
              Avis ({reviews.length})
            </h2>
            {reviews.length === 0 && (
              <p className="text-muted-foreground text-center py-12">Aucun avis pour le moment.</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{r.profiles?.full_name || "Anonyme"}</span>
                      <span className="text-muted-foreground text-xs">→ {r.schools?.name}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                    {r.title && <div className="font-medium text-foreground text-sm mb-1">{r.title}</div>}
                    <p className="text-muted-foreground text-sm line-clamp-2">{r.comment}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteReview(r.id)}
                    className="text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;