import { GraduationCap } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-hero-gradient flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display">EtudAfrik</span>
            </div>
            <p className="text-secondary-foreground/60 text-sm leading-relaxed">
              La plateforme intelligente qui connecte les étudiants africains aux meilleures écoles au Maroc.
            </p>
          </div>

          {[
            { title: "Plateforme", links: ["Rechercher", "Comparer", "Assistant IA", "Avis"] },
            { title: "Écoles", links: ["Inscrire une école", "Publicité", "Partenariats", "Analytics"] },
            { title: "Support", links: ["FAQ", "Contact", "WhatsApp", "Blog"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-bold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/40">
          <span>© 2026 EtudAfrik. Tous droits réservés.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-secondary-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-secondary-foreground transition-colors">Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
