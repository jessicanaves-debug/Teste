import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Metrics {
  identificados: string;
  inativos: string;
  ocorrencias: string;
  notificados: string;
  eliminados: string;
  notificacoesEnviadas: string;
}

interface HeatmapEntry {
  nome: string;
  score: string;
}

interface ContentionAction {
  domain: string;
  status: string;
}

interface StandbyCase {
  agressor: string;
  status: string;
  nextAction: string;
}

interface GenerateBbPdfParams {
  clientName: string;
  reportType: "Semanal" | "Quinzenal";
  periodDays: string;
  periodLabel: string;
  metrics: Metrics;
  agressoresNovos: string;
  agressoresTotal: string;
  section1Text: string;
  section2Text: string;
  section3Text: string;
  heatmap: HeatmapEntry[];
  contentionActions: ContentionAction[];
  standbyCases: StandbyCase[];
  awaitingApproval: string;
  resolved: string;
  imageAgressores: File | null;
  imageHeatmap: File | null;
}

// Cor da Branddi (header escuro)
const BRANDDI_DARK = "#0d3349";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateBbPdf(params: GenerateBbPdfParams): Promise<void> {
  const {
    clientName,
    reportType,
    periodDays,
    periodLabel,
    metrics,
    agressoresNovos,
    agressoresTotal,
    section1Text,
    section2Text,
    section3Text,
    heatmap,
    contentionActions,
    standbyCases,
    awaitingApproval,
    resolved,
    imageAgressores,
    imageHeatmap,
  } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 0;

  // ─── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(BRANDDI_DARK);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("BRANDDI MONITOR", margin, 12);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório ${reportType} de Brand Bidding`, margin, 22);

  if (clientName) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, margin, 29);
  }

  if (periodLabel) {
    doc.setFontSize(9);
    doc.text(`Período: ${periodLabel}`, pageWidth - margin, 29, { align: "right" });
  }

  y = 45;
  doc.setTextColor(20, 20, 20);

  // ─── Section 1: Métricas ──────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`1. Métricas Consolidadas (Últimos ${periodDays} dias)`, margin, y);
  y += 6;

  if (section1Text) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section1Text, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  }

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Identificados",
        "Inativos",
        "Ocorrências",
        "Notificados",
        "Eliminados",
        "Notif. Enviadas",
      ],
    ],
    body: [
      [
        metrics.identificados || "—",
        metrics.inativos || "—",
        metrics.ocorrencias || "—",
        metrics.notificados || "—",
        metrics.eliminados || "—",
        metrics.notificacoesEnviadas || "—",
      ],
    ],
    headStyles: { fillColor: BRANDDI_DARK, textColor: 255, halign: "center" },
    bodyStyles: { halign: "center", fontStyle: "bold", fontSize: 11 },
    theme: "grid",
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error - lastAutoTable é adicionado dinamicamente pelo plugin
  y = doc.lastAutoTable.finalY + 10;

  // ─── Section 2: Agressores ────────────────────────────────────────────────
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Agressores Identificados", margin, y);
  y += 6;

  const text2 =
    section2Text ||
    `Durante as últimas ${reportType === "Semanal" ? "semana" : "duas semanas"}, foram identificados ${agressoresNovos || "—"} novos agressores, elevando o total para ${agressoresTotal || "—"} agressores ativos no período.`;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const text2Lines = doc.splitTextToSize(text2, pageWidth - 2 * margin);
  doc.text(text2Lines, margin, y);
  y += text2Lines.length * 5 + 4;

  if (imageAgressores) {
    try {
      const dataUrl = await fileToDataUrl(imageAgressores);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 70;
      if (y + imgHeight > 280) {
        doc.addPage();
        y = 20;
      }
      doc.addImage(dataUrl, "PNG", margin, y, imgWidth, imgHeight);
      y += imgHeight + 6;
    } catch (e) {
      console.warn("Erro ao adicionar imagem de agressores:", e);
    }
  }

  // ─── Section 3: Heatmap ───────────────────────────────────────────────────
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. Análise de Ofensores (Heatmap)", margin, y);
  y += 6;

  if (section3Text) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section3Text, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  if (imageHeatmap) {
    try {
      const dataUrl = await fileToDataUrl(imageHeatmap);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 70;
      if (y + imgHeight > 280) {
        doc.addPage();
        y = 20;
      }
      doc.addImage(dataUrl, "PNG", margin, y, imgWidth, imgHeight);
      y += imgHeight + 6;
    } catch (e) {
      console.warn("Erro ao adicionar imagem do heatmap:", e);
    }
  }

  if (heatmap.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    autoTable(doc, {
      startY: y,
      head: [["Score", "Domínio"]],
      body: heatmap.map((h) => [h.score, h.nome]),
      headStyles: { fillColor: BRANDDI_DARK, textColor: 255 },
      theme: "striped",
      margin: { left: margin, right: margin },
    });
    // @ts-expect-error - lastAutoTable é adicionado dinamicamente pelo plugin
    y = doc.lastAutoTable.finalY + 10;
  }

  // ─── Section 4: Contenção ─────────────────────────────────────────────────
  const validActions = contentionActions.filter((a) => a.domain.trim());
  if (validActions.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("4. Status das Ações de Contenção", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Agressor", "Status"]],
      body: validActions.map((a) => [a.domain, a.status]),
      headStyles: { fillColor: BRANDDI_DARK, textColor: 255 },
      theme: "striped",
      margin: { left: margin, right: margin },
    });
    // @ts-expect-error - lastAutoTable é adicionado dinamicamente pelo plugin
    y = doc.lastAutoTable.finalY + 10;
  }

  // ─── Section 5: Standby ───────────────────────────────────────────────────
  const validStandby = standbyCases.filter((c) => c.agressor.trim());
  if (validStandby.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("5. Casos em Standby e em Notificação Extrajudicial", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Agressor", "Status", "Próxima Ação"]],
      body: validStandby.map((c) => [c.agressor, c.status, c.nextAction]),
      headStyles: { fillColor: BRANDDI_DARK, textColor: 255 },
      theme: "striped",
      margin: { left: margin, right: margin },
    });
    // @ts-expect-error - lastAutoTable é adicionado dinamicamente pelo plugin
    y = doc.lastAutoTable.finalY + 10;
  }

  // ─── Section 6: Aguardando Aprovação ──────────────────────────────────────
  const approvalList = awaitingApproval.split("\n").map((l) => l.trim()).filter(Boolean);
  if (approvalList.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("6. Agressores Aguardando Aprovação", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    approvalList.forEach((d) => {
      doc.text(`• ${d}`, margin, y);
      y += 5;
    });
    y += 4;
  }

  // ─── Section 7: Resolvidos ────────────────────────────────────────────────
  const resolvedList = resolved.split("\n").map((l) => l.trim()).filter(Boolean);
  if (resolvedList.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("7. Agressores Resolvidos (Sucesso)", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    resolvedList.forEach((d) => {
      doc.text(`• ${d}`, margin, y);
      y += 5;
    });
  }

  // ─── Salvar ───────────────────────────────────────────────────────────────
  const fileName = `relatorio-brand-bidding-${clientName || "cliente"}-${Date.now()}.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-");
  doc.save(fileName);
}
