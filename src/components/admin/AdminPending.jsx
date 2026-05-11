import React from "react";
import { supabase } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Bot, Image } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function AdminPending() {
  const queryClient = useQueryClient();

  const { data: pendingActions = [], isLoading } = useQuery({
    queryKey: ["pending-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('EcoAction')
        .select('*')
        .eq('status', 'pendente')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (action) => {
      const { error } = await supabase
        .from('EcoAction')
        .update({ status: "aprovada" })
        .eq('id', action.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-actions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      toast.success("Ação aprovada e pontos atribuídos!");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (action) => {
      const { error } = await supabase
        .from('EcoAction')
        .update({ status: "rejeitada" })
        .eq('id', action.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-actions"] });
      toast.info("Ação rejeitada.");
    },
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : pendingActions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">
            Nenhuma ação pendente de validação.
          </p>
        </div>
      ) : (
        pendingActions.map((action) => {
          const type = ACTION_TYPES[action.action_type];
          return (
            <Card key={action.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="font-heading text-xs">
                    Turma {action.classroom_name}
                  </Badge>
                  <Badge variant="outline" className="font-heading text-xs">
                    +{action.points} pts
                  </Badge>
                </div>
                <p className="font-body text-sm font-medium truncate">
                  {type?.label || action.action_type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.created_date
                    ? format(new Date(action.created_date), "d MMM, HH:mm", { locale: pt })
                    : ""}
                </p>
                {action.ai_analysis && (
                  <div className={`flex items-start gap-1 mt-1 text-xs rounded-md px-2 py-1 ${action.ai_valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <Bot className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{action.ai_analysis}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => rejectMutation.mutate(action)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(action)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}