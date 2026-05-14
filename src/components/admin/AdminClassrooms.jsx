import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAccessCode } from "@/lib/ecoConstants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminClassrooms() {
  const [newName, setNewName] = useState("");
  const [newCycle, setNewCycle] = useState("2_ciclo");
  const [filterCycle, setFilterCycle] = useState("all");
  const queryClient = useQueryClient();

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["admin-classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Classroom')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const code = generateAccessCode(name);
      const { data, error } = await supabase
        .from('Classroom')
        .insert([{
          name: name.trim(),
          access_code: code,
          total_points: 0,
          monthly_points: 0,
          cycle: newCycle,
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      setNewName("");
      toast.success("Turma criada com sucesso!");
    },
    onError: (err) => {
      console.error("Erro ao criar turma:", err);
      toast.error(`Erro ao criar: ${err.message || "Verifica a tua ligação ou as permissões RLS no Supabase."}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Remover todos os rastros manualmente caso a BD não tenha ON DELETE CASCADE
      await supabase.from('EcoAction').delete().eq('classroom_id', id);
      await supabase.from('FeedPost').delete().eq('classroom_id', id);

      const { error } = await supabase
        .from('Classroom')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Log de Auditoria
      await supabase.from('AuditLog').insert([{
        action: 'DELETE_CLASSROOM',
        details: `Eliminação da turma ID: ${id}`,
        level: 'critical'
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      toast.success("Turma e todos os seus rastros foram eliminados!");
    },
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(newName);
  };

  return (
    <div className="space-y-4">
      {/* Create form */}
      <Card className="p-4">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Nome da turma (ex: 7A)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="font-body flex-1"
          />
          <select 
            value={newCycle} 
            onChange={(e) => setNewCycle(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="1_ciclo">1º Ciclo</option>
            <option value="2_ciclo">2º Ciclo</option>
            <option value="3_ciclo">3º Ciclo</option>
            <option value="funcionarias">Funcionárias</option>
          </select>
          <Button type="submit" disabled={createMutation.isPending || !newName.trim()} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </form>
      </Card>

      {/* Filters and List */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading font-semibold text-sm">Turmas e Grupos</h3>
        <select 
          value={filterCycle} 
          onChange={(e) => setFilterCycle(e.target.value)}
          className="text-xs font-body bg-transparent border-none focus:ring-0 text-muted-foreground cursor-pointer"
        >
          <option value="all">Todos os ciclos</option>
          <option value="1_ciclo">1º Ciclo</option>
          <option value="2_ciclo">2º Ciclo</option>
          <option value="3_ciclo">3º Ciclo</option>
          <option value="funcionarias">Funcionárias</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : classrooms.length === 0 ? (
        <p className="text-center text-muted-foreground font-body text-sm py-8">
          Nenhuma turma criada. Cria a primeira!
        </p>
      ) : (
        <div className="space-y-2">
          {classrooms
            .filter(c => filterCycle === "all" || c.cycle === filterCycle)
            .map((c) => (
            <Card key={c.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold">Turma {c.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {c.access_code}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.access_code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-right mr-2 flex flex-col items-end">
                <Badge variant="secondary" className="mb-1 text-[10px] uppercase tracking-wider">
                  {c.cycle === '1_ciclo' ? '1º Ciclo' : 
                   c.cycle === '3_ciclo' ? '3º Ciclo' : 
                   c.cycle === 'funcionarias' ? 'Funcionárias' : '2º Ciclo'}
                </Badge>
                <div className="flex items-center gap-1">
                  <p className="font-heading font-bold text-primary">{c.total_points || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">pts</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover turma {c.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser revertida. Todos os dados da turma serão eliminados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}