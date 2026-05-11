import React, { useMemo } from "react";
import { supabase } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { Trash2, Lightbulb, Recycle, Sparkles, TrendingDown } from "lucide-react";
import { Loader2 } from "lucide-react";

const ACTION_ICONS = {
  apanhar_lixo: <Trash2 className="h-5 w-5 text-lime-500" />,
  apagar_luzes: <Lightbulb className="h-5 w-5 text-yellow-500" />,
  reciclagem_correta: <Recycle className="h-5 w-5 text-green-500" />,
  sala_limpa: <Sparkles className="h-5 w-5 text-blue-500" />,
  reducao_desperdicio: <TrendingDown className="h-5 w-5 text-teal-500" />,
};

export default function AdminImpact() {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["all-actions-impact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('EcoAction')
        .select('*')
        .eq('status', 'aprovada')
        .order('created_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms-impact"],
    queryFn: async () => {
      const { data, error } = await supabase.from('Classroom').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Count per action type
  const actionCounts = useMemo(() => {
    const counts = {};
    actions.forEach((a) => {
      counts[a.action_type] = (counts[a.action_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({
        label: ACTION_TYPES[key]?.label || key,
        count,
        key,
      }))
      .sort((a, b) => b.count - a.count);
  }, [actions]);

  // Points per day (last 14 days)
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const pts = actions
        .filter((a) => a.created_date?.startsWith(dayStr))
        .reduce((sum, a) => sum + (a.points || 0), 0);
      return { day: format(day, "dd/MM", { locale: pt }), pts };
    });
  }, [actions]);

  // Points per classroom
  const classroomData = useMemo(() => {
    return classrooms
      .map((c) => ({ name: c.name, pts: c.total_points || 0 }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 8);
  }, [classrooms]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalActions = actions.length;
  const totalPoints = actions.reduce((sum, a) => sum + (a.points || 0), 0);
  const trashCount = actions.filter((a) => a.action_type === "apanhar_lixo").length;
  const lightsCount = actions.filter((a) => a.action_type === "apagar_luzes").length;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ações aprovadas", value: totalActions, color: "text-primary" },
          { label: "Pontos gerados", value: totalPoints, color: "text-secondary" },
          { label: "Lixo apanhado", value: trashCount, color: "text-lime-600" },
          { label: "Luzes apagadas", value: lightsCount, color: "text-yellow-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 text-center">
            <p className={`font-heading font-bold text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Daily points line chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm">Pontos por dia (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="pts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Pontos" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Action type bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm">Ações por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actionCounts} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Ações" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Classroom ranking bar chart */}
      {classroomData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-sm">Pontos totais por turma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={classroomData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pts" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Pontos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}