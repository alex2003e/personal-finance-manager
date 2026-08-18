"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "richText" in (v as object)) {
    return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  return String(v).trim();
}

function cellNumber(v: ExcelJS.CellValue): number | null {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "result" in (v as object)) {
    const r = (v as { result?: unknown }).result;
    return typeof r === "number" ? r : null;
  }
  return null;
}

export interface ImportPreview {
  debts: { name: string; creditor: string; balance: number; interestRateEA: number; minPayment: number }[];
  expenses: { name: string; amount: number }[];
  incomes: { name: string; amount: number }[];
}

const SKIP_LABELS = new Set([
  "",
  "rubro",
  "total gastos fijos",
  "ingresos",
  "total ingresos",
  "total cuotas tarjetas",
  "cuotas de tarjetas (mientras estén activas)",
  "acreedor",
  "gastos fijos mensuales",
]);

export async function parseExcelPreview(buffer: ArrayBuffer): Promise<ImportPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const debts: ImportPreview["debts"] = [];
  const expenses: ImportPreview["expenses"] = [];
  const incomes: ImportPreview["incomes"] = [];

  const debtsSheet = workbook.getWorksheet("Deudas");
  if (debtsSheet) {
    debtsSheet.eachRow((row, rowNumber) => {
      if (rowNumber < 5) return;
      const name = cellText(row.getCell(2).value);
      const lower = name.toLowerCase();
      if (!name || lower === "total") return;
      const balance = cellNumber(row.getCell(3).value);
      const rate = cellNumber(row.getCell(4).value);
      const minPayment = cellNumber(row.getCell(5).value);
      if (balance == null) return;
      debts.push({
        name,
        creditor: name,
        balance,
        interestRateEA: rate != null ? Number((rate * 100).toFixed(4)) : 0,
        minPayment: minPayment ?? 0,
      });
    });
  }

  const gastosSheet = workbook.getWorksheet("Gastos Fijos");
  if (gastosSheet) {
    // La hoja tiene 3 tablas apiladas: Gastos Fijos, Ingresos, y Cuotas de
    // Tarjetas (esta última es solo informativa: esas cuotas ya se manejan
    // como parte de la deuda, no deben importarse como gasto recurrente aparte).
    let inCuotasTarjetas = false;
    gastosSheet.eachRow((row, rowNumber) => {
      if (rowNumber < 5) return;
      const label = cellText(row.getCell(2).value);
      const lower = label.toLowerCase();

      if (lower.includes("cuotas de tarjetas")) {
        inCuotasTarjetas = true;
        return;
      }
      if (inCuotasTarjetas) return;
      if (SKIP_LABELS.has(lower)) return;

      const value = cellNumber(row.getCell(3).value);
      if (value == null) return;

      if (lower === "ingreso fijo neto" || lower.startsWith("ingreso variable")) {
        incomes.push({ name: label, amount: value });
      } else {
        expenses.push({ name: label, amount: value });
      }
    });
  }

  return { debts, expenses, incomes };
}

export async function importFromExcel(formData: FormData) {
  const userId = await requireUserId();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No se recibió ningún archivo");

  const buffer = await file.arrayBuffer();
  const preview = await parseExcelPreview(buffer);

  await prisma.$transaction(async (tx) => {
    for (const d of preview.debts) {
      await tx.debt.create({
        data: {
          userId,
          name: d.name,
          creditor: d.creditor,
          balance: d.balance,
          interestRateEA: d.interestRateEA,
          minPayment: d.minPayment,
          type: "CARD",
        },
      });
    }

    for (const e of preview.expenses) {
      await tx.recurringItem.create({
        data: {
          userId,
          name: e.name,
          category: e.name,
          amount: e.amount,
          frequency: "MONTHLY",
          type: "EXPENSE",
        },
      });
    }

    for (const i of preview.incomes) {
      await tx.recurringItem.create({
        data: {
          userId,
          name: i.name,
          category: i.name,
          amount: i.amount,
          frequency: "MONTHLY",
          type: "INCOME",
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/debts");
  revalidatePath("/recurring");

  return preview;
}
