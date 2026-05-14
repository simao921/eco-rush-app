import React from "react";
import { useLocation } from "react-router-dom";
import PageNotFound from "@/lib/PageNotFound";
import EcoHeader from "@/components/eco/EcoHeader";
import AdminClassrooms from "@/components/admin/AdminClassrooms";
import AdminAdjust from "@/components/admin/AdminAdjust";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminImpact from "@/components/admin/AdminImpact";
import AdminReportPDF from "@/components/admin/AdminReportPDF";
import AdminVideoHistory from "@/components/admin/AdminVideoHistory";
import AdminNews from "@/components/admin/AdminNews";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, SlidersHorizontal, CalendarDays, BarChart2, FileDown, Video, Newspaper, History } from "lucide-react";
import { motion } from "framer-motion";

export default function Admin() {
  const location = useLocation();
  const [password, setPassword] = React.useState("");
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return sessionStorage.getItem("eco_admin_auth") === "true";
  });
  
  const MASTER_PASSWORD = "eco-professor-2024"; // Recomenda-se mudar isto ou usar env var

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("eco_admin_auth", "true");
    } else {
      alert("Palavra-passe incorreta!");
    }
  };

  if (!isAuthenticated && !location.state?.fromShortcut) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold">Acesso Restrito</h1>
            <p className="text-sm text-muted-foreground font-body">Insere a senha de professor para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border bg-background font-body focus:ring-2 focus:ring-primary/20 outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full h-12 bg-primary text-white font-heading font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              Entrar no Painel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EcoHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading text-3xl font-bold">Painel Professor</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Gerir turmas, validar ações e ajustar pontos
          </p>
        </motion.div>

        <Tabs defaultValue="classrooms" className="w-full">
          <TabsList className="w-full grid grid-cols-8">
            <TabsTrigger value="classrooms" className="gap-1 font-body text-[10px]">
              <Users className="h-3 w-3" /> <span className="hidden sm:inline">Turmas</span>
            </TabsTrigger>
            <TabsTrigger value="adjust" className="gap-1 font-body text-[10px]">
              <SlidersHorizontal className="h-3 w-3" /> <span className="hidden sm:inline">Ajustar</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1 font-body text-[10px]">
              <CalendarDays className="h-3 w-3" /> <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="gap-1 font-body text-[10px]">
              <BarChart2 className="h-3 w-3" /> <span className="hidden sm:inline">Impacto</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1 font-body text-[10px]">
              <FileDown className="h-3 w-3" /> <span className="hidden sm:inline">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-1 font-body text-[10px]">
              <Video className="h-3 w-3" /> <span className="hidden sm:inline">Vídeos</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1 font-body text-[10px]">
              <Newspaper className="h-3 w-3" /> <span className="hidden sm:inline">Notícias</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 font-body text-[10px]">
              <History className="h-3 w-3" /> <span className="hidden sm:inline">Segur.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classrooms" className="mt-4">
            <AdminClassrooms />
          </TabsContent>


          <TabsContent value="adjust" className="mt-4">
            <AdminAdjust />
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <AdminEvents />
          </TabsContent>

          <TabsContent value="impact" className="mt-4">
            <AdminImpact />
          </TabsContent>

          <TabsContent value="report" className="mt-4">
            <AdminReportPDF />
          </TabsContent>
          <TabsContent value="videos" className="mt-4">
            <AdminVideoHistory />
          </TabsContent>
          <TabsContent value="news" className="mt-4">
            <AdminNews />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AdminAuditLogs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
