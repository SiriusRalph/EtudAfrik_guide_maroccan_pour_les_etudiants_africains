import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-hero-gradient p-12 md:p-20 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative">
            <Sparkles className="w-10 h-10 text-primary-foreground/80 mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
              Prêt à trouver ton école au Maroc ?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
              Rejoins des milliers d'étudiants qui ont déjà trouvé leur voie grâce à EtudAfrik.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-card text-foreground hover:bg-card/90 rounded-xl gap-2 text-base px-8">
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
