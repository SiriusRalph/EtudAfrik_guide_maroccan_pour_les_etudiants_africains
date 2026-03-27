import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Accueil", href: "#" },
  { label: "Écoles", href: "#ecoles" },
  { label: "Comment ça marche", href: "#comment" },
  { label: "IA Assistant", href: "#ia" },
  { label: "Témoignages", href: "#temoignages" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-hero-gradient flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display text-foreground">EtudAfrik</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-hero-gradient text-primary-foreground shadow-warm hover:opacity-90">Mon espace</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Connexion</Button></Link>
              <Link to="/auth"><Button size="sm" className="bg-hero-gradient text-primary-foreground shadow-warm hover:opacity-90">S'inscrire</Button></Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <div className="flex flex-col gap-4 px-4 py-6">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              ))}
              {user ? (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button size="sm" className="bg-hero-gradient text-primary-foreground shadow-warm w-full">Mon espace</Button>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button size="sm" className="bg-hero-gradient text-primary-foreground shadow-warm w-full">S'inscrire</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
