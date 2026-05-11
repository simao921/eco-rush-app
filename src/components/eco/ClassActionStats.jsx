import React from "react";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import {
  Lightbulb, Recycle, Trash2, Sparkles, TrendingDown, Users, Award,
  Flame, Target, Star, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { getPointsLevel } from "@/lib/ecoConstants";
import { format, subDays } from "date-fns";
import { pt } from "date-fns/locale";

const ICON_MAP = { Lightbulb, Recycle, Trash2, Sparkles, TrendingDown, Users, Award };

const ICON_BG = {
  "text-yellow-500": "bg-yellow-500/10",
  "text-green-500": "bg-green-500/10",
  "text-lime-500": "bg-lime-500/10",
  "text-blue-500": "bg-blue-500/10",
  "text-teal-500": "bg-teal-500/10",
  "text-purple-500": "bg-purple-500/10",
  "text-orange-500": "bg-orange-500/10",
};

function computeStreak(actions) {
  // Days with at least 1 approved action (consecutive up to today)
  const approved = actions.filter((a) => a.status === "aprovada");
  if (approved.length === 0) return 0;

  const days = new Set(approved.map((a) => format(new Date(a.created_date), "yyyy-MM-dd")));
  let streak = 0;
  let check = new Date();
  while (true) {
    const key = format(check, "yyyy-MM-dd");
    if (days.has(key)) {
      streak++;
      check = subDays(check, 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function ClassActionStats({ actions, classroom }) {
  const approved = actions.filter((a) => a.status === "aprovada");
  const pending = actions.filter((a) => a.status === "pendente");
  const rejected = actions.filter((a) => a.status === "rejeitada");
  const streak = computeStreak(actions);
  const totalPoints = classroom?.total_points || 0;
  const { label: levelLabel, level, progress } = getPointsLevel(totalPoints);

  const counts = Object.entries(ACTION_TYPES).map(([key, def]) => ({
    key,
    label: def.label,
    icon: def.icon,
    color: def.color,
    count: approved.filter((a) => a.action_type === key).length,
    points: approved.filter((a) => a.action_type === key).reduce((s, a) => s + (a.points || 0), 0),
  })).filter((a) => a.count > 0).sort((a, b) => b.points - a.points);

  const maxCount = counts.length > 0 ? Math.max(...counts.map((c) => c.count)) : 1;

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/15 to-teal-500/10 border border-primary/20 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-primary" />
            <p className="text-xs font-body text-muted-foreground">Nível atual</p>
          </div>
          <p className="font-heading font-black text-2xl text-primary">{level}</p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">{levelLabel}</p>
          <div className="mt-2 h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className={`rounded-2xl border p-4 ${streak >= 3 ? "bg-gradient-to-br from-orange-500/15 to-yellow-500/10 border-orange-400/30" : "bg-muted/40 border-border/50"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Flame className={`h-4 w-4 ${streak >= 3 ? "text-orange-500" : "text-muted-foreground"}`} />
            <p className="text-xs font-body text-muted-foreground">Dias seguidos</p>
          </div>
          <p className={`font-heading font-black text-2xl ${streak >= 3 ? "text-orange-500" : "text-foreground"}`}>
            {streak}
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            {streak === 0 ? "Começa hoje!" : streak === 1 ? "Bom começo!" : streak >= 3 ? "Está a arder! 🔥" : "Continua assim!"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-green-500/8 border border-green-500/20 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-green-600" />
            <p className="text-xs font-body text-muted-foreground">Aprovadas</p>
          </div>
          <p className="font-heading font-black text-2xl text-green-600">{approved.length}</p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">ações válidas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl bg-red-500/8 border border-red-500/20 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <p className="text-xs font-body text-muted-foreground">Rejeitadas</p>
          </div>
          <p className="font-heading font-black text-2xl text-red-500">{rejected.length}</p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">pela IA</p>
        </motion.div>
      </div>

      {/* Action breakdown */}
      {counts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-heading font-bold text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Ações por tipo
          </h4>
          {counts.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || Award;
            const iconBg = ICON_BG[item.color] || "bg-muted";
            const barWidth = Math.round((item.count / maxCount) * 100);
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-body font-medium text-foreground truncate pr-2">{item.label}</p>
                    <span className="text-xs font-heading font-bold text-primary shrink-0">
                      {item.count}x · {item.points} pts
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {counts.length === 0 && (
        <div className="text-center py-8">
          <Sparkles className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Ainda não há ações aprovadas para mostrar.</p>
        </div>
      )}
    </div>
  );
}