"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { quincenaFromDate } from "@/lib/quincena";

export interface ParsedBankRow {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // siempre positivo
  type: "INCOME" | "EXPENSE";
}

const DATE_COLUMN_NAMES = ["fecha", "date", "fecha transaccion", "fecha movimiento", "fecha operacion"];
const DESCRIPTION_COLUMN_NAMES = ["descripcion", "detalle", "concepto", "description", "observaciones", "referencia"];
const AMOUNT_COLUMN_NAMES = ["valor", "monto", "amount", "valor total", "importe"];
const DEBIT_COLUMN_NAMES = ["debito", "cargo", "valor debito", "egreso", "retiro"];
const CREDIT_COLUMN_NAMES = ["credito", "abono", "valor credito", "ingreso", "deposito"];

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(s: string): string {
  return stripAccents(s.trim().toLowerCase());
}

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const c of candidates) {
    const count = headerLine.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const negative = s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  s = s.replace(/[()]/g, "").replace(/^-/, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const decimalsLen = s.length - lastComma - 1;
    s = decimalsLen === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot !== -1) {
    const decimalsLen = s.length - lastDot - 1;
    if (decimalsLen === 3) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }
  return null;
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Parsea un CSV genérico de extracto bancario. No persiste nada. */
export async function parseBankCsv(csvText: string): Promise<ParsedBankRow[]> {
  await requireUserId();

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);

  const dateIdx = findColumn(headers, DATE_COLUMN_NAMES);
  const descIdx = findColumn(headers, DESCRIPTION_COLUMN_NAMES);
  const amountIdx = findColumn(headers, AMOUNT_COLUMN_NAMES);
  const debitIdx = findColumn(headers, DEBIT_COLUMN_NAMES);
  const creditIdx = findColumn(headers, CREDIT_COLUMN_NAMES);

  if (dateIdx === -1 || (amountIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
    throw new Error(
      "No se pudieron identificar las columnas de fecha y valor en el archivo. Revisa que tenga encabezados como 'Fecha' y 'Valor' (o 'Débito'/'Crédito')."
    );
  }

  const rows: ParsedBankRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const date = parseDate(cells[dateIdx] ?? "");
    if (!date) continue;

    const description = descIdx !== -1 ? cells[descIdx] ?? "" : "Movimiento importado";

    let amount: number | null = null;
    let type: "INCOME" | "EXPENSE" = "EXPENSE";

    if (amountIdx !== -1) {
      const parsed = parseAmount(cells[amountIdx] ?? "");
      if (parsed == null) continue;
      amount = Math.abs(parsed);
      type = parsed >= 0 ? "INCOME" : "EXPENSE";
    } else {
      const debit = debitIdx !== -1 ? parseAmount(cells[debitIdx] ?? "") : null;
      const credit = creditIdx !== -1 ? parseAmount(cells[creditIdx] ?? "") : null;
      if (credit && credit > 0) {
        amount = credit;
        type = "INCOME";
      } else if (debit && debit > 0) {
        amount = debit;
        type = "EXPENSE";
      } else {
        continue;
      }
    }

    if (amount == null || amount === 0) continue;
    rows.push({ date, description: description || "Movimiento importado", amount, type });
  }

  return rows;
}

const importSchema = z.object({
  accountId: z.string().min(1),
  rows: z.array(
    z.object({
      date: z.coerce.date(),
      description: z.string().min(1),
      category: z.string().min(1),
      amount: z.coerce.number().positive(),
      type: z.enum(["INCOME", "EXPENSE"]),
    })
  ),
});

export async function importBankTransactions(input: z.input<typeof importSchema>) {
  const userId = await requireUserId();
  const data = importSchema.parse(input);

  const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) throw new Error("Cuenta no encontrada");

  // Evita duplicados si el usuario vuelve a importar el mismo extracto.
  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      accountId: data.accountId,
      date: { gte: new Date(Math.min(...data.rows.map((r) => r.date.getTime()))) },
    },
  });
  const existingKeys = new Set(
    existing.map((t) => `${t.date.toISOString().slice(0, 10)}|${Number(t.amount)}|${t.type}`)
  );

  const toInsert = data.rows.filter(
    (r) => !existingKeys.has(`${r.date.toISOString().slice(0, 10)}|${r.amount}|${r.type}`)
  );

  let netDelta = 0;
  await prisma.$transaction(async (tx) => {
    for (const r of toInsert) {
      await tx.transaction.create({
        data: {
          userId,
          date: r.date,
          quincena: quincenaFromDate(r.date),
          amount: r.amount,
          type: r.type,
          category: r.category,
          notes: r.description,
          accountId: data.accountId,
        },
      });
      netDelta += r.type === "INCOME" ? r.amount : -r.amount;
    }
    if (netDelta !== 0) {
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: netDelta } },
      });
    }
  });

  revalidatePath("/ledger");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return { imported: toInsert.length, skipped: data.rows.length - toInsert.length };
}
