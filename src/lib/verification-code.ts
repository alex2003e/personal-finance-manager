import { prisma } from "@/lib/prisma";

const CODE_TTL_MINUTES = 15;

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Crea (e invalida cualquier código previo del mismo tipo) un código de 6 dígitos. */
export async function createVerificationCode(
  userId: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET"
): Promise<string> {
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

  return code;
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
