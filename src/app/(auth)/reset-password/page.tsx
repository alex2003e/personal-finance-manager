"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/actions/auth-verification";
import { PasswordRequirements, isPasswordValid } from "@/components/password-requirements";
import { CodeExpiryTimer } from "@/components/code-expiry-timer";
import { getResetSession, clearResetSession } from "@/lib/reset-password-session";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ email: string; token?: string; expiresAt?: string } | null>(null);
  const [ready, setReady] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSession(getResetSession());
    setReady(true);
  }, []);

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (!ready) return null;

  if (!session?.email || !session.token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Falta verificar el código</CardTitle>
          <CardDescription>Vuelve a solicitar la recuperación desde el inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-primary underline">
            Recuperar contraseña
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { email, token } = session;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, token: token!, newPassword });
      clearResetSession();
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>Elige la nueva contraseña para tu cuenta.</CardDescription>
        <CodeExpiryTimer
          expiresAt={session.expiresAt ?? null}
          activeLabel="Tienes"
          expiredLabel="Se acabó el tiempo para completar el cambio, vuelve a solicitar el código."
        />
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="text-sm text-success">Contraseña actualizada. Redirigiendo a iniciar sesión...</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordRequirements password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={passwordsMismatch}
                className={passwordsMismatch ? "border-destructive" : undefined}
              />
              {passwordsMismatch && (
                <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
