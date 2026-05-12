import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarDays, Plus, Award, Loader2 } from "lucide-react";

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [eventName, setEventName] = useState("");
  const [pointsPerClass, setPointsPerClass] = useState(15);
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from('Classroom').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const toggleClassroom = (id) => {
    setSelectedClassrooms((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAwardPoints = async () => {
    if (!eventName.trim() || selectedClassrooms.length === 0) {
      toast.error("Preenche o nome do evento e seleciona pelo menos uma turma.");
      return;
    }
    setSaving(true);

    try {
      for (const classroomId of selectedClassrooms) {
        const classroom = classrooms.find((c) => c.id === classroomId);
        if (!classroom) continue;

        await supabase.from('EcoAction').insert([{
          classroom_id: classroomId,
          classroom_name: classroom.name,
          action_type: "participacao_acoes",
          points: Number(pointsPerClass),
          status: "aprovada",
          registered_by: "professor",
          notes: `Evento: ${eventName}`,
        }]);

        await supabase.from('Classroom').update({
          total_points: (classroom.total_points || 0) + Number(pointsPerClass),
          monthly_points: (classroom.monthly_points || 0) + Number(pointsPerClass),
        }).eq('id', classroomId);
      }

      toast.success(`${selectedClassrooms.length} turma(s) receberam ${pointsPerClass}pts pelo evento "${eventName}"!`);
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      setEventName("");
      setSelectedClassrooms([]);
    } catch (err) {
      toast.error("Erro ao atribuir pontos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Registar Evento / Participação</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-body text-muted-foreground mb-1 block">Nome do Evento</label>
            <Input
              placeholder="ex: Semana do Ambiente, Dia da Terra..."
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-body text-muted-foreground mb-1 block">Pontos por turma participante</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={pointsPerClass}
              onChange={(e) => setPointsPerClass(e.target.value)}
              className="w-28"
            />
          </div>

          <div>
            <label className="text-xs font-body text-muted-foreground mb-2 block">
              Turmas participantes ({selectedClassrooms.length} selecionadas)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {classrooms.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-all"
                >
                  <Checkbox
                    checked={selectedClassrooms.includes(c.id)}
                    onCheckedChange={() => toggleClassroom(c.id)}
                  />
                  <span className="font-heading text-sm font-medium">{c.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">{c.total_points || 0}pts</Badge>
                </label>
              ))}
            </div>
            {classrooms.length === 0 && (
              <p className="text-sm text-muted-foreground font-body">Nenhuma turma criada ainda.</p>
            )}
          </div>

          <Button
            onClick={handleAwardPoints}
            disabled={saving || !eventName.trim() || selectedClassrooms.length === 0}
            className="w-full gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Atribuir pontos às turmas selecionadas
          </Button>
        </div>
      </Card>
    </div>
  );
}