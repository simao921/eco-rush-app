import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Leaf, ArrowRight, Trophy, Zap, Recycle, Sparkles, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useClassroom } from "@/lib/classroomContext.jsx";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Home() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { enterClassroom } = useClassroom();
  const navigate = useNavigate();

  const { data: newsPosts = [] } = useQuery({
    queryKey: ["newsPosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NewsPost')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "6" || e.key === "&")) {
        e.preventDefault();
        navigate("/admin", { state: { fromShortcut: true } });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const handleEnter = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const { data: classrooms, error } = await supabase
      .from('Classroom')
      .select('*')
      .eq('access_code', code.trim().toUpperCase());
    
    setLoading(false);
    if (error || !classrooms || classrooms.length === 0) {
      toast.error("Código não encontrado. Verifica e tenta novamente.");
      return;
    }
    enterClassroom(classrooms[0]);
    navigate("/turma");
  };

  const features = [
    { icon: Zap, title: "Regista ações", desc: "Ganha pontos por comportamentos ecológicos no dia-a-dia", color: "from-yellow-400/20 to-yellow-500/10", iconColor: "text-yellow-500" },
    { icon: Trophy, title: "Compete", desc: "Ranking ao vivo entre todas as turmas da escola", color: "from-primary/20 to-primary/10", iconColor: "text-primary" },
    { icon: Recycle, title: "Transforma", desc: "Cria hábitos verdes e faz a diferença no planeta", color: "from-teal-400/20 to-teal-500/10", iconColor: "text-teal-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-teal-400/10 blur-[80px]" />
        <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-yellow-400/8 blur-[70px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">Eco Rush</span>
        </div>
        <Link to="/ranking">
          <Button variant="ghost" size="sm" className="gap-2 font-body text-muted-foreground hover:text-foreground">
            <Trophy className="h-4 w-4" /> Ranking
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto"
        >
          {/* Icon hero */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative mx-auto mb-8 w-fit"
          >
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
              <Leaf className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-yellow-900" />
            </div>
          </motion.div>

          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Eco Rush
          </h1>
          <p className="font-body text-muted-foreground text-lg mb-2">
            Sistema de Pontos Eco-Escolas
          </p>
          <p className="font-body text-muted-foreground/70 text-sm mb-10">
            Compete com a tua turma e conquista o planeta 🌿
          </p>

          {/* Access form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-xl shadow-black/5 max-w-sm mx-auto mb-8"
          >
            <p className="text-sm font-body font-medium text-muted-foreground mb-4 text-center">
              Insere o código da tua turma
            </p>
            <form onSubmit={handleEnter} className="space-y-3">
              <Input
                placeholder="Ex: ECO-7A-4921"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-heading text-center tracking-widest uppercase text-base h-12 border-border/80 bg-background/60"
              />
              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-11 gap-2 text-base font-heading bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-lg shadow-primary/20"
              >
                {loading ? "A verificar..." : "Entrar na turma"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>

          <Link to="/ranking" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-body group">
            <Trophy className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Ver Ranking Global
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-16 w-full"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className={`rounded-2xl bg-gradient-to-br ${f.color} border border-border/40 p-5 text-center backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="h-12 w-12 rounded-2xl bg-card/80 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              </div>
              <h3 className="font-heading font-bold text-sm mb-1">{f.title}</h3>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* News section */}
        {newsPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="max-w-2xl mx-auto mt-10 w-full"
          >
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-primary" />
              <h2 className="font-heading font-bold text-sm">Notícias</h2>
            </div>
            <div className="space-y-3">
              {newsPosts.map((post) => (
                <Link key={post.id} to={`/noticias/${post.id}`}>
                  <div className={`rounded-2xl border p-4 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-colors cursor-pointer ${post.pinned ? "border-primary/30 bg-primary/5" : "border-border/50"}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl leading-none mt-0.5">{post.emoji || "📢"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm text-foreground line-clamp-1">{post.title}</p>
                        <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>
                        <p className="font-body text-xs text-muted-foreground/60 mt-1">
                          {format(new Date(post.created_date), "d MMM yyyy", { locale: pt })}
                        </p>
                      </div>
                      {post.pinned && <span className="text-xs text-primary font-body font-medium shrink-0">📌</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 text-center py-6 border-t border-border/40">
        <p className="text-xs text-muted-foreground/60 font-body">
          Eco Rush • Projeto Eco-Escolas 2025/2026
        </p>
      </footer>
    </div>
  );
}