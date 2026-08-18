"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { quincenaFromDate } from "@/lib/quincena";
import { computeMonthlyPayment, applyInstallmentPayment } from "@/lib/calc/installments";

const chargeSchema = z.object({
  debtId: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  purchaseDate: z.coerce.date().default(() => new Date()),
  amount: z.coerce.number().positive(),
  installments: z.coerce.number().int().positive().default(1),
  interestRateEA: z.coerce.number().nonnegative(),
});

export async function createCardCharge(input: z.infer<typeof chargeSchema>) {
  const userId = await requireUserId();
  const data = chargeSchema.parse(input);

  const debt = await prisma.debt.findFirst({ where: { id: data.debtId, userId } });
  if (!debt) throw new Error("Tarjeta no encontrada");

  const monthlyPayment = computeMonthlyPayment(
    data.amount,
    data.interestRateEA,
    data.installments
  );

  await prisma.$transaction(async (tx) => {
    const created = await tx.cardCharge.create({
      data: {
        userId,
        debtId: data.debtId,
        description: data.description,
        category: data.category,
        purchaseDate: data.purchaseDate,
        originalAmount: data.amount,
        remainingBalance: data.amount,
        installmentsCount: data.installments,
        interestRateEA: data.interestRateEA,
        monthlyPayment,
      },
    });

    await tx.debt.update({
      where: { id: data.debtId },
      data: { balance: { increment: data.amount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        date: data.purchaseDate,
        quincena: quincenaFromDate(data.purchaseDate),
        amount: data.amount,
        type: "CARD_CHARGE",
        category: data.category,
        notes: data.description,
        debtId: data.debtId,
        cardChargeId: created.id,
      },
    });
  });

  revalidatePath("/debts");
  revalidatePath("/dashboard");
}

const payInstallmentSchema = z.object({
  chargeId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  date: z.coerce.date().default(() => new Date()),
  accountId: z.string().optional(),
});

export async function payCardInstallment(input: z.input<typeof payInstallmentSchema>) {
  const userId = await requireUserId();
  const { chargeId, amount, date, accountId } = payInstallmentSchema.parse(input);

  const charge = await prisma.cardCharge.findFirst({ where: { id: chargeId, userId } });
  if (!charge) throw new Error("Compra no encontrada");

  const paymentAmount = amount ?? Number(charge.monthlyPayment);
  const { principal, newRemainingBalance } = applyInstallmentPayment(
    Number(charge.remainingBalance),
    Number(charge.interestRateEA),
    paymentAmount
  );

  await prisma.$transaction(async (tx) => {
    await tx.cardCharge.update({
      where: { id: chargeId },
      data: {
        remainingBalance: newRemainingBalance,
        installmentsPaid: { increment: 1 },
      },
    });
    await tx.debt.update({
      where: { id: charge.debtId },
      data: { balance: { decrement: principal } },
    });
    await tx.transaction.create({
      data: {
        userId,
        date,
        quincena: quincenaFromDate(date),
        amount: paymentAmount,
        type: "DEBT_PAYMENT",
        category: "Pago tarjeta",
        notes: `Cuota: ${charge.description}`,
        debtId: charge.debtId,
        cardChargeId: chargeId,
        accountId: accountId || undefined,
      },
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: paymentAmount } },
      });
    }
  });

  const debt = await prisma.debt.findUnique({ where: { id: charge.debtId } });
  if (debt && Number(debt.balance) <= 0 && !debt.closedAt) {
    await prisma.debt.update({ where: { id: debt.id }, data: { closedAt: new Date() } });
  }

  revalidatePath("/debts");
  revalidatePath("/ledger");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteCardCharge(id: string) {
  const userId = await requireUserId();
  const charge = await prisma.cardCharge.findFirst({ where: { id, userId } });
  if (!charge) return;

  if (charge.installmentsPaid > 0) {
    throw new Error(
      "Esta compra ya tiene cuotas pagadas; no se puede eliminar para no descuadrar el saldo."
    );
  }

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { cardChargeId: id } }),
    prisma.debt.update({
      where: { id: charge.debtId },
      data: { balance: { decrement: charge.originalAmount } },
    }),
    prisma.cardCharge.delete({ where: { id } }),
  ]);

  revalidatePath("/debts");
  revalidatePath("/dashboard");
}
