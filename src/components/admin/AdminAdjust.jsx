import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, Plus, Minus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdjust() {
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [adjustType, setAdjustType] = useState("add");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState("");
  const queryClient = useQueryClient();

  const { data: classrooms = [] } = useQuery({
    queryKey: ["admin-classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Classroom')
        .select('*')
        .order('total_points', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const cls = classrooms.find((c) => c.id === selectedClassroom);
      if (!cls) return;
      const pts = parseInt(points);
      if (isNaN(pts) || pts <= 0) return;

      const actualPoints = adjustType === "add" ? pts : -pts;
      const newTotal = Math.max(0, (cls.total_points || 0) + actualPoints);
      const newMonthly = Math.max(0, (cls.monthly_points || 0) + actualPoints);

      const { error: updErr } = await supabase
        .from('Classroom')
        .update({
          total_points: newTotal,
          monthly_points: newMonthly,
        })
        .eq('id', cls.id);

      if (updErr) {
        window.alert("Erro ao atualizar pontos na BD: " + updErr.message);
        throw updErr;
      }

      if (actionType) {
        const { error: actErr } = await supabase.from('EcoAction').insert([{
          classroom_id: cls.id,
          classroom_name: cls.name,
          action_type: actionType,
          points: Math.abs(actualPoints),
          status: "aprovada",
          registered_by: "professor"
        }]);

        if (actErr) {
          window.alert("Erro ao registar na tabela EcoAction: " + actErr.message);
        }
        
        // Publicar no feed para que a turma saiba
        await supabase.from('FeedPost').insert([{
          classroom_id: cls.id,
          classroom_name: cls.name,
          action_type: "ajuste_admin",
          message: reason || `O Professor/Admin ${adjustType === "add" ? "adicionou" : "removeu"} ${pts} pontos à turma.`,
          points_earned: actualPoints,
          likes: 0,
          liked_by: [],
          reposts: 0,
          reposted_by: [],
          is_story: false,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setPoints("");
      setReason("");
      setActionType("");
      toast.success("Pontos ajustados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao ajustar pontos!");
      console.error(error);
    }
  });

  const resetLimitsMutation = useMutation({
    mutationFn: async (classId) => {
      // Set recent actions to 'admin_reset' so they don't count towards the 'turma' limit
      const since = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('EcoAction')
        .update({ registered_by: "admin_reset" })
        .eq('classroom_id', classId)
        .eq('registered_by', 'turma')
        .gte('created_date', since);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Limites repostos! A turma já pode jogar novamente.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClassroom || !points) return;
    adjustMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Ajustar Pontos Manualmente</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-body">Turma</Label>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar turma" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    Turma {c.name} — {c.total_points || 0} pts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-body">Operação</Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant={adjustType === "add" ? "default" : "outline"} 
                  className={adjustType === "add" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                  onClick={() => setAdjustType("add")}
                >
                  <Plus className="h-4 w-4 mr-1" /> Dar
                </Button>
                <Button 
                  type="button" 
                  variant={adjustType === "remove" ? "destructive" : "outline"} 
                  className="flex-1"
                  onClick={() => setAdjustType("remove")}
                >
                  <Minus className="h-4 w-4 mr-1" /> Tirar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Pontos</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="font-heading"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-body">Tipo de ação (opcional)</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label} (+{val.points})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-body">Motivo (opcional)</Label>
            <Textarea
              placeholder="Ex: Participação no dia da árvore"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="font-body"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!selectedClassroom || !points || adjustMutation.isPending}
          >
            Confirmar Ajuste
          </Button>
        </form>
      </Card>

      {/* Quick add for high-level actions */}
      <Card className="p-5">
        <h3 className="font-heading font-semibold mb-3">Atribuição Rápida (Ações de Alto Valor)</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Estas ações só podem ser atribuídas por professor/admin:
        </p>
        <div className="space-y-2">
          {Object.entries(ACTION_TYPES)
            .filter(([_, v]) => v.level === "high")
            .map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">{val.label}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">+{val.points} pts</Badge>
                </div>
                <Select onValueChange={(classId) => {
                  const cls = classrooms.find(c => c.id === classId);
                  if (!cls) return;
                  supabase.from('EcoAction').insert([{
                    classroom_id: cls.id,
                    classroom_name: cls.name,
                    action_type: key,
                    points: val.points,
                    status: "aprovada",
                    registered_by: "professor",
                  }]).then(() => {
                    return supabase.from('Classroom').update({
                      total_points: (cls.total_points || 0) + val.points,
                      monthly_points: (cls.monthly_points || 0) + val.points,
                    }).eq('id', cls.id);
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
                    queryClient.invalidateQueries({ queryKey: ["ranking"] });
                    toast.success(`+${val.points} pts para turma ${cls.name}!`);
                  });
                }}>
                  <SelectTrigger className="w-28 text-xs">
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
        </div>
      </Card>

      {/* Reset Limits */}
      <Card className="p-5 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="h-5 w-5 text-yellow-600" />
          <h3 className="font-heading font-semibold text-yellow-700">Redefinir Limites (Bypass 1 Hora)</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Isto permite que a turma registe ações novamente sem ter de esperar 1 hora (limpa o bloqueio sem apagar os pontos ganhos).
        </p>
        <div className="flex gap-2">
          <Select onValueChange={(classId) => {
            const cls = classrooms.find(c => c.id === classId);
            if (!cls) return;
            if (window.confirm(`Tens a certeza que queres desbloquear a turma ${cls.name}?`)) {
              resetLimitsMutation.mutate(cls.id);
            }
          }}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Seleciona a turma para desbloquear" />
            </SelectTrigger>
            <SelectContent>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  Desbloquear Turma {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}