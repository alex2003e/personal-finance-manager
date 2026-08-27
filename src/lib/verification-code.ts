import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const CODE_TTL_MINUTES = 5;
const RESEND_COOLDOWN_MINUTES = 5;
/** Vigencia del token que se emite al verificar el código de recuperación,
 * para tener tiempo de escribir la nueva contraseña sin heredar los 5
 * minutos cortos del código de 6 dígitos que ya cumplió su propósito. */
export const RESET_TOKEN_TTL_MINUTES = 10;

type CodeType = "EMAIL_VERIFY" | "PASSWORD_RESET";
type AnyCodeType = CodeType | "PASSWORD_RESET_CONFIRMED";

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Crea (e invalida cualquier código previo del mismo tipo) un código de 6
 * dígitos. Aplica un cooldown de RESEND_COOLDOWN_MINUTES desde el último
 * código emitido (sin importar si se consumió) para que no puedan
 * bombardear el correo del usuario ni fuerza-bruta el reenvío.
 */
export async function createVerificationCode(
  userId: string,
  type: CodeType
): Promise<{ code: string; expiresAt: Date }> {
  const last = await prisma.verificationCode.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
  });

  if (last) {
    const cooldownEndsAt = new Date(last.createdAt.getTime() + RESEND_COOLDOWN_MINUTES * 60_000);
    const msRemaining = cooldownEndsAt.getTime() - Date.now();
    if (msRemaining > 0) {
      const minutesRemaining = Math.ceil(msRemaining / 60_000);
      throw new Error(
        `Debes esperar ${minutesRemaining} ${minutesRemaining === 1 ? "minuto" : "minutos"} antes de pedir otro código.`
      );
    }
  }

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.verificationCode.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationCode.create({
      data: { userId, type, code, expiresAt },
    }),
  ]);

  return { code, expiresAt };
}

/**
 * Emite un token opaco de un solo uso tras verificar el código de
 * recuperación, con más vigencia que el código original (RESET_TOKEN_TTL_MINUTES)
 * para el paso de escribir la nueva contraseña. No aplica cooldown: no es un
 * reenvío pedido por el usuario, es el resultado de una verificación exitosa.
 */
export async function createResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.verificationCode.updateMany({
      where: { userId, type: "PASSWORD_RESET_CONFIRMED", consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationCode.create({
      data: { userId, type: "PASSWORD_RESET_CONFIRMED", code: token, expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

/** Vigencia del código más reciente (para mostrar un temporizador en el cliente). */
export async function getLatestCodeExpiry(userId: string, type: CodeType): Promise<Date | null> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return record?.expiresAt ?? null;
}

/** Verifica que un código sea válido SIN consumirlo (para un paso intermedio de confirmación). */
export async function isVerificationCodeValid(
  userId: string,
  type: AnyCodeType,
  code: string
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, code, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return !!record;
}

/** Verifica y consume un código; retorna true si era válido. */
export async function consumeVerificationCode(
  userId: string,
  type: AnyCodeType,
  code: string
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, code, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
