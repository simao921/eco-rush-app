import React from "react";
import { ACTION_TYPES, LEVEL_RULES } from "@/lib/ecoConstants";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, Recycle, Sparkles, TrendingDown, Users, Award, Check, Video, Trash2, Plus
} from "lucide-react";
import { motion } from "framer-motion";

const ICONS = { Lightbulb, Recycle, Sparkles, TrendingDown, Users, Award, Trash2 };

const ICON_BG = {
  "text-yellow-500": "bg-yellow-500/10",
  "text-green-500": "bg-green-500/10",
  "text-lime-500": "bg-lime-500/10",
  "text-blue-500": "bg-blue-500/10",
  "text-teal-500": "bg-teal-500/10",
  "text-purple-500": "bg-purple-500/10",
  "text-orange-500": "bg-orange-500/10",
};

export default function ActionCard({ actionKey, onRegister, isAdmin = false, disabled = false, completed = false }) {
  const action = ACTION_TYPES[actionKey];
  if (!action) return null;

  const rule = LEVEL_RULES[action.level];
  const Icon = ICONS[action.icon];
  const requiresVideo = action.requiresVideo && !isAdmin;
  const iconBg = ICON_BG[action.color] || "bg-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={completed ? {} : { y: -2, scale: 1.01 }}
      transition={{ duration: 0.18 }}
    >
      <div className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        completed
          ? "border-primary/20 bg-primary/5"
          : "border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      }`}>
        {/* Icon */}
        <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
          {Icon && <Icon className={`h-6 w-6 ${action.color}`} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-body font-semibold text-sm ${completed ? "text-muted-foreground" : "text-foreground"}`}>
            {action.label}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-heading font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              +{action.points} pts
            </span>
            {requiresVideo && !completed && (
              <span className="text-xs text-lime-600 flex items-center gap-1 font-body">
                <Video className="h-3 w-3" /> Vídeo obrigatório
              </span>
            )}
            {completed && (
              <span className="text-xs text-primary flex items-center gap-1 font-body font-medium">
                <Check className="h-3 w-3" /> Registado
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          onClick={() => onRegister(actionKey)}
          disabled={disabled || completed}
          className={`shrink-0 rounded-xl transition-all ${
            completed
              ? "bg-primary/10 text-primary border border-primary/20 shadow-none"
              : requiresVideo
              ? "bg-lime-500 hover:bg-lime-600 text-white shadow-md shadow-lime-500/20"
              : "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
          }`}
        >
          {completed ? (
            <Check className="h-4 w-4" />
          ) : requiresVideo ? (
            <><Video className="h-4 w-4" /><span className="ml-1 hidden sm:inline text-xs">Gravar</span></>
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}