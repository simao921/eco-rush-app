import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Trophy, LogOut, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassroom } from "@/lib/classroomContext.jsx";
import { toast } from "sonner";

export default function EcoHeader() {
  const { classroom, exitClassroom, saveSessionLong } = useClassroom();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleExit = () => {
    exitClassroom();
    navigate("/");
  };

  const handleSaveSession = () => {
    if (classroom) {
      saveSessionLong(classroom);
      setSaved(true);
      toast.success("✅ Sessão guardada por 30 dias! Podes fechar o browser.");
      setTimeout(() => setSaved(false), 4000);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md shadow-primary/25">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">Eco Rush</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/ranking">
            <Button variant="ghost" size="sm" className="gap-2 font-body text-muted-foreground hover:text-foreground">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Ranking</span>
            </Button>
          </Link>

          {classroom && (
            <>
              <Link to="/turma">
                <Button variant="ghost" size="sm" className="gap-1.5 font-body flex flex-col items-start leading-none h-11">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md bg-primary/15 flex items-center justify-center">
                      <Leaf className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm">{classroom.name}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black pl-6">
                    {classroom.cycle === '1_ciclo' ? '1º Ciclo' : classroom.cycle === '3_ciclo' ? '3º Ciclo' : '2º Ciclo'}
                  </span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveSession}
                title="Guardar sessão por 30 dias"
                className={`transition-colors ${saved ? "text-green-500" : "text-muted-foreground hover:text-primary"}`}
              >
                <BookmarkCheck className="h-4 w-4" />
                <span className="hidden sm:inline ml-1 text-xs">{saved ? "Guardado!" : "30 dias"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExit}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}