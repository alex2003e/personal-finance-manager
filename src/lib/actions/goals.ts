"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(["EMERGENCY_FUND", "DEBT_FREE", "NET_WORTH", "CUSTOM"]),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().nonnegative().default(0),
  targetDate: z.coerce.date().optional(),
  targetMonths: z.coerce.number().int().positive().optional(),
});

export async function createGoal(input: z.infer<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  await prisma.goal.create({ data: { ...data, userId } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function updateGoal(id: string, input: z.infer<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  await prisma.goal.updateMany({ where: { id, userId }, data });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function updateGoalProgress(id: string, currentAmount: number) {
  const userId = await requireUserId();
  await prisma.goal.updateMany({ where: { id, userId }, data: { currentAmount } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(id: string) {
  const userId = await requireUserId();
  await prisma.goal.deleteMany({ where: { id, userId } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

const contributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
});

export async function addContribution(input: z.infer<typeof contributionSchema>) {
  const userId = await requireUserId();
  const data = contributionSchema.parse(input);

  const goal = await prisma.goal.findFirst({ where: { id: data.goalId, userId } });
  if (!goal) throw new Error("Meta no encontrada");

  await prisma.$transaction([
    prisma.goalContribution.create({
      data: { ...data, userId },
    }),
    prisma.goal.update({
      where: { id: data.goalId },
      data: { currentAmount: { increment: data.amount } },
    }),
  ]);

  revalidatePath(`/goals/${data.goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteContribution(id: string) {
  const userId = await requireUserId();
  const contribution = await prisma.goalContribution.findFirst({ where: { id, userId } });
  if (!contribution) return;

  await prisma.$transaction([
    prisma.goal.update({
      where: { id: contribution.goalId },
      data: { currentAmount: { decrement: contribution.amount } },
    }),
    prisma.goalContribution.delete({ where: { id } }),
  ]);

  revalidatePath(`/goals/${contribution.goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
