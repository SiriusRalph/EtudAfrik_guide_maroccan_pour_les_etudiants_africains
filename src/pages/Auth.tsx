import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles, BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();

  // ── Role-based redirect after login ───────────────────────────────────────
  const redirectByRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = roles?.map((r: any) => r.role) || [];

    if (roleList.includes("admin")) {
      navigate("/admin");
    } else if (roleList.includes("school_admin")) {
      navigate("/school-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Connexion réussie !");
          // Get user then redirect by role
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await redirectByRole(user.id);
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) toast.error(error.message);
        else toast.success("Inscription réussie ! Vérifiez votre email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-foreground relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 bg-hero-gradient opacity-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/5 translate-y-1/3 -translate-x-1/3" />

        <div className="relative max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-4xl italic text-background mb-4 leading-tight">
            Trouvez votre école idéale au Maroc
          </h1>
          <p className="text-background/50 leading-relaxed mb-12">
            EtudAfrik connecte les étudiants africains aux meilleures institutions éducatives marocaines grâce à l'intelligence artificielle.
          </p>
          <div className="space-y-6">
            {[
              { icon: Sparkles, text: "Recommandations IA personnalisées" },
              { icon: BookOpen, text: "+500 écoles et programmes répertoriés" },
              { icon: Globe, text: "Étudiants de 30+ pays africains" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-background/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">EtudAfrik</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-display text-3xl italic text-foreground mb-1">
                {isLogin ? "Bon retour" : "Créer un compte"}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {isLogin ? "Connectez-vous pour accéder à votre espace." : "Rejoignez EtudAfrik et trouvez votre école."}
              </p>

              {/* Social buttons */}
              <div className="flex gap-3 mb-6">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl gap-2 text-sm" onClick={signInWithGoogle}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl gap-2 text-sm" onClick={signInWithApple}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 pl-10 rounded-xl" required />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10 rounded-xl" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 rounded-xl"
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-sm gap-2 mt-2">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{isLogin ? "Se connecter" : "S'inscrire"} <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                <button onClick={() => setIsLogin(!isLogin)} className="text-foreground font-semibold ml-1 hover:underline">
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;