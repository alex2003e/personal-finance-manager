"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { quincenaFromDate } from "@/lib/quincena";

const accountSchema = z.object({
  name: z.string().min(1),
  bank: z.string().optional(),
  type: z.enum(["SAVINGS", "CHECKING", "CASH"]).default("SAVINGS"),
  balance: z.coerce.number().default(0),
});

export async function createAccount(input: z.infer<typeof accountSchema>) {
  const userId = await requireUserId();
  const data = accountSchema.parse(input);
  await prisma.account.create({ data: { ...data, userId } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function updateAccount(id: string, input: z.infer<typeof accountSchema>) {
  const userId = await requireUserId();
  const data = accountSchema.parse(input);
  await prisma.account.updateMany({ where: { id, userId }, data });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(id: string) {
  const userId = await requireUserId();
  const linked = await prisma.transaction.count({ where: { accountId: id, userId } });
  if (linked > 0) {
    throw new Error(
      "Esta cuenta tiene movimientos registrados; no se puede eliminar (podrías desactivarla en su lugar)."
    );
  }
  await prisma.account.deleteMany({ where: { id, userId } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
});

export async function transferBetweenAccounts(input: z.infer<typeof transferSchema>) {
  const userId = await requireUserId();
  const data = transferSchema.parse(input);
  if (data.fromAccountId === data.toAccountId) {
    throw new Error("Elige dos cuentas distintas");
  }

  const [from, to] = await Promise.all([
    prisma.account.findFirst({ where: { id: data.fromAccountId, userId } }),
    prisma.account.findFirst({ where: { id: data.toAccountId, userId } }),
  ]);
  if (!from || !to) throw new Error("Cuenta no encontrada");

  await prisma.$transaction([
    prisma.account.update({
      where: { id: from.id },
      data: { balance: { decrement: data.amount } },
    }),
    prisma.account.update({
      where: { id: to.id },
      data: { balance: { increment: data.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        date: data.date,
        quincena: quincenaFromDate(data.date),
        amount: data.amount,
        type: "TRANSFER",
        category: "Transferencia",
        notes: data.notes ?? `${from.name} → ${to.name}`,
        accountId: from.id,
      },
    }),
  ]);

  revalidatePath("/accounts");
  revalidatePath("/ledger");
  revalidatePath("/dashboard");
}
