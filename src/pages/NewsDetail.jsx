import React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import EcoHeader from "@/components/eco/EcoHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { motion } from "framer-motion";

export default function NewsDetail() {
  const { id } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NewsPost')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-background">
      <EcoHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-6 font-body text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !post && (
          <div className="text-center py-20 text-muted-foreground font-body">
            Notícia não encontrada.
          </div>
        )}

        {post && (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Hero */}
            <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-teal-500/8 to-transparent border border-primary/20 p-8 text-center space-y-3">
              <span className="text-6xl">{post.emoji || "📢"}</span>
              <div>
                {post.pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase bg-primary/15 text-primary px-3 py-1 rounded-full mb-3">
                    <Pin className="h-3 w-3" /> Destaque
                  </span>
                )}
                <h1 className="font-heading text-3xl font-black text-foreground">{post.title}</h1>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                {format(new Date(post.created_date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })}
              </p>
            </div>

            {/* Content */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="font-body text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}