import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Trophy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassroom } from "@/lib/classroomContext.jsx";

export default function EcoHeader() {
  const { classroom, exitClassroom } = useClassroom();
  const navigate = useNavigate();

  const handleExit = () => {
    exitClassroom();
    navigate("/");
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
                <Button variant="ghost" size="sm" className="gap-1.5 font-body">
                  <div className="h-5 w-5 rounded-md bg-primary/15 flex items-center justify-center">
                    <Leaf className="h-3 w-3 text-primary" />
                  </div>
                  <span className="hidden sm:inline font-medium">{classroom.name}</span>
                </Button>
              </Link>
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