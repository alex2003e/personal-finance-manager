"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { importFromExcel, type ImportPreview } from "@/lib/actions/import-excel";
import { formatCOP, formatPercent } from "@/lib/format";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.[0]) {
      setError("Selecciona un archivo .xlsx");
      return;
    }

    const formData = new FormData();
    formData.set("file", fileInput.files[0]);

    setLoading(true);
    try {
      const preview = await importFromExcel(formData);
      setResult(preview);
      toast.success("Datos importados correctamente");
    } catch {
      setError("No se pudo importar el archivo. Verifica que tenga las hojas 'Deudas' y 'Gastos Fijos'.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido — vamos a importar tus datos</h1>
        <p className="text-muted-foreground">
          Sube tu Excel actual (deudas, gastos fijos e ingresos) para no empezar desde cero.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar desde Excel</CardTitle>
          <CardDescription>
            Debe tener las hojas &quot;Deudas&quot; y &quot;Gastos Fijos&quot; (formato del plan
            que ya usabas).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="file"
              name="file"
              accept=".xlsx"
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Importando..." : "Importar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de lo importado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Deudas ({result.debts.length})</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {result.debts.map((d) => (
                  <li key={d.name}>
                    {d.name}: {formatCOP(d.balance)} · {formatPercent(d.interestRateEA)} EA
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Ingresos ({result.incomes.length})</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {result.incomes.map((i) => (
                  <li key={i.name}>
                    {i.name}: {formatCOP(i.amount)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Gastos fijos ({result.expenses.length})</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {result.expenses.map((ex) => (
                  <li key={ex.name}>
                    {ex.name}: {formatCOP(ex.amount)}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => router.push("/dashboard")}>Ir al Dashboard</Button>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline">
          Omitir por ahora, empezar en blanco
        </Link>
      </p>
    </div>
  );
}
