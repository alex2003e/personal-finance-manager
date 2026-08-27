"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const nameSchema = z.object({ name: z.string().min(1, "El nombre es requerido") });

export async function updateName(input: z.infer<typeof nameSchema>) {
  const userId = await requireUserId();
  const data = nameSchema.parse(input);

  await prisma.user.update({ where: { id: userId }, data: { name: data.name } });
  revalidatePath("/profile");
}

const emailSchema = z.object({
  email: z.string().email("Email inválido"),
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
});

export async function updateEmail(input: z.infer<typeof emailSchema>) {
  const userId = await requireUserId();
  const data = emailSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Contraseña incorrecta");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== userId) {
    throw new Error("Ya existe una cuenta con ese email");
  }

  await prisma.user.update({ where: { id: userId }, data: { email: data.email } });
  revalidatePath("/profile");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  });

export async function changePassword(input: z.infer<typeof passwordSchema>) {
  const userId = await requireUserId();
  const data = passwordSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Contraseña actual incorrecta");

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/profile");
}

export async function getProfile() {
  const userId = await requireUserId();
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true, emailAlertsEnabled: true },
  });
}

export async function setEmailAlertsEnabled(enabled: boolean) {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { emailAlertsEnabled: enabled } });
  revalidatePath("/profile");
}
