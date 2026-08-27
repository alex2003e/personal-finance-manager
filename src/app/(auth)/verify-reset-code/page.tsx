"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { CodeExpiryTimer } from "@/components/code-expiry-timer";
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  getPasswordResetCodeExpiry,
} from "@/lib/actions/auth-verification";

function VerifyResetCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (email) getPasswordResetCodeExpiry({ email }).then(setExpiresAt);
  }, [email]);

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Falta el correo</CardTitle>
          <CardDescription>
            Vuelve a solicitar el código desde el inicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-primary underline">
            Solicitar código
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, expiresAt: tokenExpiresAt } = await verifyPasswordResetCode({ email, code });
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&token=${token}&expiresAt=${encodeURIComponent(tokenExpiresAt)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResending(true);
    setError(null);
    setResent(false);
    try {
      const newExpiresAt = await requestPasswordReset({ email });
      setExpiresAt(newExpiresAt);
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
        <CardTitle>Ingresa el código</CardTitle>
        <CardDescription>
          Enviamos un código de 6 dígitos a <span className="font-medium text-foreground">{email}</span>.
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
            <CodeExpiryTimer expiresAt={expiresAt} onExpire={() => setExpiresAt(null)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {resent && <p className="text-sm text-success">Código reenviado.</p>}
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? "Verificando..." : "Verificar código"}
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
          <Link
            href="/forgot-password"
            className="text-muted-foreground underline underline-offset-2"
          >
            Cambiar correo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyResetCodePage() {
  return (
    <Suspense>
      <VerifyResetCodeForm />
    </Suspense>
  );
}
