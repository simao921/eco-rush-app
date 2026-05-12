import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClassroom } from "@/lib/classroomContext.jsx";
import { Button } from "@/components/ui/button";
import { ACTION_TYPES, LEVEL_RULES } from "@/lib/ecoConstants";
import { computeApprovedStreak } from "@/lib/streak";
import EcoHeader from "@/components/eco/EcoHeader";
import PointsBadge from "@/components/eco/PointsBadge";
import ActionCard from "@/components/eco/ActionCard";
import ActionHistory from "@/components/eco/ActionHistory";
import VideoRecorder from "@/components/eco/VideoRecorder";
import CertificatePDF from "@/components/eco/CertificatePDF";
import ClassActionStats from "@/components/eco/ClassActionStats";
import StoriesFeed from "@/components/eco/StoriesFeed";
import StreakBanner from "@/components/eco/StreakBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, History, Zap, BarChart2, Globe, Flame } from "lucide-react";
import { motion } from "framer-motion";

// How many times each action can be registered per window (by turma)
const ACTION_LIMITS = {
  apanhar_lixo:            { max: 3, windowHours: 4 },
  reciclagem_correta:      { max: 2, windowHours: 24 },
  apagar_luzes:            { max: 2, windowHours: 24 },
  sala_limpa:              { max: 1, windowHours: 24 },
  reducao_desperdicio:     { max: 1, windowHours: 24 },
  participacao_acoes:      { max: 1, windowHours: 168 },
  iniciativas_espontaneas: { max: 1, windowHours: 168 },
};

function getUsedCount(actions = [], actionKey, windowHours) {
  if (!actions || !Array.isArray(actions)) return 0;
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  return actions.filter(
    (a) =>
      a.action_type === actionKey &&
      a.registered_by === "turma" &&
      a.status !== "rejeitada" &&
      new Date(a.created_date) >= since
  ).length;
}

export default function ClassDashboard() {
  const { classroom } = useClassroom();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [videoActionKey, setVideoActionKey] = useState(null);

  React.useEffect(() => {
    if (!classroom) navigate("/");
  }, [classroom, navigate]);

  const { data: freshClassroom } = useQuery({
    queryKey: ["classroom", classroom?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('Classroom').select('*').eq('id', classroom.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!classroom?.id,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["actions", classroom?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('EcoAction')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!classroom?.id,
  });

  // Real-time subscription
  React.useEffect(() => {
    if (!classroom?.id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Classroom', filter: `id=eq.${classroom.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["classroom", classroom.id] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'EcoAction', filter: `classroom_id=eq.${classroom.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["actions", classroom.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroom?.id, queryClient]);

  const handleActionClick = (actionKey) => {
    const actionDef = ACTION_TYPES[actionKey];
    if (actionDef.requiresVideo) {
      setVideoActionKey(actionKey);
    } else {
      registerMutation.mutate({ actionKey });
    }
  };

  const handleVideoRejected = async (aiResult) => {
    if (!videoActionKey) return;
    await supabase.from('EcoAction').insert([{
      classroom_id: classroom.id,
      classroom_name: classroom.name,
      action_type: videoActionKey,
      points: 0,
      status: "rejeitada",
      registered_by: "turma",
      ai_analysis: aiResult.reason,
      ai_valid: false,
      photo_url: aiResult.photo_url,
      video_url: aiResult.video_url,
    }]);
  };

  const handleVideoConfirmed = (aiResult) => {
    const key = videoActionKey;
    setVideoActionKey(null);
    registerMutation.mutate({ actionKey: key, aiResult });
  };

  const registerMutation = useMutation({
    mutationFn: async ({ actionKey, aiResult }) => {
      const actionDef = ACTION_TYPES[actionKey];
      
      const { data: newAction, error: actionErr } = await supabase.from('EcoAction').insert([{
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        action_type: actionKey,
        points: actionDef.points,
        status: "aprovada",
        registered_by: "turma"
      }]).select().single();

      if (actionErr) {
        window.alert("Erro ao criar ação: " + actionErr.message);
        throw actionErr;
      }

      // Tentar atualização direta simplificada
      const { data: live, error: liveErr } = await supabase
        .from('Classroom')
        .select('total_points, monthly_points')
        .eq('id', classroom.id)
        .single();
      
      if (liveErr) {
        window.alert("Erro ao ler pontos da BD: " + liveErr.message);
        throw liveErr;
      }

      const { data: updated, error: updErr } = await supabase
        .from('Classroom')
        .update({
          total_points:   (live.total_points || 0) + actionDef.points,
          monthly_points: (live.monthly_points || 0) + actionDef.points,
          updated_date:   new Date().toISOString()
        })
        .eq('id', classroom.id)
        .select();

      if (updErr) {
        window.alert("Erro ao gravar pontos: " + updErr.message);
        throw updErr;
      }

      if (!updated || updated.length === 0) {
        window.alert("Erro: A base de dados não permitiu gravar. Verificaste o RLS?");
        throw new Error("Zero rows updated");
      }

      const streakDay = computeApprovedStreak(actions, [newAction.created_date || new Date().toISOString()]);

      // Publish to global feed
      const feedMessages = {
        apanhar_lixo: `apanhou lixo do chão e ajudou a manter a escola limpa! 🗑️`,
        reciclagem_correta: `fez reciclagem correta e deu o exemplo! ♻️`,
        apagar_luzes: `lembrou-se de apagar as luzes ao sair. Pequenos gestos, grande impacto! 💡`,
        sala_limpa: `deixou a sala imaculada. Orgulho! ✨`,
        reducao_desperdicio: `reduziu o desperdício hoje. O planeta agradece! 🌍`,
        participacao_acoes: `participou numa ação ecológica especial! 🌿`,
        iniciativas_espontaneas: `teve uma iniciativa ecológica espontânea incrível! 🏆`,
      };
      
      const { error: feedErr } = await supabase.from('FeedPost').insert([{
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        action_type: actionKey,
        message: `A Turma ${classroom.name} ${feedMessages[actionKey] || "realizou uma ação ecológica!"}`,
        points_earned: actionDef.points,
        likes: 0,
        liked_by: [],
        reposts: 0,
        reposted_by: [],
        photo_url: aiResult?.photo_url || null,
        streak_day: streakDay,
        is_story: true,
      }]);

      if (feedErr) console.warn("Erro ao publicar no feed:", feedErr);
      return { newAction, pointsAdded: actionDef.points };
    },
    onSuccess: (result) => {
      // Forçar refetch imediato de tudo
      queryClient.refetchQueries({ queryKey: ["classroom", classroom.id] });
      queryClient.refetchQueries({ queryKey: ["actions", classroom.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      
      toast.success(`🚀 Ação registada! +${result.pointsAdded} pontos submetidos!`);
    },
    onError: (error) => {
      console.error("Erro ao registar a ação:", error);
      toast.error(`Erro ao submeter: ${error.message || "Tente novamente mais tarde"}`);
    },
  });

  if (!classroom) return null;

  const displayClassroom = freshClassroom || classroom;
  const approvedActions = actions.filter((a) => a.status === "aprovada");

  // Build action slots for each action type
  const actionSlots = Object.entries(ACTION_TYPES).map(([key, def]) => {
    const limit = ACTION_LIMITS[key];
    const rule = LEVEL_RULES[def.level];
    const usedCount = getUsedCount(actions, key, limit.windowHours);
    const remaining = Math.max(0, limit.max - usedCount);
    return { key, def, rule, limit, usedCount, remaining };
  });

  const directActions = actionSlots;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-teal-400/8 blur-[80px]" />
      </div>

      <EcoHeader />
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Botão de Teste Temporário */}
        <div className="flex justify-center mb-4">
          <Button 
            onClick={() => registerMutation.mutate({ actionKey: 'apagar_luzes', aiResult: { valid: true, reason: 'Teste manual', photo_url: null, video_url: null } })}
            variant="outline"
            className="bg-yellow-500/20 border-yellow-500 text-yellow-700 font-bold"
          >
            ⚠️ TESTE +1 PT (Clica aqui para testar a BD)
          </Button>
        </div>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-primary/15 via-teal-500/10 to-transparent border border-primary/20 p-6 text-center"
        >
          <p className="text-xs font-body text-muted-foreground mb-1 uppercase tracking-widest">Turma</p>
          <h1 className="font-heading text-4xl font-black text-foreground mb-1">
            {displayClassroom.name}
          </h1>
          <p className="text-xs text-muted-foreground font-body font-medium">
            {displayClassroom.access_code}
          </p>
        </motion.div>

        {/* Points badge */}
        <div className="flex justify-center py-2">
          <PointsBadge points={displayClassroom.total_points} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-primary/8 border border-primary/15 p-4 flex sm:flex-col items-center justify-between sm:justify-center text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body uppercase tracking-wider">Total Acumulado</p>
            <p className="font-heading font-black text-2xl text-primary">{displayClassroom.total_points || 0}</p>
          </div>
          <div className="rounded-2xl bg-secondary/10 border border-secondary/20 p-4 flex sm:flex-col items-center justify-between sm:justify-center text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body uppercase tracking-wider">Pontos Mensais</p>
            <p className="font-heading font-black text-2xl text-secondary">{displayClassroom.monthly_points || 0}</p>
          </div>
          <div className="rounded-2xl bg-teal-500/8 border border-teal-500/15 p-4 flex sm:flex-col items-center justify-between sm:justify-center text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body uppercase tracking-wider">Ações Validadas</p>
            <p className="font-heading font-black text-2xl text-teal-600">{approvedActions.length}</p>
          </div>
        </div>

        {/* Streak Banner */}
        <StreakBanner actions={actions} />

        {/* Certificate */}
        <CertificatePDF classroom={displayClassroom} points={displayClassroom.total_points || 0} />

        {/* Tabs */}
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-2xl p-1 bg-muted/60 h-14">
            <TabsTrigger value="register" className="flex flex-col sm:flex-row gap-1 py-1 px-0 font-body data-[state=active]:font-semibold h-full">
              <Zap className="h-4 w-4" /> <span className="text-[10px] sm:text-xs">Ações</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col sm:flex-row gap-1 py-1 px-0 font-body data-[state=active]:font-semibold h-full">
              <History className="h-4 w-4" />
              <span className="text-[10px] sm:text-xs">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex flex-col sm:flex-row gap-1 py-1 px-0 font-body data-[state=active]:font-semibold h-full">
              <BarChart2 className="h-4 w-4" /> <span className="text-[10px] sm:text-xs">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex flex-col sm:flex-row gap-1 py-1 px-0 font-body data-[state=active]:font-semibold h-full">
              <Globe className="h-4 w-4" /> <span className="text-[10px] sm:text-xs">Feed</span>
            </TabsTrigger>
          </TabsList>

          {/* === REGISTAR === */}
          <TabsContent value="register" className="mt-5 space-y-6">

            {/* Direct actions */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-bold text-sm">Ações automáticas</h3>
                <span className="text-xs text-muted-foreground font-body">(aprovadas na hora)</span>
              </div>
              {directActions.map(({ key, def, limit, usedCount, remaining }) => (
                <div key={key}>
                  {/* Render multiple slots if max > 1 */}
                  {Array.from({ length: limit.max }).map((_, slot) => {
                    const done = slot < usedCount;
                    return (
                      <div key={slot} className={slot > 0 ? "mt-2" : ""}>
                        <ActionCard
                          actionKey={key}
                          onRegister={done ? () => {} : handleActionClick}
                          disabled={registerMutation.isPending || done}
                          completed={done}
                        />
                      </div>
                    );
                  })}
                  {remaining === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-1 pl-2">
                      <Clock className="h-3 w-3" />
                      Limite atingido. Disponível novamente em {limit.windowHours < 24 ? `${limit.windowHours}h` : `${limit.windowHours / 24}d`}.
                    </div>
                  )}
                </div>
              ))}
            </section>


          </TabsContent>

          {/* === HISTÓRICO === */}
          <TabsContent value="history" className="mt-5 space-y-5">
            <section>
              <h3 className="font-heading font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                <Zap className="h-4 w-4" /> Aprovadas ({approvedActions.length})
              </h3>
              <ActionHistory actions={approvedActions} />
            </section>
          </TabsContent>

          {/* === STATS === */}
          <TabsContent value="stats" className="mt-5">
            <ClassActionStats actions={actions} classroom={displayClassroom} />
          </TabsContent>

          {/* === FEED === */}
          <TabsContent value="feed" className="mt-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm">Stories da Escola</h3>
            </div>
            <StoriesFeed classroom={displayClassroom} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Video Modal */}
      <Dialog open={!!videoActionKey} onOpenChange={(open) => { if (!open) setVideoActionKey(null); }}>
        <DialogContent className="w-[100vw] sm:max-w-lg h-full sm:h-[90dvh] flex flex-col p-0 overflow-hidden border-none sm:border rounded-none sm:rounded-3xl">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0 bg-background sm:bg-transparent">
            <DialogTitle className="font-heading text-center text-base">📹 Verificação Anti-Batota</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-background sm:bg-transparent">
            {videoActionKey && (
              <VideoRecorder
                actionKey={videoActionKey}
                onVideoAnalyzed={handleVideoConfirmed}
                onVideoRejected={handleVideoRejected}
                onCancel={() => setVideoActionKey(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
