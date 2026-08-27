import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationCode } from "@/lib/verification-code";
import { sendVerificationCodeEmail } from "@/lib/mailer";
import { passwordFieldSchema } from "@/lib/password-policy";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: passwordFieldSchema,
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true },
  });

  try {
    const { code } = await createVerificationCode(user.id, "EMAIL_VERIFY");
    await sendVerificationCodeEmail(user.email, code);
  } catch (err) {
    // No bloqueamos el registro si el correo falla (ej. Gmail sin
    // configurar aún en desarrollo); el usuario puede reenviar el código.
    console.error("No se pudo enviar el correo de verificación:", err);
  }

  return NextResponse.json({ user }, { status: 201 });
}
