import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, History, Info, AlertTriangle, Trash2, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ACTION_ICONS = {
  DELETE_CLASSROOM: <Trash2 className="h-4 w-4 text-red-500" />,
  ADJUST_POINTS: <SlidersHorizontal className="h-4 w-4 text-blue-500" />,
  DEFAULT: <History className="h-4 w-4 text-muted-foreground" />,
};

const LEVEL_COLORS = {
  info: "bg-blue-500/10 text-blue-600 border-blue-200",
  important: "bg-orange-500/10 text-orange-600 border-orange-200",
  critical: "bg-red-500/10 text-red-600 border-red-200",
};

const LEVEL_ICONS = {
  info: <Info className="h-3 w-3" />,
  important: <AlertTriangle className="h-3 w-3" />,
  critical: <ShieldAlert className="h-3 w-3" />,
};

export default function AdminAuditLogs() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('AuditLog')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
        <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-destructive font-heading font-bold">Erro ao carregar logs</p>
        <p className="text-xs text-muted-foreground mt-1">
          Certifica-te que criaste a tabela 'AuditLog' no Supabase.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Segurança
        </h3>
        <Badge variant="outline" className="font-mono text-[10px]">
          {logs.length} registos recentes
        </Badge>
      </div>

      {logs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Nenhum log de auditoria registado ainda.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4 overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-xl bg-muted/50 border border-border/50">
                  {ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-heading font-bold text-sm tracking-tight">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-body text-muted-foreground shrink-0">
                      {format(new Date(log.created_at), "d MMM, HH:mm:ss", { locale: pt })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-body leading-relaxed mb-3">
                    {log.details}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[9px] h-5 gap-1 font-black uppercase ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
                      {LEVEL_ICONS[log.level] || LEVEL_ICONS.info}
                      {log.level}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
