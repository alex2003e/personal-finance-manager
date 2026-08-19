"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const assetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["VEHICLE", "PROPERTY", "INVESTMENT", "OTHER"]),
  estimatedValue: z.coerce.number().nonnegative(),
  annualRatePercent: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export async function createAsset(input: z.infer<typeof assetSchema>) {
  const userId = await requireUserId();
  const data = assetSchema.parse(input);
  await prisma.asset.create({ data: { ...data, userId } });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function updateAsset(id: string, input: z.infer<typeof assetSchema>) {
  const userId = await requireUserId();
  const data = assetSchema.parse(input);
  await prisma.asset.updateMany({ where: { id, userId }, data });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function deleteAsset(id: string) {
  const userId = await requireUserId();
  await prisma.asset.deleteMany({ where: { id, userId } });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

const investmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["STOCK", "ETF", "CRYPTO", "FUND", "REAL_ESTATE", "OTHER"]),
  quantity: z.coerce.number().nonnegative(),
  avgCost: z.coerce.number().nonnegative(),
  currentPrice: z.coerce.number().nonnegative(),
});

export async function createInvestment(input: z.infer<typeof investmentSchema>) {
  const userId = await requireUserId();
  const data = investmentSchema.parse(input);
  await prisma.investment.create({ data: { ...data, userId } });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function updateInvestment(id: string, input: z.infer<typeof investmentSchema>) {
  const userId = await requireUserId();
  const data = investmentSchema.parse(input);
  await prisma.investment.updateMany({ where: { id, userId }, data });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function deleteInvestment(id: string) {
  const userId = await requireUserId();
  await prisma.investment.deleteMany({ where: { id, userId } });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}
