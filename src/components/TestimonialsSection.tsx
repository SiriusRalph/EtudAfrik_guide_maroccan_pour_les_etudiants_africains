import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Amina Diallo",
    country: "🇸🇳 Sénégal",
    school: "EMSI Casablanca",
    text: "Grâce à EtudAfrik, j'ai trouvé l'école parfaite en quelques clics. L'assistant IA m'a vraiment aidée à faire le bon choix !",
    rating: 5,
  },
  {
    name: "Koffi Mensah",
    country: "🇨🇮 Côte d'Ivoire",
    school: "UIR Rabat",
    text: "Je ne connaissais rien au Maroc. La plateforme m'a permis de comparer les écoles et de lire des avis fiables. Je recommande !",
    rating: 5,
  },
  {
    name: "Fatou Camara",
    country: "🇬🇳 Guinée",
    school: "ENSA Marrakech",
    text: "L'accompagnement administratif m'a sauvé la vie. Sans EtudAfrik, j'aurais été complètement perdue dans mes démarches.",
    rating: 4,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="temoignages" className="py-24 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Témoignages</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-4">
            Ils ont choisi <span className="text-gradient">EtudAfrik</span>
          </h2>
          <p className="text-secondary-foreground/60 text-lg">
            Découvre les expériences d'étudiants qui ont trouvé leur école grâce à notre plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="p-8 rounded-2xl bg-secondary-foreground/5 border border-secondary-foreground/10"
            >
              <Quote className="w-8 h-8 text-primary mb-4" />
              <p className="text-secondary-foreground/80 leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < t.rating ? "text-accent fill-accent" : "text-secondary-foreground/20"}`} />
                ))}
              </div>
              <div>
                <div className="font-bold text-secondary-foreground">{t.name}</div>
                <div className="text-sm text-secondary-foreground/60">
                  {t.country} • {t.school}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
