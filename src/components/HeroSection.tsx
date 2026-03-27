import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroCampus from "@/assets/hero-campus.jpg";

const HeroSection = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate("/schools");
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroCampus} alt="Campus universitaire au Maroc" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
      </div>

      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Propulsé par l'Intelligence Artificielle
            </span>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-foreground leading-tight mb-6">
              Trouve ton école
              <br />
              <span className="text-gradient">au Maroc</span>
            </h1>

            <p className="text-lg md:text-xl text-secondary-foreground/80 mb-8 max-w-lg leading-relaxed">
              La plateforme intelligente qui aide les étudiants africains à trouver, comparer et choisir la meilleure école au Maroc.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                placeholder="Rechercher une école, une formation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-card text-card-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={handleSearch} size="lg" className="bg-hero-gradient text-primary-foreground shadow-warm hover:opacity-90 h-12 px-8 rounded-xl">
              Rechercher
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center gap-6 text-secondary-foreground/60 text-sm"
          >
            <span>🎓 500+ écoles</span>
            <span>🌍 30+ pays représentés</span>
            <span>⭐ 10 000+ avis</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
