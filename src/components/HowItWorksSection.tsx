import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "Crée ton profil", description: "Dis-nous ton domaine d'étude, ton budget et tes préférences." },
  { number: "02", title: "Reçois tes recommandations", description: "Notre IA analyse ton profil et te propose les meilleures écoles." },
  { number: "03", title: "Compare et choisis", description: "Compare les programmes, frais et avis d'étudiants en un clic." },
  { number: "04", title: "Inscris-toi facilement", description: "On t'accompagne dans toutes les démarches d'inscription." },
];

const HowItWorksSection = () => {
  return (
    <section id="comment" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Simple et rapide</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Comment ça <span className="text-gradient">marche ?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              <div className="text-6xl font-display font-bold text-gradient opacity-30 mb-4">{s.number}</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 w-12 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
