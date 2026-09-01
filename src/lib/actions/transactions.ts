"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { quincenaFromDate } from "@/lib/quincena";
import { toCOP, fromCOP } from "@/lib/currency";
import { toNumber } from "@/lib/format";

const schema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("COP"),
  exchangeRateToCOP: z.coerce.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE", "DEBT_PAYMENT", "TRANSFER", "SAVINGS"]),
  category: z.string().min(1),
  notes: z.string().optional(),
  debtId: z.string().optional(),
  accountId: z.string().optional(),
});

export async function createTransaction(input: z.input<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  const amountCOP = toCOP(data.amount, data.currency, data.exchangeRateToCOP);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        date: data.date,
        quincena: quincenaFromDate(data.date),
        amount: data.amount,
        currency: data.currency,
        exchangeRateToCOP: data.currency !== "COP" ? data.exchangeRateToCOP : undefined,
        type: data.type,
        category: data.category,
        notes: data.notes,
        debtId: data.debtId || undefined,
        accountId: data.accountId || undefined,
      },
    });

    if (data.type === "DEBT_PAYMENT" && data.debtId) {
      const debt = await tx.debt.findFirstOrThrow({ where: { id: data.debtId, userId } });
      const amountInDebtCurrency = fromCOP(
        amountCOP,
        debt.currency,
        debt.exchangeRateToCOP ? toNumber(debt.exchangeRateToCOP) : null
      );
      await tx.debt.update({
        where: { id: data.debtId },
        data: { balance: { decrement: amountInDebtCurrency } },
      });
      const updated = await tx.debt.findUnique({ where: { id: data.debtId } });
      if (updated && Number(updated.balance) <= 0 && !updated.closedAt) {
        await tx.debt.update({ where: { id: data.debtId }, data: { closedAt: new Date() } });
      }
    }

    if (data.accountId) {
      const account = await tx.account.findFirstOrThrow({ where: { id: data.accountId, userId } });
      const amountInAccountCurrency = fromCOP(
        amountCOP,
        account.currency,
        account.exchangeRateToCOP ? toNumber(account.exchangeRateToCOP) : null
      );
      // El ingreso suma a la cuenta; cualquier otro tipo (gasto, pago de
      // deuda, ahorro, transferencia) sale de la cuenta.
      const delta = data.type === "INCOME" ? amountInAccountCurrency : -amountInAccountCurrency;
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: delta } },
      });
    }
  });

  revalidatePath("/ledger");
  revalidatePath("/debts");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();

  const txn = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!txn) return;

  if (txn.cardChargeId) {
    throw new Error(
      "Este movimiento pertenece a una compra con cuotas; gestiónalo desde la tarjeta en Deudas."
    );
  }

  const amountCOP = toCOP(
    toNumber(txn.amount),
    txn.currency,
    txn.exchangeRateToCOP ? toNumber(txn.exchangeRateToCOP) : null
  );

  await prisma.$transaction(async (tx) => {
    if (txn.type === "DEBT_PAYMENT" && txn.debtId) {
      const debt = await tx.debt.findFirst({ where: { id: txn.debtId, userId } });
      if (debt) {
        const amountInDebtCurrency = fromCOP(
          amountCOP,
          debt.currency,
          debt.exchangeRateToCOP ? toNumber(debt.exchangeRateToCOP) : null
        );
        await tx.debt.update({
          where: { id: txn.debtId },
          data: { balance: { increment: amountInDebtCurrency }, closedAt: null },
        });
      }
    }
    if (txn.accountId) {
      const account = await tx.account.findFirst({ where: { id: txn.accountId, userId } });
      if (account) {
        const amountInAccountCurrency = fromCOP(
          amountCOP,
          account.currency,
          account.exchangeRateToCOP ? toNumber(account.exchangeRateToCOP) : null
        );
        const delta = txn.type === "INCOME" ? -amountInAccountCurrency : amountInAccountCurrency;
        await tx.account.update({
          where: { id: txn.accountId },
          data: { balance: { increment: delta } },
        });
      }
    }
    await tx.transaction.delete({ where: { id } });
  });

  revalidatePath("/ledger");
  revalidatePath("/debts");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function listTransactionsForMonth(year: number, month: number) {
  const userId = await requireUserId();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
    include: { debt: true },
  });
}
