import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const countries = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Guinée", "Mali", "Burkina Faso",
  "Bénin", "Togo", "Congo", "RDC", "Gabon", "Niger", "Tchad", "Madagascar",
  "Comores", "Mauritanie", "Djibouti", "Autre",
];

const fields = [
  "Informatique & IA", "Commerce & Management", "Ingénierie", "Médecine & Santé",
  "Droit", "Design & Architecture", "Sciences", "Communication", "Autre",
];

const educationLevels = ["Baccalauréat", "Licence (Bac+3)", "Master (Bac+5)", "Doctorat", "Autre"];

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    country: "",
    city: "",
    phone: "",
    education_level: "",
    desired_field: "",
    desired_city: "",
    budget_min: "",
    budget_max: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            country: data.country || "",
            city: data.city || "",
            phone: data.phone || "",
            education_level: data.education_level || "",
            desired_field: data.desired_field || "",
            desired_city: data.desired_city || "",
            budget_min: data.budget_min?.toString() || "",
            budget_max: data.budget_max?.toString() || "",
            bio: data.bio || "",
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      country: profile.country,
      city: profile.city,
      phone: profile.phone,
      education_level: profile.education_level,
      desired_field: profile.desired_field,
      desired_city: profile.desired_city,
      budget_min: profile.budget_min ? parseInt(profile.budget_min) : null,
      budget_max: profile.budget_max ? parseInt(profile.budget_max) : null,
      bio: profile.bio,
    }).eq("user_id", user.id);

    if (error) toast.error(error.message);
    else toast.success("Profil mis à jour !");
    setLoading(false);
  };

  const update = (key: string, value: string) => setProfile({ ...profile, [key]: value });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-bold text-foreground">Mon Profil</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-hero-gradient flex items-center justify-center text-primary-foreground">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{profile.full_name || "Mon Profil"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Personal info */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <h3 className="font-bold text-foreground">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nom complet</label>
                <Input value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Pays d'origine</label>
                <select
                  value={profile.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Ville</label>
                <Input value={profile.city} onChange={(e) => update("city", e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Téléphone</label>
                <Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Academic info */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <h3 className="font-bold text-foreground">Informations académiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Niveau d'études</label>
                <select
                  value={profile.education_level}
                  onChange={(e) => update("education_level", e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {educationLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Domaine souhaité</label>
                <select
                  value={profile.desired_field}
                  onChange={(e) => update("desired_field", e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Ville souhaitée au Maroc</label>
                <Input value={profile.desired_city} onChange={(e) => update("desired_city", e.target.value)} placeholder="Ex: Casablanca" className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <h3 className="font-bold text-foreground">Budget annuel (MAD)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Minimum</label>
                <Input type="number" value={profile.budget_min} onChange={(e) => update("budget_min", e.target.value)} placeholder="20000" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Maximum</label>
                <Input type="number" value={profile.budget_max} onChange={(e) => update("budget_max", e.target.value)} placeholder="80000" className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <h3 className="font-bold text-foreground">Bio</h3>
            <Textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Parle-nous de toi..." className="rounded-xl" />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full h-12 bg-hero-gradient text-primary-foreground shadow-warm rounded-xl gap-2 text-base">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
