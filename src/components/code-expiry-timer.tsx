"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Cuenta regresiva hasta expiresAt; onExpire se llama una sola vez al llegar a 0. */
export function CodeExpiryTimer({
  expiresAt,
  onExpire,
  className,
  expiredLabel = "El código expiró, pide uno nuevo.",
  activeLabel = "El código vence en",
}: {
  expiresAt: string | null;
  onExpire?: () => void;
  className?: string;
  expiredLabel?: string;
  activeLabel?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const msRemaining = expiresAt ? new Date(expiresAt).getTime() - now : 0;
  const expired = !expiresAt || msRemaining <= 0;

  useEffect(() => {
    if (expired && expiresAt) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (!expiresAt) return null;

  return (
    <p className={cn("text-xs", expired ? "text-destructive" : "text-muted-foreground", className)}>
      {expired ? (
        expiredLabel
      ) : (
        <>
          {activeLabel}{" "}
          <span className="font-mono font-medium text-foreground">{formatRemaining(msRemaining)}</span>
        </>
      )}
    </p>
  );
}
