import React, { useState, useEffect, useRef } from "react";
import { getPointsLevel } from "@/lib/ecoConstants";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function CertificatePDF({ classroom, points }) {
  const [generating, setGenerating] = useState(false);
  const prevLevelRef = useRef(null);
  const [newLevelUnlocked, setNewLevelUnlocked] = useState(null);
  const { label } = getPointsLevel(points || 0);

  useEffect(() => {
    const currentLevel = getPointsLevel(points || 0).level;
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      setNewLevelUnlocked({ level: currentLevel, label: getPointsLevel(points || 0).label });
    }
    prevLevelRef.current = currentLevel;
  }, [points]);

  const generatePDF = () => {
    try {
      setGenerating(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297;
      const H = 210;

      // Background - Off-white / Cream
      doc.setFillColor(255, 255, 250);
      doc.rect(0, 0, W, H, "F");

      // Main Borders
      doc.setDrawColor(21, 128, 61);
      doc.setLineWidth(1);
      doc.rect(5, 5, W - 10, H - 10, "D");
      
      doc.setLineWidth(3);
      doc.rect(8, 8, W - 16, H - 16, "D");

      // Corner Decoration
      doc.setDrawColor(180, 150, 50);
      doc.setLineWidth(0.5);
      doc.line(10, 10, 25, 10); doc.line(10, 10, 10, 25);
      doc.line(W-10, 10, W-25, 10); doc.line(W-10, 10, W-10, 25);
      doc.line(10, H-10, 25, H-10); doc.line(10, H-10, 10, H-25);
      doc.line(W-10, H-10, W-25, H-10); doc.line(W-10, H-10, W-10, H-25);

      // Seal
      doc.setFillColor(180, 150, 50);
      doc.triangle(240, 150, 250, 190, 260, 150, "F");
      doc.triangle(255, 150, 265, 190, 275, 150, "F");
      doc.circle(257, 155, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ECO RUSH", 257, 153, { align: "center" });
      doc.text("OFICIAL", 257, 158, { align: "center" });

      // Texts
      doc.setTextColor(21, 128, 61);
      doc.setFontSize(14);
      doc.text("PROGRAMA NACIONAL ECO-ESCOLAS", W/2, 25, { align: "center" });

      doc.setFontSize(48);
      doc.setTextColor(15, 80, 40);
      doc.text("CERTIFICADO", W / 2, 50, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(180, 150, 50);
      doc.text("MERITO E SUSTENTABILIDADE", W / 2, 62, { align: "center" });

      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("Este diploma e orgulhosamente atribuido a", W / 2, 85, { align: "center" });

      doc.setTextColor(21, 128, 61);
      doc.setFontSize(40);
      doc.setFont("helvetica", "bold");
      const cleanName = (classroom.name || "Turma").toUpperCase();
      doc.text(cleanName, W / 2, 105, { align: "center" });

      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("pela conquista do nivel de excelencia ambiental", W / 2, 122, { align: "center" });

      doc.setTextColor(15, 80, 40);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text(label, W / 2, 138, { align: "center" });

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(13);
      doc.setFont("helvetica", "italic");
      doc.text("Demonstrando um compromisso exemplar com a preservacao do planeta", W / 2, 150, { align: "center" });
      doc.text(`atraves de acoes diretas e ${points} pontos acumulados.`, W / 2, 157, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(40, 185, 120, 185);
      doc.line(177, 185, 257, 185);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("A Coordenacao Eco-Rush", 80, 192, { align: "center" });
      doc.text(format(new Date(), "d 'de' MMMM 'de' yyyy"), 217, 192, { align: "center" });

      doc.save(`Certificado_${classroom.name || "Turma"}.pdf`);
      setGenerating(false);
      setNewLevelUnlocked(null);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Nao foi possivel gerar o certificado. Tenta novamente num computador.");
      setGenerating(false);
    }
  };

  return (
    <div className={`rounded-3xl border-2 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all ${
      newLevelUnlocked
        ? "border-yellow-400 bg-yellow-50/50 shadow-lg shadow-yellow-200/50 scale-[1.02]"
        : "border-primary/10 bg-gradient-to-br from-primary/5 to-transparent"
    }`}>
      {newLevelUnlocked && (
        <div className="absolute top-[-20px] right-[-20px] w-16 h-16 bg-yellow-400 rotate-45 flex items-end justify-center pb-1">
             <Award className="text-white h-5 w-5 -rotate-45" />
        </div>
      )}
      
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${newLevelUnlocked ? "bg-yellow-400 text-white" : "bg-primary/10 text-primary"}`}>
          <Award className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          {newLevelUnlocked ? (
            <>
              <p className="font-heading font-black text-yellow-700 text-lg">🎉 NOVO NIVEL!</p>
              <p className="text-sm text-yellow-600/80 font-medium">{newLevelUnlocked.label} desbloqueado</p>
            </>
          ) : (
            <>
              <p className="font-heading font-bold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground font-medium">Nivel atual da turma</p>
            </>
          )}
        </div>
      </div>

      <Button 
        size="lg" 
        onClick={generatePDF} 
        disabled={generating} 
        className={`gap-3 px-8 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${
            newLevelUnlocked 
            ? "bg-yellow-500 hover:bg-yellow-600 text-white animate-bounce" 
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        <Download className="h-5 w-5" />
        {generating ? "A preparar..." : "Descarregar Diploma"}
      </Button>
    </div>
  );
}
