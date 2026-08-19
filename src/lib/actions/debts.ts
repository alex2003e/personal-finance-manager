"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { quincenaFromDate } from "@/lib/quincena";

const debtSchema = z.object({
  name: z.string().min(1),
  creditor: z.string().min(1),
  balance: z.coerce.number().nonnegative(),
  interestRateEA: z.coerce.number().nonnegative(),
  minPayment: z.coerce.number().nonnegative(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  currency: z.string().default("COP"),
  exchangeRateToCOP: z.coerce.number().positive().optional(),
  type: z.enum(["CARD", "LOAN"]).default("CARD"),
});

export async function createDebt(input: z.infer<typeof debtSchema>) {
  const userId = await requireUserId();
  const data = debtSchema.parse(input);
  await prisma.debt.create({ data: { ...data, userId } });
  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

export async function updateDebt(id: string, input: z.infer<typeof debtSchema>) {
  const userId = await requireUserId();
  const data = debtSchema.parse(input);
  await prisma.debt.updateMany({ where: { id, userId }, data });
  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

export async function deleteDebt(id: string) {
  const userId = await requireUserId();
  await prisma.debt.deleteMany({ where: { id, userId } });
  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

const paymentSchema = z.object({
  debtId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
  accountId: z.string().optional(),
});

export async function payDebt(input: z.infer<typeof paymentSchema>) {
  const userId = await requireUserId();
  const { debtId, amount, date, notes, accountId } = paymentSchema.parse(input);

  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  if (!debt) throw new Error("Deuda no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        date,
        quincena: quincenaFromDate(date),
        amount,
        type: "DEBT_PAYMENT",
        category: "Pago tarjeta",
        debtId,
        accountId: accountId || undefined,
        notes,
      },
    });
    await tx.debt.update({
      where: { id: debtId },
      data: { balance: { decrement: amount } },
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    }
  });

  const updated = await prisma.debt.findUnique({ where: { id: debtId } });
  if (updated && Number(updated.balance) <= 0 && !updated.closedAt) {
    await prisma.debt.update({ where: { id: debtId }, data: { closedAt: new Date() } });
  }

  revalidatePath("/debts");
  revalidatePath("/ledger");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
