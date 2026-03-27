import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const schools = [
  { name: "Sup de Co Marrakech", city: "Marrakech", domain: "Ingénierie/Commerce", rating: 4.7, students: 1000, tuition: "45 000 MAD/an" },
  { name: "EMSI Casablanca", city: "Casablanca", domain: "Informatique & IA", rating: 4.5, students: 3500, tuition: "55 000 MAD/an" },
  { name: "UIR Rabat", city: "Rabat", domain: "Business & Tech", rating: 4.8, students: 5000, tuition: "70 000 MAD/an" },
  { name: "Sup'Management Fès", city: "Fès", domain: "Commerce", rating: 4.3, students: 800, tuition: "38 000 MAD/an" },
];

const SchoolsPreviewSection = () => {
  return (
    <section id="ecoles" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Explorer</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3">
              Écoles <span className="text-gradient">populaires</span>
            </h2>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary/80 gap-2 self-start md:self-auto">
            Voir toutes les écoles <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {schools.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
            >
              <div className="h-32 bg-hero-gradient opacity-80 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary-foreground/60" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {s.city}
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-3">
                  {s.domain}
                </span>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-semibold text-foreground">{s.rating}</span>
                  </div>
                  <span className="text-muted-foreground">{s.tuition}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchoolsPreviewSection;
