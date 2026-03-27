import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, BookOpen, GraduationCap, ArrowLeft,
  SlidersHorizontal, Users, Award, Sparkles, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const cities = ["Toutes", "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Ifrane"];
const categories = ["Tous", "engineering", "business", "university"];

const Schools = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [featuredSchools, setFeaturedSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Toutes");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);

      // Fetch featured/sponsored schools separately for the banner
      const { data: featured } = await supabase
        .from("schools")
        .select("*, programs(domain)")
        .eq("is_featured", true)
        .eq("is_verified", true)
        .limit(3);
      setFeaturedSchools(featured || []);

      // Fetch all schools with filters — featured always first
      let query = supabase
        .from("schools")
        .select("*, programs(domain)")
        .order("is_featured", { ascending: false })
        .order("satisfaction_score", { ascending: false });

      if (selectedCity !== "Toutes") query = query.eq("city", selectedCity);
      if (selectedCategory !== "Tous") query = query.eq("category", selectedCategory);
      if (search) query = query.ilike("name", `%${search}%`);

      const { data } = await query;
      setSchools(data || []);
      setLoading(false);
    };
    fetchSchools();
  }, [search, selectedCity, selectedCategory]);

  const activeFilters =
    (selectedCity !== "Toutes" ? 1 : 0) +
    (selectedCategory !== "Tous" ? 1 : 0);

  const categoryLabel = (c: string) => {
    const map: Record<string, string> = {
      engineering: "Ingénierie",
      business: "Business",
      university: "Université",
    };
    return map[c] || c;
  };

  const SchoolCard = ({ school, i, sponsored = false }: { school: any; i: number; sponsored?: boolean }) => {
    const uniqueDomains = [...new Set((school.programs || []).map((p: any) => p.domain))];
    return (
      <motion.div
        key={school.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03, duration: 0.3 }}
      >
        <Link
          to={`/schools/${school.slug}`}
          className={`group block rounded-2xl border bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
            sponsored
              ? "border-amber-300 ring-1 ring-amber-200"
              : "border-border"
          }`}
        >
          {/* Cover / Logo area */}
          <div className="h-36 relative overflow-hidden">
            {school.cover_url ? (
              <img
                src={school.cover_url}
                alt={school.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-hero-gradient" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Badges top-left */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {sponsored && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Sponsorisée
                </span>
              )}
              {school.is_verified && !sponsored && (
                <span className="px-2 py-0.5 rounded-full glass glass-border text-[10px] font-semibold text-white">
                  ✓ Vérifiée
                </span>
              )}
              {school.is_featured && !sponsored && (
                <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                  ⭐ Vedette
                </span>
              )}
            </div>

            {/* Category badge top-right */}
            {school.category && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full glass glass-border text-[10px] font-medium text-white capitalize">
                {categoryLabel(school.category)}
              </span>
            )}

            {/* Logo bottom-left */}
            {school.logo_url && (
              <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden">
                <img src={school.logo_url} alt={school.name} className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">
              {school.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {school.city}
              </span>
              {school.student_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {school.student_count.toLocaleString()}
                </span>
              )}
            </div>
            {school.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{school.description}</p>
            )}
            {uniqueDomains.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {uniqueDomains.slice(0, 3).map((d: string) => (
                  <span key={d} className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[11px] font-medium">
                    {d}
                  </span>
                ))}
                {uniqueDomains.length > 3 && (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px]">
                    +{uniqueDomains.length - 3}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="font-semibold text-foreground text-sm">
                  {school.satisfaction_score ? Number(school.satisfaction_score).toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="text-xs text-primary font-medium group-hover:underline">
                Voir les détails →
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une école..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="rounded-xl relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="container mx-auto px-4 py-4 border-t border-border/50 space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Ville</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCity(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCity === c
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Domaine</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === c
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c === "Tous" ? "Tous" : categoryLabel(c)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* ── SPONSORED BANNER (shown when no search/filter active) ── */}
        {!search && selectedCity === "Toutes" && selectedCategory === "Tous" && featuredSchools.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-foreground">Écoles Partenaires</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                SPONSORISÉ
              </span>
            </div>

            {/* Featured banner — horizontal scroll on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredSchools.map((school, i) => (
                <SchoolCard key={school.id} school={school} i={i} sponsored={true} />
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-8 mb-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">Toutes les écoles</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </section>
        )}

        {/* ── RESULTS HEADER ── */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl italic text-foreground">Écoles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {loading
                ? "Chargement..."
                : `${schools.length} école${schools.length > 1 ? "s" : ""} trouvée${schools.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground rounded-lg"
              onClick={() => { setSelectedCity("Toutes"); setSelectedCategory("Tous"); }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* ── SCHOOL GRID ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border animate-pulse">
                <div className="h-36 rounded-t-2xl bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-muted rounded-md" />
                  <div className="h-4 w-1/3 bg-muted rounded-md" />
                  <div className="h-4 w-full bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Aucune école trouvée</h3>
            <p className="text-muted-foreground text-sm mb-4">Essayez de modifier vos critères.</p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setSearch(""); setSelectedCity("Toutes"); setSelectedCategory("Tous"); }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schools.map((school, i) => (
              <SchoolCard key={school.id} school={school} i={i} sponsored={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schools;