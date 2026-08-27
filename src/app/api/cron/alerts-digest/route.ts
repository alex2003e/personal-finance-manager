import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAlerts } from "@/lib/alerts";
import { sendAlertsDigestEmail } from "@/lib/mailer";

/**
 * Cron diario (ver vercel.json): envía a cada usuario con
 * emailAlertsEnabled=true un resumen de sus alertas activas, si tiene alguna.
 * Protegido con CRON_SECRET — Vercel lo manda automáticamente como Bearer
 * token cuando la variable de entorno CRON_SECRET está configurada.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const users = await prisma.user.findMany({
    where: { emailAlertsEnabled: true, emailVerified: { not: null } },
    select: { id: true, email: true },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const alerts = await computeAlerts(user.id);
    if (alerts.length === 0) continue;
    try {
      await sendAlertsDigestEmail(
        user.email,
        alerts.map((a) => `<strong>${a.title}</strong> — ${a.description}`)
      );
      sent++;
    } catch (err) {
      console.error(`No se pudo enviar el resumen de alertas a ${user.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ checked: users.length, sent, failed });
}
