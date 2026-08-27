import { prisma } from "@/lib/prisma";

const CODE_TTL_MINUTES = 5;
const RESEND_COOLDOWN_MINUTES = 5;

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
  type: "EMAIL_VERIFY" | "PASSWORD_RESET"
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

/** Vigencia del código más reciente (para mostrar un temporizador en el cliente). */
export async function getLatestCodeExpiry(
  userId: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET"
): Promise<Date | null> {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return record?.expiresAt ?? null;
}

/** Verifica que un código sea válido SIN consumirlo (para un paso intermedio de confirmación). */
export async function isVerificationCodeValid(
  userId: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET",
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
  type: "EMAIL_VERIFY" | "PASSWORD_RESET",
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
