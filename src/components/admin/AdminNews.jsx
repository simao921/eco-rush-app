import React, { useState } from "react";
import { supabase } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pin, PinOff, Plus, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";

const EMOJIS = ["📢", "🌿", "🏆", "♻️", "💡", "🌍", "🎉", "📌", "⚡", "🌱"];

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", content: "", emoji: "📢", pinned: false });
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('NewsPost')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('NewsPost').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setForm({ title: "", content: "", emoji: "📢", pinned: false });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('NewsPost').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }) => {
      const { error } = await supabase.from('NewsPost').update({ pinned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    createMutation.mutate(form);
  };

  const pinned = posts.filter((p) => p.pinned);
  const regular = posts.filter((p) => !p.pinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-base">Notícias da Escola</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1">
          <Plus className="h-4 w-4" /> Nova notícia
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-muted/40 border border-border rounded-2xl p-4 space-y-3"
          >
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`text-xl p-1.5 rounded-lg transition-colors ${form.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input
              placeholder="Título da notícia"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="font-heading"
            />
            <Textarea
              placeholder="Conteúdo da notícia..."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              className="font-body text-sm"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  className="rounded"
                />
                Fixar em destaque
              </label>
              <div className="flex-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending} className="gap-1">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Publicar
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-10 text-muted-foreground font-body text-sm">
          Ainda não há notícias. Cria a primeira!
        </div>
      )}

      {[...pinned, ...regular].map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 space-y-1.5 ${post.pinned ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl">{post.emoji || "📢"}</span>
              <h3 className="font-heading font-bold text-sm truncate">{post.title}</h3>
              {post.pinned && (
                <span className="shrink-0 text-[10px] font-bold uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full">Destaque</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link to={`/noticias/${post.id}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => togglePinMutation.mutate({ id: post.id, pinned: !post.pinned })}
              >
                {post.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(post.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm font-body text-muted-foreground leading-relaxed">{post.content}</p>
          <p className="text-[11px] text-muted-foreground font-body">
            {format(new Date(post.created_date), "d MMM yyyy, HH:mm", { locale: pt })}
          </p>
        </motion.div>
      ))}
    </div>
  );
}