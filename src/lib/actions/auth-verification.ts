"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  createVerificationCode,
  consumeVerificationCode,
  isVerificationCodeValid,
} from "@/lib/verification-code";
import { sendVerificationCodeEmail, sendPasswordResetCodeEmail } from "@/lib/mailer";

export async function resendVerificationCode() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerified) return;

  const code = await createVerificationCode(userId, "EMAIL_VERIFY");
  await sendVerificationCodeEmail(user.email, code);
}
// NOTA: aquí sí dejamos que el error se propague — a diferencia del registro,
// el usuario pidió explícitamente "reenviar" y debe enterarse si falló.

const codeSchema = z.object({ code: z.string().length(6) });

export async function verifyEmailCode(input: z.infer<typeof codeSchema>) {
  const userId = await requireUserId();
  const data = codeSchema.parse(input);

  const ok = await consumeVerificationCode(userId, "EMAIL_VERIFY", data.code);
  if (!ok) throw new Error("Código inválido o expirado");

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
}

const emailSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(input: z.infer<typeof emailSchema>) {
  const data = emailSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Respuesta genérica sin importar si el email existe, para no filtrar cuentas registradas.
  if (!user) return;

  const code = await createVerificationCode(user.id, "PASSWORD_RESET");
  try {
    await sendPasswordResetCodeEmail(user.email, code);
  } catch (err) {
    console.error("No se pudo enviar el correo de recuperación:", err);
  }
}

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

/** Paso intermedio: confirma que el código es válido sin gastarlo todavía. */
export async function verifyPasswordResetCode(input: z.infer<typeof verifyResetCodeSchema>) {
  const data = verifyResetCodeSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("Código inválido o expirado");

  const ok = await isVerificationCodeValid(user.id, "PASSWORD_RESET", data.code);
  if (!ok) throw new Error("Código inválido o expirado");
}

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function resetPassword(input: z.infer<typeof resetSchema>) {
  const data = resetSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("Código inválido o expirado");

  const ok = await consumeVerificationCode(user.id, "PASSWORD_RESET", data.code);
  if (!ok) throw new Error("Código inválido o expirado");

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
