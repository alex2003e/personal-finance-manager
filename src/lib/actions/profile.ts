"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { passwordFieldSchema } from "@/lib/password-policy";

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

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword: passwordFieldSchema,
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
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      emailAlertsEnabled: true,
      image: true,
    },
  });
}

export async function setEmailAlertsEnabled(enabled: boolean) {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { emailAlertsEnabled: enabled } });
  revalidatePath("/profile");
}

const MAX_AVATAR_BYTES = 600_000; // ~450KB de imagen tras codificar en base64

const avatarSchema = z.object({
  dataUrl: z.string().refine((v) => v.startsWith("data:image/"), "Formato de imagen inválido"),
});

export async function updateAvatar(input: z.infer<typeof avatarSchema>) {
  const userId = await requireUserId();
  const data = avatarSchema.parse(input);

  if (data.dataUrl.length > MAX_AVATAR_BYTES) {
    throw new Error("La imagen es demasiado grande");
  }

  await prisma.user.update({ where: { id: userId }, data: { image: data.dataUrl } });
  revalidatePath("/profile");
}

export async function removeAvatar() {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  revalidatePath("/profile");
}
