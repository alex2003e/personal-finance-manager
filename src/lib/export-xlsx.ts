import ExcelJS from "exceljs";
import { formatCOP } from "@/lib/format";
import type { ReportData } from "@/lib/export-report";

export async function buildReportWorkbook(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Finanzas";
  wb.created = data.generatedAt;

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Concepto", key: "concepto", width: 32 },
    { header: "Valor", key: "valor", width: 22 },
  ];
  resumen.getRow(1).font = { bold: true };
  resumen.addRows([
    { concepto: "Ingreso mensual recurrente", valor: formatCOP(data.totalIncome) },
    { concepto: "Gastos fijos mensuales", valor: formatCOP(data.totalExpenses) },
    { concepto: "Presupuesto libre para deuda", valor: formatCOP(data.monthlyBudgetForDebt) },
    { concepto: "Deuda total activa", valor: formatCOP(data.totalDebt) },
    { concepto: "Meses estimados para saldar deuda", valor: data.monthsToClose || "—" },
    { concepto: "Liquidez en cuentas", valor: formatCOP(data.totalLiquidity) },
    { concepto: "Activos", valor: formatCOP(data.totalAssets) },
    { concepto: "Inversiones", valor: formatCOP(data.totalInvestments) },
    { concepto: "Patrimonio neto", valor: formatCOP(data.netWorth) },
  ]);

  const plan = wb.addWorksheet("Plan de pago (Avalancha)");
  plan.columns = [
    { header: "Mes", key: "month", width: 8 },
    { header: "Deuda", key: "name", width: 28 },
    { header: "Abono", key: "amount", width: 18 },
    { header: "Saldo restante", key: "remaining", width: 18 },
  ];
  plan.getRow(1).font = { bold: true };
  for (const m of data.planMonths) {
    for (const p of m.payments) {
      if (p.amount <= 0) continue;
      plan.addRow({
        month: m.month,
        name: p.name,
        amount: formatCOP(p.amount),
        remaining: formatCOP(p.remaining),
      });
    }
  }
  if (data.planMonths.length === 0) {
    plan.addRow({ month: "—", name: "Sin deudas activas o sin presupuesto disponible", amount: "", remaining: "" });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
