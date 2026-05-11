import React from "react";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, Lightbulb, Recycle, Trash2, Sparkles, TrendingDown, Users, Award, Bot } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CONFIG = {
  aprovada: { icon: CheckCircle2, label: "Aprovada", color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
  pendente:  { icon: Clock,        label: "Pendente",  color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  rejeitada: { icon: XCircle,      label: "Rejeitada", color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/20" },
};

const ICON_MAP = { Lightbulb, Recycle, Trash2, Sparkles, TrendingDown, Users, Award };

export default function ActionHistory({ actions = [] }) {
  if (actions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground font-body text-sm">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
        Nenhuma ação aqui ainda. Vamos lá!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action, i) => {
        const type = ACTION_TYPES[action.action_type];
        const status = STATUS_CONFIG[action.status] || STATUS_CONFIG.pendente;
        const StatusIcon = status.icon;
        const ActionIcon = type ? ICON_MAP[type.icon] : null;

        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-2xl border p-3.5 ${status.bg} ${status.border}`}
          >
            <div className="flex items-start gap-3">
              {/* Action icon */}
              <div className="h-9 w-9 rounded-xl bg-background/60 flex items-center justify-center shrink-0 mt-0.5">
                {ActionIcon
                  ? <ActionIcon className={`h-4 w-4 ${type?.color || "text-muted-foreground"}`} />
                  : <Award className="h-4 w-4 text-muted-foreground" />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold font-body truncate">
                    {type?.label || action.action_type}
                  </p>
                  <span className={`text-sm font-heading font-bold shrink-0 ${status.color}`}>
                    {action.points > 0 ? `+${action.points}` : "—"} pts
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${status.color}`} />
                  <span className={`text-xs font-body font-medium ${status.color}`}>{status.label}</span>
                  <span className="text-xs text-muted-foreground font-body">
                    {action.created_date
                      ? format(new Date(action.created_date), "d MMM, HH:mm", { locale: pt })
                      : ""}
                  </span>
                </div>

                {/* AI feedback */}
                {action.ai_analysis && (
                  <div className="mt-2 flex items-start gap-1.5 bg-background/50 rounded-lg px-2.5 py-1.5">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground font-body italic leading-relaxed">
                      {action.ai_analysis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}