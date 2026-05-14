import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EcoHeader from "@/components/eco/EcoHeader";
import RankingCard from "@/components/eco/RankingCard";
import { Trophy, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useClassroom } from "@/lib/classroomContext.jsx";

export default function Ranking() {
  const { classroom } = useClassroom();
  const [selectedCycle, setSelectedCycle] = React.useState(classroom?.cycle || "2_ciclo");

  React.useEffect(() => {
    if (classroom?.cycle) {
      setSelectedCycle(classroom.cycle);
    }
  }, [classroom]);

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["ranking", selectedCycle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Classroom')
        .select('*')
        .eq('cycle', selectedCycle)
        .order('total_points', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const queryClient = useQueryClient();

  // Real-time para o Ranking
  React.useEffect(() => {
    const channel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Classroom' },
        () => queryClient.invalidateQueries({ queryKey: ["ranking"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const leader = classrooms[0];
  const top3 = classrooms.slice(0, 3);
  const rest = classrooms.slice(3);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[40vw] rounded-full bg-yellow-400/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/8 blur-[80px]" />
      </div>

      <EcoHeader />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-400/25">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Ranking Eco Rush</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Competição saudável entre turmas 🌿
          </p>

          {/* Cycle Tabs */}
          {!classroom && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {['1_ciclo', '2_ciclo', '3_ciclo'].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCycle(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCycle === c 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {c === '1_ciclo' ? '1º Ciclo' : c === '2_ciclo' ? '2º Ciclo' : '3º Ciclo'}
                </button>
              ))}
            </div>
          )}

          {classroom && (
            <Badge variant="secondary" className="mt-4 px-3 py-1 uppercase tracking-widest text-[10px] font-black">
              {classroom.cycle === '1_ciclo' ? '1º Ciclo' : classroom.cycle === '2_ciclo' ? '2º Ciclo' : '3º Ciclo'}
            </Badge>
          )}
        </motion.div>

        {/* Top 3 podium */}
        {!isLoading && top3.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-end justify-center gap-3 pt-4"
          >
            {/* 2nd */}
            {top3[1] && (
              <PodiumBlock classroom={top3[1]} position={2} isHighlighted={classroom?.id === top3[1]?.id} />
            )}
            {/* 1st */}
            {top3[0] && (
              <PodiumBlock classroom={top3[0]} position={1} isHighlighted={classroom?.id === top3[0]?.id} tall />
            )}
            {/* 3rd */}
            {top3[2] && (
              <PodiumBlock classroom={top3[2]} position={3} isHighlighted={classroom?.id === top3[2]?.id} />
            )}
          </motion.div>
        )}

        {/* Rest of ranking */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-12">
            <Leaf className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-body">Ainda não existem turmas registadas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rest.length > 0 && (
              <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider px-1 mb-3">
                Classificação completa
              </p>
            )}
            {classrooms.map((c, i) => (
              <RankingCard
                key={c.id}
                classroom={c}
                position={i}
                isHighlighted={classroom?.id === c.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PodiumBlock({ classroom, position, isHighlighted, tall = false }) {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const heights = { 1: "h-28 sm:h-32", 2: "h-20 sm:h-24", 3: "h-16 sm:h-20" };
  const colors = {
    1: "from-yellow-400/30 to-yellow-500/10 border-yellow-400/40",
    2: "from-gray-300/30 to-gray-400/10 border-gray-400/30",
    3: "from-orange-400/30 to-orange-500/10 border-orange-400/30",
  };

  return (
    <div className={`flex-1 flex flex-col items-center gap-1.5 ${isHighlighted ? "scale-105" : ""} transition-transform min-w-0`}>
      <p className="text-[10px] sm:text-xs font-body font-semibold text-muted-foreground truncate w-full text-center px-1">
        Turma {classroom.name}
      </p>
      <p className="font-heading font-black text-primary text-xs sm:text-sm">{classroom.total_points || 0} pts</p>
      <div className={`w-full ${heights[position]} rounded-t-2xl bg-gradient-to-b ${colors[position]} border flex items-start justify-center pt-3 shadow-sm`}>
        <span className="text-xl sm:text-2xl">{medals[position]}</span>
      </div>
    </div>
  );
}