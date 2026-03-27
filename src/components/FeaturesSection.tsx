import { motion } from "framer-motion";
import { Brain, BarChart3, MessageCircle, Shield, Users, Globe } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Recommandation IA",
    description: "L'IA analyse ton profil et te recommande les écoles les plus adaptées à tes objectifs.",
  },
  {
    icon: BarChart3,
    title: "Comparaison détaillée",
    description: "Compare les programmes, frais de scolarité et avis pour faire le meilleur choix.",
  },
  {
    icon: MessageCircle,
    title: "Chatbot intelligent",
    description: "Pose tes questions à notre assistant IA et obtiens des réponses instantanées.",
  },
  {
    icon: Shield,
    title: "Informations fiables",
    description: "Données vérifiées et mises à jour régulièrement pour une orientation en confiance.",
  },
  {
    icon: Users,
    title: "Avis d'étudiants",
    description: "Lis les témoignages d'étudiants africains déjà au Maroc pour mieux te préparer.",
  },
  {
    icon: Globe,
    title: "Accompagnement complet",
    description: "De la recherche d'école à l'inscription, on t'accompagne à chaque étape.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="ia" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pourquoi EtudAfrik ?</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Une plateforme pensée pour <span className="text-gradient">toi</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout ce dont tu as besoin pour étudier au Maroc, en un seul endroit.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
