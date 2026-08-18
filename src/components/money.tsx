import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";

type Tone = "default" | "positive" | "negative" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

/**
 * Cifra monetaria — usa Geist Mono con números tabulares para que las tablas
 * y tarjetas financieras se lean como un libro contable, con color semántico
 * opcional (verde = a favor, rojo = en contra) en vez de texto plano.
 */
export function Money({
  value,
  tone = "default",
  size = "base",
  className,
}: {
  value: number;
  tone?: Tone;
  size?: "sm" | "base" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-xl",
    xl: "text-xl md:text-2xl",
  }[size];

  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums",
        sizeClass,
        TONE_CLASS[tone],
        className
      )}
    >
      {formatCOP(value)}
    </span>
  );
}
