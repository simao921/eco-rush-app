import React, { useState } from "react";
import { supabase } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bot, Video, Filter, Trash2, X, Play } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminVideoHistory() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [previewMedia, setPreviewMedia] = useState(null);

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from('Classroom').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["video-actions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('EcoAction')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('EcoAction').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-actions-admin"] });
      toast.success("Registo eliminado!");
    },
    onError: (err) => {
      console.error("Erro ao eliminar:", err);
      toast.error("Erro ao eliminar da base de dados.");
    },
  });

  const videoActions = actions.filter(a => (!!a.ai_analysis || !!a.photo_url || !!a.video_url));
  
  const filteredActions = selectedClassId === "all" 
    ? videoActions 
    : videoActions.filter(a => a.classroom_id === selectedClassId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/50">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filtrar por Turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
          <Video className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum registo encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const hasAI = !!action.ai_analysis;
            const classInfo = classrooms.find(c => c.id === action.classroom_id);
            const className = action.classroom_name || classInfo?.name || "Turma desconhecida";

            return (
              <Card key={action.id} className="p-4 overflow-hidden border-primary/10 hover:border-primary/20 transition-all group relative">
                <div className="flex gap-4">
                  {/* Media Trigger */}
                  <div 
                    className="shrink-0 relative cursor-pointer" 
                    onClick={() => {
                      if (action.video_url) setPreviewMedia({ url: action.video_url, type: "video" });
                      else if (action.photo_url) setPreviewMedia({ url: action.photo_url, type: "image" });
                    }}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-black border border-border flex items-center justify-center">
                      {action.photo_url ? (
                        <img src={action.photo_url} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground/30" />
                      )}
                      {action.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary" className="font-heading text-[10px] bg-primary/10 text-primary border-none uppercase">
                        {className}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] font-heading uppercase ${action.status === "aprovada" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                        {action.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-body ml-auto">
                        {action.created_date ? format(new Date(action.created_date), "d MMM, HH:mm", { locale: pt }) : ""}
                      </span>
                    </div>

                    <p className="text-sm font-heading font-bold mb-1">
                      {ACTION_TYPES[action.action_type]?.title || action.action_type}
                    </p>

                    {hasAI && (
                      <div className={`flex items-start gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 mt-1 font-body ${action.ai_valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        <Bot className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{action.ai_analysis}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Tens a certeza que queres eliminar este registo?")) {
                          deleteMutation.mutate(action.id);
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none sm:rounded-2xl">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 min-h-[300px]">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-50 text-white bg-black/40 hover:bg-black/60 rounded-full" onClick={() => setPreviewMedia(null)}>
                <X className="h-5 w-5" />
              </Button>
            
            {previewMedia?.type === "video" ? (
              <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg" />
            ) : (
              <img src={previewMedia?.url} className="max-w-full max-h-[85vh] object-contain rounded-lg" alt="Preview" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}