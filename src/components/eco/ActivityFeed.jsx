import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import {
  Heart, Leaf, Lightbulb, Recycle, Trash2, Sparkles,
  TrendingDown, Users, Award, Globe, ImageOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ICON_MAP = { Lightbulb, Recycle, Trash2, Sparkles, TrendingDown, Users, Award, Leaf };
const ICON_BG = {
  "text-yellow-500": "bg-yellow-500/10",
  "text-green-500": "bg-green-500/10",
  "text-lime-500": "bg-lime-500/10",
  "text-blue-500": "bg-blue-500/10",
  "text-teal-500": "bg-teal-500/10",
  "text-purple-500": "bg-purple-500/10",
  "text-orange-500": "bg-orange-500/10",
};

export default function ActivityFeed({ classroom }) {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('FeedPost')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const alreadyLiked = (post.liked_by || []).includes(classroom.id);
      if (alreadyLiked) return null;
      
      const { error } = await supabase
        .from('FeedPost')
        .update({
          likes: (post.likes || 0) + 1,
          liked_by: [...(post.liked_by || []), classroom.id],
        })
        .eq('id', post.id);
        
      if (error) throw error;
      return post.id;
    },
    onSuccess: (postId) => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        toast.success("💚 Gosto enviado!");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-body">
          Ainda nenhuma atividade no feed. Regista uma ação para seres o primeiro! 🌿
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {posts.map((post, i) => {
          const actionDef = ACTION_TYPES[post.action_type];
          const Icon = actionDef ? (ICON_MAP[actionDef.icon] || Leaf) : Leaf;
          const iconColor = actionDef?.color || "text-primary";
          const iconBg = ICON_BG[iconColor] || "bg-primary/10";
          const isOwnClass = post.classroom_id === classroom?.id;
          const hasLiked = (post.liked_by || []).includes(classroom?.id);

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border overflow-hidden ${
                isOwnClass
                  ? "bg-primary/5 border-primary/25"
                  : "bg-card/70 border-border/50"
              }`}
            >
              {/* Photo */}
              {post.photo_url && (
                <div className="w-full aspect-video bg-muted overflow-hidden">
                  <img
                    src={post.photo_url}
                    alt="Ação eco"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-sm">Turma {post.classroom_name}</span>
                      {isOwnClass && (
                        <span className="text-[10px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded-full">
                          A tua turma
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      {post.created_date
                        ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: pt })
                        : ""}
                    </p>
                  </div>
                  {post.points_earned > 0 && (
                    <span className="shrink-0 font-heading font-bold text-sm text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      +{post.points_earned} pts
                    </span>
                  )}
                </div>

                {/* Message */}
                <p className="font-body text-sm text-foreground leading-relaxed mb-3">
                  {post.message}
                </p>

                {/* Footer: like button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (isOwnClass) return toast.info("Não podes dar gosto à tua própria turma 😄");
                      if (hasLiked) return toast.info("Já deste gosto a esta publicação!");
                      likeMutation.mutate(post);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body font-medium transition-all ${
                      hasLiked
                        ? "bg-red-500/15 text-red-500"
                        : "bg-muted/60 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? "fill-red-500" : ""}`} />
                    <span>{post.likes || 0}</span>
                  </button>

                  {actionDef && (
                    <span className="text-xs text-muted-foreground font-body truncate ml-2">
                      {actionDef.label}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}