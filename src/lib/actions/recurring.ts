"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  frequency: z.enum(["MONTHLY", "BIWEEKLY", "WEEKLY", "YEARLY"]).default("MONTHLY"),
  type: z.enum(["INCOME", "EXPENSE"]),
  active: z.coerce.boolean().default(true),
});

export async function createRecurringItem(input: z.infer<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  await prisma.recurringItem.create({ data: { ...data, userId } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function updateRecurringItem(id: string, input: z.infer<typeof schema>) {
  const userId = await requireUserId();
  const data = schema.parse(input);
  await prisma.recurringItem.updateMany({ where: { id, userId }, data });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function deleteRecurringItem(id: string) {
  const userId = await requireUserId();
  await prisma.recurringItem.deleteMany({ where: { id, userId } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}

export async function toggleRecurringItem(id: string, active: boolean) {
  const userId = await requireUserId();
  await prisma.recurringItem.updateMany({ where: { id, userId }, data: { active } });
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
}
