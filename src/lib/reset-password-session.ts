"use client";

/**
 * Guarda el estado del flujo de recuperación de contraseña (email, y luego
 * el token de un solo uso) en sessionStorage en vez de la URL — así no
 * quedan en el historial del navegador, en los logs del servidor, ni se
 * exponen sin querer al compartir un link o una captura de pantalla.
 * Se borra solo (al cerrar la pestaña) o explícitamente al terminar el flujo.
 */
const KEY = "finanzas:password-reset";

interface ResetSession {
  email: string;
  token?: string;
  expiresAt?: string;
}

export function setResetEmail(email: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ email }));
}

export function setResetToken(email: string, token: string, expiresAt: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ email, token, expiresAt }));
}

export function getResetSession(): ResetSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResetSession) : null;
  } catch {
    return null;
  }
}

export function clearResetSession() {
  sessionStorage.removeItem(KEY);
}
