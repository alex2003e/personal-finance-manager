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
});

export async function createGoal(input: z.infer<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  await prisma.goal.create({ data: { ...data, userId } });
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
