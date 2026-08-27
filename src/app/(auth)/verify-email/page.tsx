"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
import { verifyEmailCode, resendVerificationCode } from "@/lib/actions/auth-verification";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmailCode({ code });
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResending(true);
    setError(null);
    try {
      await resendVerificationCode();
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el código");
    } finally {
      setResending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirma tu correo</CardTitle>
        <CardDescription>
          Te enviamos un código de 6 dígitos. Revisa tu bandeja de entrada (y spam).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {resent && <p className="text-sm text-success">Código reenviado.</p>}
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="text-primary underline underline-offset-2 disabled:opacity-50"
          >
            {resending ? "Enviando..." : "Reenviar código"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted-foreground underline underline-offset-2"
          >
            Cerrar sesión
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
