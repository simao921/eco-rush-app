import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import {
  Heart, Leaf, Lightbulb, Recycle, Trash2, Sparkles,
  TrendingDown, Users, Award, Globe, Flame, Repeat2, X
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

// Story viewer fullscreen
function StoryViewer({ post, classroom, onClose, onLike, onRepost }) {
  const actionDef = ACTION_TYPES[post.action_type];
  const Icon = actionDef ? (ICON_MAP[actionDef.icon] || Leaf) : Leaf;
  const iconColor = actionDef?.color || "text-primary";
  const isOwnClass = post.classroom_id === classroom?.id;
  const hasLiked = (post.liked_by || []).includes(classroom?.id);
  const hasReposted = (post.reposted_by || []).includes(classroom?.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
          onAnimationComplete={onClose}
          className="h-full bg-white"
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 z-10" onClick={(e) => e.stopPropagation()}>
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center font-heading font-black text-white text-sm`}>
          {post.classroom_name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-heading font-bold text-white text-sm">Turma {post.classroom_name}</p>
            {post.streak_day >= 3 && (
              <span className="flex items-center gap-0.5 bg-orange-500/30 text-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Flame className="h-2.5 w-2.5" /> {post.streak_day}
              </span>
            )}
            {post.original_classroom_name && (
              <span className="text-[10px] text-white/50">🔁 de {post.original_classroom_name}</span>
            )}
          </div>
          <p className="text-[10px] text-white/50 font-body">
            {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: pt }) : ""}
          </p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6" onClick={(e) => e.stopPropagation()}>
        {post.photo_url ? (
          <img src={post.photo_url} alt="" className="max-h-[55vh] w-full object-contain rounded-2xl" />
        ) : (
          <div className={`h-32 w-32 rounded-3xl ${ICON_BG[iconColor] || "bg-primary/10"} flex items-center justify-center`}>
            <Icon className={`h-16 w-16 ${iconColor}`} />
          </div>
        )}
        <div className="text-center">
          <p className="text-white font-body text-lg leading-relaxed">{post.message}</p>
          {post.points_earned > 0 && (
            <span className="inline-block mt-3 bg-primary/30 text-primary-foreground font-heading font-black text-xl px-4 py-1.5 rounded-full">
              +{post.points_earned} pts
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-center gap-6 px-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onLike(post)}
          className={`flex flex-col items-center gap-1 transition-all ${hasLiked ? "text-red-400 scale-110" : "text-white/70 hover:text-white"}`}
        >
          <Heart className={`h-8 w-8 ${hasLiked ? "fill-red-400" : ""}`} />
          <span className="text-xs font-body">{post.likes || 0}</span>
        </button>

        {!isOwnClass && (
          <button
            onClick={() => onRepost(post)}
            className={`flex flex-col items-center gap-1 transition-all ${hasReposted ? "text-green-400 scale-110" : "text-white/70 hover:text-white"}`}
          >
            <Repeat2 className="h-8 w-8" />
            <span className="text-xs font-body">{post.reposts || 0}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Stories row at top (circles)
function StoriesRow({ posts, classroom, onSelect }) {
  // Group by classroom
  const byClass = {};
  posts.forEach((p) => {
    if (!byClass[p.classroom_id]) byClass[p.classroom_id] = { name: p.classroom_name, posts: [], streak: p.streak_day || 0 };
    byClass[p.classroom_id].posts.push(p);
    if ((p.streak_day || 0) > byClass[p.classroom_id].streak) byClass[p.classroom_id].streak = p.streak_day;
  });

  const entries = Object.entries(byClass);
  if (entries.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
      {entries.map(([classId, info]) => {
        const isOwn = classId === classroom?.id;
        const isHot = info.streak >= 3;
        return (
          <button
            key={classId}
            onClick={() => onSelect(info.posts[0])}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className={`p-0.5 rounded-full ${isHot ? "bg-gradient-to-br from-orange-500 via-yellow-400 to-red-500" : "bg-gradient-to-br from-primary to-teal-500"}`}>
              <div className="h-14 w-14 rounded-full bg-card flex items-center justify-center font-heading font-black text-lg border-2 border-background">
                {info.name?.charAt(0)}
              </div>
            </div>
            <p className="text-[10px] font-body text-foreground/80 truncate w-14 text-center">
              {isOwn ? "Tu" : `T. ${info.name}`}
            </p>
            {isHot && (
              <span className="flex items-center gap-0.5 text-[9px] text-orange-500 font-bold -mt-1">
                <Flame className="h-2.5 w-2.5" />{info.streak}d
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function StoriesFeed({ classroom }) {
  const queryClient = useQueryClient();
  const [activeStory, setActiveStory] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('FeedPost')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription para o Feed
  React.useEffect(() => {
    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'FeedPost' },
        () => queryClient.invalidateQueries({ queryKey: ["feed"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: async (post) => {
      const alreadyLiked = (post.liked_by || []).includes(classroom.id);
      if (alreadyLiked) { toast.info("Já deste gosto!"); return null; }
      if (post.classroom_id === classroom.id) { toast.info("Não podes dar gosto à tua própria turma 😄"); return null; }
      
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
    onSuccess: (id) => { if (id) { queryClient.invalidateQueries({ queryKey: ["feed"] }); toast.success("💚 Gosto enviado!"); } },
  });

  const repostMutation = useMutation({
    mutationFn: async (post) => {
      if ((post.reposted_by || []).includes(classroom.id)) { toast.info("Já republicaste este story!"); return null; }
      if (post.classroom_id === classroom.id) { toast.info("Não podes republicar o teu próprio story!"); return null; }
      
      // Update original post repost count
      await supabase
        .from('FeedPost')
        .update({
          reposts: (post.reposts || 0) + 1,
          reposted_by: [...(post.reposted_by || []), classroom.id],
        })
        .eq('id', post.id);

      // Create repost as new feed entry
      const { error } = await supabase.from('FeedPost').insert([{
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        action_type: post.action_type,
        message: post.message,
        photo_url: post.photo_url || null,
        points_earned: 0,
        likes: 0,
        liked_by: [],
        reposts: 0,
        reposted_by: [],
        original_post_id: post.id,
        original_classroom_name: post.classroom_name,
        streak_day: post.streak_day || 0,
        is_story: true,
      }]);
      
      if (error) throw error;
      return post.id;
    },
    onSuccess: (id) => { if (id) { queryClient.invalidateQueries({ queryKey: ["feed"] }); toast.success("🔁 Story republicado!"); } },
  });

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (posts.length === 0) return (
    <div className="text-center py-12">
      <Globe className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground font-body">
        Ainda nenhum story. Regista uma ação para seres o primeiro! 🌿
      </p>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        {/* Stories row */}
        <StoriesRow posts={posts} classroom={classroom} onSelect={setActiveStory} />

        {/* Feed cards */}
        <AnimatePresence>
          {posts.map((post, i) => {
            const actionDef = ACTION_TYPES[post.action_type];
            const Icon = actionDef ? (ICON_MAP[actionDef.icon] || Leaf) : Leaf;
            const iconColor = actionDef?.color || "text-primary";
            const iconBg = ICON_BG[iconColor] || "bg-primary/10";
            const isOwnClass = post.classroom_id === classroom?.id;
            const hasLiked = (post.liked_by || []).includes(classroom?.id);
            const hasReposted = (post.reposted_by || []).includes(classroom?.id);
            const isRepost = !!post.original_classroom_name;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border overflow-hidden cursor-pointer ${
                  isOwnClass ? "bg-primary/5 border-primary/25" : "bg-card/70 border-border/50"
                }`}
                onClick={() => setActiveStory(post)}
              >
                {/* Repost label */}
                {isRepost && (
                  <div className="flex items-center gap-1.5 px-4 pt-2 text-xs text-muted-foreground font-body">
                    <Repeat2 className="h-3 w-3" /> Republicado de Turma {post.original_classroom_name}
                  </div>
                )}

                {/* Photo */}
                {post.photo_url && (
                  <div className="w-full aspect-video bg-muted overflow-hidden">
                    <img src={post.photo_url} alt="Ação eco" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
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
                          <span className="text-[10px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded-full">A tua turma</span>
                        )}
                        {(post.streak_day || 0) >= 3 && (
                          <span className="flex items-center gap-0.5 bg-orange-500/15 text-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            <Flame className="h-2.5 w-2.5" /> {post.streak_day}d streak
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-body">
                        {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: pt }) : ""}
                      </p>
                    </div>
                    {post.points_earned > 0 && (
                      <span className="shrink-0 font-heading font-bold text-sm text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        +{post.points_earned} pts
                      </span>
                    )}
                  </div>

                  <p className="font-body text-sm text-foreground leading-relaxed mb-3">{post.message}</p>

                  {/* Footer */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (isOwnClass) return toast.info("Não podes dar gosto à tua própria turma 😄");
                        if (hasLiked) return toast.info("Já deste gosto!");
                        likeMutation.mutate(post);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-body font-medium transition-all ${
                        hasLiked ? "bg-red-500/15 text-red-500" : "bg-muted/60 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${hasLiked ? "fill-red-500" : ""}`} />
                      <span>{post.likes || 0}</span>
                    </button>

                    {!isOwnClass && (
                      <button
                        onClick={() => repostMutation.mutate(post)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-body font-medium transition-all ${
                          hasReposted ? "bg-green-500/15 text-green-500" : "bg-muted/60 text-muted-foreground hover:bg-green-500/10 hover:text-green-500"
                        }`}
                      >
                        <Repeat2 className="h-4 w-4" />
                        <span>{post.reposts || 0}</span>
                      </button>
                    )}

                    {actionDef && (
                      <span className="text-xs text-muted-foreground font-body truncate ml-auto">{actionDef.label}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Fullscreen story viewer */}
      <AnimatePresence>
        {activeStory && (
          <StoryViewer
            post={activeStory}
            classroom={classroom}
            onClose={() => setActiveStory(null)}
            onLike={(p) => { likeMutation.mutate(p); setActiveStory(null); }}
            onRepost={(p) => { repostMutation.mutate(p); setActiveStory(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}