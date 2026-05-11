import React from "react";
import { getPointsLevel } from "@/lib/ecoConstants";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const LEVEL_COLORS = {
  1: { ring: "from-gray-300 to-gray-400", glow: "shadow-gray-300/30" },
  2: { ring: "from-green-400 to-teal-500", glow: "shadow-green-400/30" },
  3: { ring: "from-teal-400 to-primary", glow: "shadow-teal-400/30" },
  4: { ring: "from-primary to-blue-500", glow: "shadow-primary/30" },
  5: { ring: "from-yellow-400 to-orange-500", glow: "shadow-yellow-400/30" },
};

export default function PointsBadge({ points, showLevel = true }) {
  const { level, label, progress } = getPointsLevel(points || 0);
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[1];

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Ring + number */}
      <div className="relative">
        <div className={`p-1.5 rounded-full bg-gradient-to-br ${colors.ring} shadow-2xl ${colors.glow}`}>
          <div className="h-24 w-24 rounded-full bg-background flex flex-col items-center justify-center">
            <span className="font-heading font-black text-3xl text-foreground leading-none">
              {points || 0}
            </span>
            <span className="text-[10px] text-muted-foreground font-body">pontos</span>
          </div>
        </div>
        {/* Level badge */}
        {showLevel && (
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-heading font-bold bg-gradient-to-r ${colors.ring} text-white shadow-md whitespace-nowrap`}>
            Nv.{level}
          </div>
        )}
      </div>

      {/* Label + progress */}
      {showLevel && (
        <div className="text-center w-full max-w-[200px] mt-2">
          <p className="text-sm font-heading font-bold text-foreground mb-2">{label}</p>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground font-body mt-1">{Math.round(progress)}% para o próximo nível</p>
        </div>
      )}
    </motion.div>
  );
}