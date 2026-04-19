import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Home, ShoppingBag, Bus, Phone, AlertCircle, CheckCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const cities = [
  {
    name: "Casablanca",
    emoji: "🏙️",
    description: "Capitale économique du Maroc, ville la plus animée.",
    budget: { min: 4500, max: 7000 },
    logement: { min: 2500, max: 4500 },
    nourriture: { min: 1000, max: 1500 },
    transport: { min: 300, max: 600 },
    quartiers: [
      { nom: "Maarif", desc: "Quartier moderne, proche des écoles privées, cafés et restaurants", budget: "Moyen-élevé" },
      { nom: "Hay Hassani", desc: "Quartier résidentiel calme, bien desservi, prix abordables", budget: "Abordable" },
      { nom: "Ain Chock", desc: "Quartier étudiant populaire, proche de plusieurs universités", budget: "Abordable" },
      { nom: "Anfa", desc: "Quartier huppé, proche de la mer, cadre agréable", budget: "Élevé" },
    ],
    conseils: [
      "Utilisez le tramway — abonnement mensuel ~200 MAD",
      "Mangez dans les restaurants locaux pour 30-50 MAD le repas",
      "Marché Maarif pour faire vos courses moins cher",
      "Evitez les quartiers touristiques pour le logement",
    ],
    contacts: [
      { nom: "Urgences", tel: "15" },
      { nom: "Police", tel: "19" },
      { nom: "ONCF (Train)", tel: "0890 20 30 40" },
    ]
  },
  {
    name: "Rabat",
    emoji: "🏛️",
    description: "Capitale administrative, ville universitaire par excellence.",
    budget: { min: 3500, max: 6000 },
    logement: { min: 2000, max: 4000 },
    nourriture: { min: 900, max: 1400 },
    transport: { min: 250, max: 500 },
    quartiers: [
      { nom: "Agdal", desc: "Quartier étudiant animé, proche des grandes écoles", budget: "Moyen" },
      { nom: "Hassan", desc: "Centre-ville, bien situé, accès facile à tout", budget: "Moyen" },
      { nom: "Hay Riad", desc: "Quartier résidentiel moderne et sécurisé", budget: "Élevé" },
      { nom: "Akkari", desc: "Quartier abordable, bien desservi par les transports", budget: "Abordable" },
    ],
    conseils: [
      "Le tramway est le meilleur moyen de transport — 6 MAD le trajet",
      "La médina propose des logements traditionnels pas chers",
      "Restaurants universitaires à prix très bas pour étudiants",
      "Bibliothèque nationale gratuite pour les étudiants",
    ],
    contacts: [
      { nom: "Urgences", tel: "15" },
      { nom: "Police", tel: "19" },
      { nom: "Tramway Rabat", tel: "0537 71 97 97" },
    ]
  },
  {
    name: "Marrakech",
    emoji: "🌴",
    description: "Ville culturelle et touristique, cadre de vie agréable.",
    budget: { min: 3000, max: 5500 },
    logement: { min: 1800, max: 3500 },
    nourriture: { min: 800, max: 1300 },
    transport: { min: 200, max: 400 },
    quartiers: [
      { nom: "Guéliz", desc: "Quartier moderne, commerces, restaurants, vie nocturne", budget: "Moyen" },
      { nom: "Hivernage", desc: "Quartier chic et calme, proche du centre", budget: "Élevé" },
      { nom: "Daoudiate", desc: "Quartier résidentiel calme, prix abordables", budget: "Abordable" },
      { nom: "M'hamid", desc: "Quartier populaire, très abordable pour étudiants", budget: "Très abordable" },
    ],
    conseils: [
      "Les petits taxis sont très abordables en ville",
      "Évitez les restaurants de la place Jemaa el-Fna — trop chers",
      "Marchés locaux (souks) pour faire vos courses",
      "Ville agréable mais plus touristique — négociez les prix",
    ],
    contacts: [
      { nom: "Urgences", tel: "15" },
      { nom: "Police", tel: "19" },
      { nom: "CTM Bus", tel: "0522 54 10 10" },
    ]
  },
  {
    name: "Fès",
    emoji: "🕌",
    description: "Ville étudiante historique, la moins chère du Maroc.",
    budget: { min: 2500, max: 4500 },
    logement: { min: 1500, max: 3000 },
    nourriture: { min: 700, max: 1200 },
    transport: { min: 150, max: 350 },
    quartiers: [
      { nom: "Ville Nouvelle", desc: "Quartier moderne, proche des grandes écoles privées", budget: "Moyen" },
      { nom: "Atlas", desc: "Quartier universitaire, idéal pour étudiants", budget: "Abordable" },
      { nom: "Narjiss", desc: "Quartier résidentiel calme et sécurisé", budget: "Moyen" },
      { nom: "Médina", desc: "Logements traditionnels à prix très bas", budget: "Très abordable" },
    ],
    conseils: [
      "Ville la moins chère du Maroc pour les étudiants",
      "Restaurants universitaires excellents et très abordables",
      "Bus urbains à moins de 5 MAD le trajet",
      "Ambiance étudiante très forte — bonne communauté africaine",
    ],
    contacts: [
      { nom: "Urgences", tel: "15" },
      { nom: "Police", tel: "19" },
      { nom: "Gare ONCF Fès", tel: "0535 93 03 33" },
    ]
  },
  {
    name: "Tanger",
    emoji: "⚓",
    description: "Ville du détroit, porte entre l'Afrique et l'Europe.",
    budget: { min: 3000, max: 5000 },
    logement: { min: 1800, max: 3500 },
    nourriture: { min: 800, max: 1300 },
    transport: { min: 200, max: 400 },
    quartiers: [
      { nom: "Malabata", desc: "Quartier moderne bord de mer, calme et agréable", budget: "Moyen-élevé" },
      { nom: "Moujahidine", desc: "Quartier résidentiel populaire, bien situé", budget: "Abordable" },
      { nom: "Val Fleuri", desc: "Quartier familial calme, proche des écoles", budget: "Moyen" },
      { nom: "Beni Makada", desc: "Quartier populaire, très abordable", budget: "Très abordable" },
    ],
    conseils: [
      "Ville en plein développement — beaucoup d'opportunités",
      "Proche de l'Europe — facilite les voyages",
      "Bus urbains bien développés",
      "Communauté africaine grandissante",
    ],
    contacts: [
      { nom: "Urgences", tel: "15" },
      { nom: "Police", tel: "19" },
      { nom: "Gare Tanger Ville", tel: "0539 93 16 01" },
    ]
  },
];

const visaSteps = [
  { step: "1", title: "Lettre d'admission", desc: "Obtenez votre lettre d'admission officielle de l'école au Maroc" },
  { step: "2", title: "Dossier consulaire", desc: "Préparez : passeport, photos, justificatif de ressources, extrait de naissance" },
  { step: "3", title: "Ambassade du Maroc", desc: "Déposez votre dossier à l'ambassade du Maroc dans votre pays" },
  { step: "4", title: "Visa étudiant", desc: "Délai moyen : 2 à 4 semaines. Valable 1 an renouvelable" },
  { step: "5", title: "Carte de séjour", desc: "À votre arrivée, faites votre carte de séjour au commissariat local" },
];

const Guide = () => {
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [activeSection, setActiveSection] = useState<"budget" | "quartiers" | "conseils" | "visa" | "contacts">("budget");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground text-sm">Guide de l'étudiant africain au Maroc</h1>
            <p className="text-xs text-muted-foreground">Tout ce qu'il faut savoir pour bien s'installer</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 rounded-2xl bg-hero-gradient text-primary-foreground shadow-warm">
          <div className="text-2xl mb-2">🎓</div>
          <h2 className="font-display text-2xl italic mb-2">Bienvenue au Maroc !</h2>
          <p className="text-primary-foreground/80 text-sm">
            Ce guide a été préparé spécialement pour les étudiants africains. Toutes les informations dont vous avez besoin pour bien démarrer votre vie étudiante au Maroc.
          </p>
        </motion.div>

        {/* City selector */}
        <div className="mb-6">
          <h3 className="font-bold text-foreground mb-3">Choisissez votre ville</h3>
          <div className="flex gap-2 flex-wrap">
            {cities.map((city) => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCity.name === city.name
                    ? "bg-primary text-primary-foreground shadow-warm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {city.emoji} {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* City info */}
        <motion.div key={selectedCity.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h3 className="font-bold text-foreground text-lg mb-1">{selectedCity.emoji} {selectedCity.name}</h3>
            <p className="text-muted-foreground text-sm">{selectedCity.description}</p>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap">
            {[
              { key: "budget", label: "💰 Budget" },
              { key: "quartiers", label: "🏘️ Quartiers" },
              { key: "conseils", label: "💡 Conseils" },
              { key: "visa", label: "📋 Visa" },
              { key: "contacts", label: "📞 Contacts" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === s.key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Budget section */}
          {activeSection === "budget" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" /> Budget mensuel estimé
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Budget total", min: selectedCity.budget.min, max: selectedCity.budget.max, icon: "💰" },
                    { label: "Logement", min: selectedCity.logement.min, max: selectedCity.logement.max, icon: "🏠" },
                    { label: "Nourriture", min: selectedCity.nourriture.min, max: selectedCity.nourriture.max, icon: "🍽️" },
                    { label: "Transport", min: selectedCity.transport.min, max: selectedCity.transport.max, icon: "🚌" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/50">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <div className="font-bold text-foreground text-sm">
                        {item.min.toLocaleString()} — {item.max.toLocaleString()} MAD
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">
                    Le coût de la vie au Maroc est 55% moins cher qu'en France. Avec une bonne gestion, vous pouvez vivre confortablement.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quartiers section */}
          {activeSection === "quartiers" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {selectedCity.quartiers.map((q, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card border border-border shadow-card flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{q.nom}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        q.budget === "Très abordable" ? "bg-green-100 text-green-700" :
                        q.budget === "Abordable" ? "bg-blue-100 text-blue-700" :
                        q.budget === "Moyen" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{q.budget}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Conseils section */}
          {activeSection === "conseils" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  💡 Conseils pratiques pour {selectedCity.name}
                </h4>
                <div className="space-y-3">
                  {selectedCity.conseils.map((c, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  <strong>Conseil important :</strong> Rejoignez les groupes WhatsApp d'étudiants africains de votre ville dès votre arrivée. La communauté est très solidaire et vous aidera à vous installer.
                </p>
              </div>
            </motion.div>
          )}

          {/* Visa section */}
          {activeSection === "visa" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Démarches visa étudiant
                </h4>
                <div className="space-y-4">
                  {visaSteps.map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground text-sm">{step.title}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <strong>Important :</strong> Les ressortissants de certains pays africains n'ont pas besoin de visa pour le Maroc. Vérifiez auprès de l'ambassade du Maroc dans votre pays.
                </p>
              </div>
            </motion.div>
          )}

          {/* Contacts section */}
          {activeSection === "contacts" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Numéros utiles à {selectedCity.name}
                </h4>
                <div className="space-y-3">
                  {selectedCity.contacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <span className="text-sm text-foreground font-medium">{c.nom}</span>
                      <a href={`tel:${c.tel}`} className="text-primary font-bold text-sm">{c.tel}</a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
                <h4 className="font-bold text-foreground mb-4">🆘 Contacts EtudAfrik</h4>
                <div className="space-y-3">
                  {[
                    { label: "Support Email", value: "contact@etudafrik.com" },
                    { label: "WhatsApp", value: "+212 600 000 000" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <span className="text-sm text-foreground font-medium">{c.label}</span>
                      <span className="text-primary font-bold text-sm">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Guide;