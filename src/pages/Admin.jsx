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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, SlidersHorizontal, CalendarDays, BarChart2, FileDown, Video, Newspaper } from "lucide-react";
import { motion } from "framer-motion";

export default function Admin() {
  const location = useLocation();
  
  if (!location.state?.fromShortcut) {
    return <PageNotFound />;
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
          <TabsList className="w-full grid grid-cols-7">
            <TabsTrigger value="classrooms" className="gap-1 font-body text-xs">
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Turmas</span>
            </TabsTrigger>
            <TabsTrigger value="adjust" className="gap-1 font-body text-xs">
              <SlidersHorizontal className="h-4 w-4" /> <span className="hidden sm:inline">Ajustar</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1 font-body text-xs">
              <CalendarDays className="h-4 w-4" /> <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="gap-1 font-body text-xs">
              <BarChart2 className="h-4 w-4" /> <span className="hidden sm:inline">Impacto</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1 font-body text-xs">
              <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Relatório</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-1 font-body text-xs">
              <Video className="h-4 w-4" /> <span className="hidden sm:inline">Vídeos</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1 font-body text-xs">
              <Newspaper className="h-4 w-4" /> <span className="hidden sm:inline">Notícias</span>
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
        </Tabs>
      </main>
    </div>
  );
}
