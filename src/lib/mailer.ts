import nodemailer from "nodemailer";
import { CODE_TTL_MINUTES } from "@/lib/verification-code";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno para poder enviar correos."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.GMAIL_USER;
  await getTransporter().sendMail({ from: `Finanzas <${from}>`, to, subject, html });
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #0d9488; font-size: 20px;">Finanzas</h1>
      <h2 style="font-size: 16px; color: #0b1220;">${title}</h2>
      ${bodyHtml}
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        Si no solicitaste esto, puedes ignorar este correo.
      </p>
    </div>
  `;
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  await sendEmail(
    to,
    "Tu código de verificación",
    emailShell(
      "Confirma tu correo",
      `<p style="color:#334155;">Usa este código para verificar tu cuenta:</p>
       <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0d9488;">${code}</p>
       <p style="color:#94a3b8; font-size: 13px;">Expira en ${CODE_TTL_MINUTES} minutos.</p>`
    )
  );
}

export async function sendPasswordResetCodeEmail(to: string, code: string) {
  await sendEmail(
    to,
    "Código para recuperar tu contraseña",
    emailShell(
      "Recuperar contraseña",
      `<p style="color:#334155;">Usa este código para crear una nueva contraseña:</p>
       <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0d9488;">${code}</p>
       <p style="color:#94a3b8; font-size: 13px;">Expira en ${CODE_TTL_MINUTES} minutos.</p>`
    )
  );
}

export async function sendAlertsDigestEmail(to: string, alertLines: string[]) {
  await sendEmail(
    to,
    "Tienes alertas pendientes en Finanzas",
    emailShell(
      "Resumen de alertas",
      `<ul style="color:#334155; padding-left: 20px;">
        ${alertLines.map((l) => `<li style="margin-bottom: 8px;">${l}</li>`).join("")}
       </ul>`
    )
  );
}
