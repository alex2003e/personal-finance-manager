import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCOP } from "@/lib/format";
import type { ReportData } from "@/lib/export-report";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function buildReportPdf(data: ReportData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function ensureSpace(lineHeight: number) {
    if (y - lineHeight < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function heading(text: string) {
    ensureSpace(28);
    y -= 22;
    page.drawText(text, { x: MARGIN, y, size: 15, font: fontBold, color: rgb(0.05, 0.09, 0.13) });
    y -= 6;
  }

  function row(label: string, value: string) {
    ensureSpace(18);
    y -= 16;
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: rgb(0.3, 0.3, 0.35) });
    page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(value, 10),
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.05, 0.09, 0.13),
    });
  }

  page.drawText("Finanzas — Reporte financiero", {
    x: MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.05, 0.59, 0.53),
  });
  y -= 16;
  page.drawText(
    `Generado el ${data.generatedAt.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    { x: MARGIN, y, size: 9, font, color: rgb(0.45, 0.45, 0.5) }
  );

  heading("Resumen general");
  row("Ingreso mensual recurrente", formatCOP(data.totalIncome));
  row("Gastos fijos mensuales", formatCOP(data.totalExpenses));
  row("Presupuesto libre para deuda", formatCOP(data.monthlyBudgetForDebt));
  row("Deuda total activa", formatCOP(data.totalDebt));
  row("Meses estimados para saldar deuda", data.monthsToClose ? String(data.monthsToClose) : "—");
  row("Liquidez en cuentas", formatCOP(data.totalLiquidity));
  row("Activos", formatCOP(data.totalAssets));
  row("Inversiones", formatCOP(data.totalInvestments));
  row("Patrimonio neto", formatCOP(data.netWorth));

  heading("Deudas activas");
  if (data.activeDebts.length === 0) {
    ensureSpace(16);
    y -= 16;
    page.drawText("No tienes deudas activas registradas.", {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.35),
    });
  } else {
    for (const d of data.activeDebts) {
      row(`${d.name} (${d.interestRateEA.toFixed(2)}% EA)`, formatCOP(d.balance));
    }
  }

  heading("Plan de pago sugerido (estrategia Avalancha)");
  if (data.planMonths.length === 0) {
    ensureSpace(16);
    y -= 16;
    page.drawText("No hay presupuesto disponible o deudas activas para simular un plan.", {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.35),
    });
  } else {
    for (const m of data.planMonths) {
      ensureSpace(16);
      y -= 16;
      page.drawText(`Mes ${m.month}`, { x: MARGIN, y, size: 10, font: fontBold, color: rgb(0.05, 0.09, 0.13) });
      page.drawText(
        `Saldo restante total: ${formatCOP(m.totalRemaining)}`,
        {
          x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(`Saldo restante total: ${formatCOP(m.totalRemaining)}`, 10),
          y,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.35),
        }
      );
      for (const p of m.payments) {
        if (p.amount <= 0) continue;
        ensureSpace(14);
        y -= 14;
        page.drawText(`  ${p.name}: ${formatCOP(p.amount)}`, {
          x: MARGIN + 8,
          y,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.4),
        });
      }
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
