"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { INPUT_BASE_CLASSES } from "@/components/ui/input";

function formatThousands(digits: string): string {
  if (!digits) return "";
  return new Intl.NumberFormat("es-CO").format(Number(digits));
}

/**
 * Input de dinero: muestra el símbolo de la moneda y agrupa los miles con
 * puntos mientras se escribe (ej. "1.250.000"), pero manda el valor numérico
 * limpio al formulario vía un input oculto con el mismo `name` — así los
 * `Number(form.get(...))` existentes siguen funcionando sin cambios.
 * Solo maneja pesos enteros (sin centavos), que es como se usa en toda la app.
 */
export function CurrencyInput({
  name,
  id,
  defaultValue,
  required,
  placeholder,
  className,
  currency = "$",
  onValueChange,
}: {
  name: string;
  id?: string;
  defaultValue?: number | string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  currency?: string;
  onValueChange?: (value: number) => void;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [digits, setDigits] = useState(() => {
    if (defaultValue == null || defaultValue === "") return "";
    return String(Math.round(Number(defaultValue)));
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value.replace(/[^\d]/g, "");
    setDigits(next);
    onValueChange?.(next ? Number(next) : 0);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-foreground/60">
        {currency}
      </span>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={formatThousands(digits)}
        onChange={handleChange}
        className={cn(INPUT_BASE_CLASSES, "pl-9 font-mono tabular-nums", className)}
        style={{ paddingLeft: `${currency.length * 0.5 + 2}rem` }}
      />
      <input type="hidden" name={name} value={digits} />
    </div>
  );
}
