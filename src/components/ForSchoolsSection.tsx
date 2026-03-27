import { motion } from "framer-motion";
import { TrendingUp, Eye, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Eye, title: "Visibilité internationale", description: "Atteignez des milliers d'étudiants africains à la recherche d'écoles au Maroc." },
  { icon: Users, title: "Recrutement ciblé", description: "Recevez des candidatures qualifiées d'étudiants motivés et correspondant à vos programmes." },
  { icon: TrendingUp, title: "Analytics détaillés", description: "Suivez les performances de votre profil et optimisez votre stratégie de recrutement." },
];

const ForSchoolsSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pour les écoles</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-6">
              Attirez les meilleurs <span className="text-gradient">talents africains</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Rejoignez EtudAfrik et donnez à votre école une visibilité auprès de milliers d'étudiants africains. Notre plateforme connecte vos programmes aux candidats les plus motivés.
            </p>
            <Button size="lg" className="bg-hero-gradient text-primary-foreground shadow-warm hover:opacity-90 rounded-xl gap-2">
              Inscrire mon école <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <div className="space-y-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex gap-5 p-6 rounded-2xl bg-card border border-border shadow-card"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-hero-gradient flex items-center justify-center">
                  <b.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForSchoolsSection;
