import React, { useState } from "react";
import { supabase } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ACTION_TYPES } from "@/lib/ecoConstants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDown, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";

export default function AdminReportPDF() {
  const [generating, setGenerating] = useState(false);

  // Pick month: current or previous
  const [monthOffset, setMonthOffset] = useState(0);
  const targetDate = subMonths(new Date(), monthOffset);
  const monthStart = format(startOfMonth(targetDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(targetDate), "yyyy-MM-dd");
  const monthLabel = format(targetDate, "MMMM yyyy", { locale: pt });

  const { data: actions = [] } = useQuery({
    queryKey: ["report-actions", monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('EcoAction')
        .select('*')
        .eq('status', 'aprovada')
        .order('created_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ["report-classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from('Classroom').select('*');
      if (error) throw error;
      return data;
    },
  });

  const monthActions = actions.filter((a) => {
    const d = a.created_date?.slice(0, 10);
    return d >= monthStart && d <= monthEnd;
  });

  const generatePDF = async () => {
    setGenerating(true);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(40, 140, 80);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Eco Rush – Relatório Mensal de Impacto Ecológico", pageW / 2, 9, { align: "center" });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Mês: ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 14, y + 4);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy")}`, pageW - 14, y + 4, { align: "right" });
    y += 14;

    // Summary KPIs
    const totalPts = monthActions.reduce((s, a) => s + (a.points || 0), 0);
    const trashCount = monthActions.filter((a) => a.action_type === "apanhar_lixo").length;
    const lightsCount = monthActions.filter((a) => a.action_type === "apagar_luzes").length;
    const recycleCount = monthActions.filter((a) => a.action_type === "reciclagem_correta").length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Resumo Global do Mês", 14, y);
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    const kpis = [
      ["Total de ações aprovadas", monthActions.length],
      ["Total de pontos gerados", totalPts],
      ["Lixo apanhado/deitado no lixo", trashCount],
      ["Luzes apagadas", lightsCount],
      ["Reciclagem correta", recycleCount],
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    kpis.forEach(([label, val]) => {
      doc.text(`• ${label}:`, 16, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(val), 110, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    });
    y += 4;

    // Per classroom
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Detalhes por Turma", 14, y);
    y += 5;
    doc.line(14, y, pageW - 14, y);
    y += 5;

    const sortedClassrooms = [...classrooms].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

    for (const cls of sortedClassrooms) {
      const clsActions = monthActions.filter((a) => a.classroom_id === cls.id);
      if (clsActions.length === 0) continue;

      // Check page space
      if (y > 260) { doc.addPage(); y = 20; }

      const clsPts = clsActions.reduce((s, a) => s + (a.points || 0), 0);

      // Classroom title bar
      doc.setFillColor(230, 245, 235);
      doc.rect(14, y - 3, pageW - 28, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 100, 55);
      doc.text(`Turma ${cls.name}`, 16, y + 2);
      doc.text(`${clsPts} pts (mês) | Total: ${cls.total_points || 0} pts`, pageW - 16, y + 2, { align: "right" });
      doc.setTextColor(40, 40, 40);
      y += 10;

      // Top actions for this classroom
      const countMap = {};
      clsActions.forEach((a) => { countMap[a.action_type] = (countMap[a.action_type] || 0) + 1; });
      const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      sorted.forEach(([key, cnt]) => {
        const label = ACTION_TYPES[key]?.label || key;
        doc.text(`  – ${label}`, 16, y);
        doc.text(`${cnt}x`, 100, y);
        y += 5;
      });
      y += 4;
    }

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`Eco Rush · Página ${i} de ${pages}`, pageW / 2, 290, { align: "center" });
    }

    doc.save(`eco-rush-relatorio-${format(targetDate, "yyyy-MM")}.pdf`);
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Exportar Relatório Mensal</h3>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Gera um PDF com resumo de impacto, pontuações e ações mais frequentes por turma.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-body text-muted-foreground">Mês:</span>
          <div className="flex gap-2">
            {[0, 1, 2].map((offset) => {
              const d = subMonths(new Date(), offset);
              const label = format(d, "MMM yyyy", { locale: pt });
              return (
                <button
                  key={offset}
                  onClick={() => setMonthOffset(offset)}
                  className={`px-3 py-1 rounded-lg text-xs font-body border transition-all ${
                    monthOffset === offset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="font-heading font-bold text-lg text-primary">{monthActions.length}</p>
            <p className="text-xs text-muted-foreground font-body">Ações</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="font-heading font-bold text-lg text-secondary">
              {monthActions.reduce((s, a) => s + (a.points || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground font-body">Pontos</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="font-heading font-bold text-lg">
              {new Set(monthActions.map((a) => a.classroom_id)).size}
            </p>
            <p className="text-xs text-muted-foreground font-body">Turmas ativas</p>
          </div>
        </div>

        <Button onClick={generatePDF} disabled={generating} className="w-full gap-2">
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> A gerar PDF...</>
          ) : (
            <><FileDown className="h-4 w-4" /> Exportar PDF – {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</>
          )}
        </Button>
      </Card>
    </div>
  );
}