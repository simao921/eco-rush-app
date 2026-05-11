import React from "react";
import { getPointsLevel } from "@/lib/ecoConstants";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const POSITION_STYLES = {
  0: { emoji: "🥇", bg: "bg-yellow-500/8", border: "border-yellow-400/40", pointColor: "text-yellow-600" },
  1: { emoji: "🥈", bg: "bg-gray-400/8", border: "border-gray-400/30", pointColor: "text-gray-500" },
  2: { emoji: "🥉", bg: "bg-orange-500/8", border: "border-orange-400/30", pointColor: "text-orange-600" },
};

export default function RankingCard({ classroom, position, isHighlighted = false }) {
  const style = POSITION_STYLES[position];
  const isTop3 = position < 3;
  const { label: levelLabel } = getPointsLevel(classroom.total_points || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.04 }}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
          isTop3 ? `${style.bg} ${style.border}` : "bg-card/60 border-border/50 hover:border-border"
        } ${isHighlighted ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
      >
        {/* Position */}
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-heading font-bold shrink-0 ${
          isTop3 ? "text-lg" : "bg-muted text-muted-foreground text-sm"
        }`}>
          {isTop3 ? style.emoji : position + 1}
        </div>

        {/* Name + level */}
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm truncate">
            Turma {classroom.name}
            {isHighlighted && (
              <span className="ml-2 text-xs font-normal text-primary">(a tua turma)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground font-body">{levelLabel}</p>
        </div>

        {/* Points */}
        <div className="text-right shrink-0">
          <p className={`font-heading font-bold text-lg ${isTop3 ? style.pointColor : "text-foreground"}`}>
            {classroom.total_points || 0}
          </p>
          <p className="text-xs text-muted-foreground">pts</p>
        </div>

        {isHighlighted && <Flame className="h-4 w-4 text-primary shrink-0" />}
      </div>
    </motion.div>
  );
}