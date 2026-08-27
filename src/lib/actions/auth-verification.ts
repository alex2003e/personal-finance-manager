"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  createVerificationCode,
  createResetToken,
  consumeVerificationCode,
  getLatestCodeExpiry,
} from "@/lib/verification-code";
import { sendVerificationCodeEmail, sendPasswordResetCodeEmail } from "@/lib/mailer";
import { passwordFieldSchema } from "@/lib/password-policy";

export async function resendVerificationCode(): Promise<string> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerified) throw new Error("Este correo ya está verificado");

  const { code, expiresAt } = await createVerificationCode(userId, "EMAIL_VERIFY");
  await sendVerificationCodeEmail(user.email, code);
  return expiresAt.toISOString();
}
// NOTA: aquí sí dejamos que el error se propague — a diferencia del registro,
// el usuario pidió explícitamente "reenviar" y debe enterarse si falló.

/** Vigencia del código de verificación de email activo (para el temporizador). */
export async function getEmailVerifyCodeExpiry(): Promise<string | null> {
  const userId = await requireUserId();
  const expiresAt = await getLatestCodeExpiry(userId, "EMAIL_VERIFY");
  return expiresAt ? expiresAt.toISOString() : null;
}

const codeSchema = z.object({ code: z.string().length(6) });

export async function verifyEmailCode(input: z.infer<typeof codeSchema>) {
  const userId = await requireUserId();
  const data = codeSchema.parse(input);

  const ok = await consumeVerificationCode(userId, "EMAIL_VERIFY", data.code);
  if (!ok) throw new Error("Código inválido o expirado");

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
}

const emailSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(
  input: z.infer<typeof emailSchema>
): Promise<string | null> {
  const data = emailSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Respuesta genérica sin importar si el email existe, para no filtrar cuentas registradas.
  if (!user) return null;

  const { code, expiresAt } = await createVerificationCode(user.id, "PASSWORD_RESET");
  try {
    await sendPasswordResetCodeEmail(user.email, code);
  } catch (err) {
    console.error("No se pudo enviar el correo de recuperación:", err);
  }
  return expiresAt.toISOString();
}

/** Vigencia del código de recuperación activo para ese email (para el temporizador). */
export async function getPasswordResetCodeExpiry(
  input: z.infer<typeof emailSchema>
): Promise<string | null> {
  const data = emailSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return null;
  const expiresAt = await getLatestCodeExpiry(user.id, "PASSWORD_RESET");
  return expiresAt ? expiresAt.toISOString() : null;
}

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

/**
 * Paso intermedio: consume el código de 6 dígitos (ya cumplió su propósito,
 * demostrar que el usuario recibió el correo) y a cambio emite un token de
 * un solo uso con más vigencia (RESET_TOKEN_TTL_MINUTES) para el paso final
 * de escribir la nueva contraseña — así verificar el código no deja al
 * usuario corriendo contra el mismo reloj corto de 5 minutos.
 */
export async function verifyPasswordResetCode(
  input: z.infer<typeof verifyResetCodeSchema>
): Promise<{ token: string; expiresAt: string }> {
  const data = verifyResetCodeSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("Código inválido o expirado");

  const ok = await consumeVerificationCode(user.id, "PASSWORD_RESET", data.code);
  if (!ok) throw new Error("Código inválido o expirado");

  const { token, expiresAt } = await createResetToken(user.id);
  return { token, expiresAt: expiresAt.toISOString() };
}

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: passwordFieldSchema,
});

export async function resetPassword(input: z.infer<typeof resetSchema>) {
  const data = resetSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("La sesión de recuperación expiró, vuelve a verificar el código.");

  const ok = await consumeVerificationCode(user.id, "PASSWORD_RESET_CONFIRMED", data.token);
  if (!ok) throw new Error("La sesión de recuperación expiró, vuelve a verificar el código.");

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
