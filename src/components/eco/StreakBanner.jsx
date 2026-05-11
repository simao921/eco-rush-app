import React from "react";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";

function computeStreak(actions) {
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
    } else break;
  }
  return streak;
}

export default function StreakBanner({ actions }) {
  const streak = computeStreak(actions);
  if (streak === 0) return null;

  const isHot = streak >= 3;
  const isEpic = streak >= 7;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
          isEpic
            ? "bg-gradient-to-r from-orange-500/20 via-yellow-500/15 to-red-500/10 border-orange-400/40"
            : isHot
            ? "bg-gradient-to-r from-orange-500/15 to-yellow-500/10 border-orange-400/30"
            : "bg-orange-500/8 border-orange-400/20"
        }`}
      >
        <motion.div
          animate={isHot ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            isEpic ? "bg-orange-500/20" : "bg-orange-500/15"
          }`}
        >
          <Flame className={`h-6 w-6 ${isEpic ? "text-red-500" : isHot ? "text-orange-500" : "text-orange-400"}`} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className={`font-heading font-black text-lg leading-none ${isEpic ? "text-red-500" : isHot ? "text-orange-500" : "text-orange-400"}`}>
            {streak} dias seguidos 🔥
          </p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            {isEpic
              ? "Streak épico! A turma está em chamas! 🏆"
              : isHot
              ? "Incrível! Continuem assim!"
              : streak === 1
              ? "Primeiro dia — vamos a isto!"
              : "Bom começo de streak!"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-heading font-black text-3xl text-orange-500">{streak}</p>
          <p className="text-[10px] text-muted-foreground font-body">dias</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}