"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Money } from "@/components/money";
import { parseBankCsv, importBankTransactions, type ParsedBankRow } from "@/lib/actions/import-bank";

interface EditableRow extends ParsedBankRow {
  category: string;
  include: boolean;
}

const TYPE_LABEL: Record<string, string> = { INCOME: "Ingreso", EXPENSE: "Gasto" };

export function ImportBankClient({
  accounts,
}: {
  accounts: { id: string; name: string; bank: string | null }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState<string | undefined>(accounts[0]?.id);
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = await parseBankCsv(text);
      if (parsed.length === 0) {
        setError("No se encontraron movimientos válidos en el archivo.");
        setRows(null);
      } else {
        setRows(
          parsed.map((r) => ({
            ...r,
            category: r.type === "INCOME" ? "Ingreso importado" : "Gasto importado",
            include: true,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  function updateRow(index: number, patch: Partial<EditableRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev));
  }

  async function onConfirm() {
    if (!rows || !accountId) return;
    setLoading(true);
    setError(null);
    try {
      const selected = rows.filter((r) => r.include);
      const res = await importBankTransactions({
        accountId,
        rows: selected.map((r) => ({
          date: r.date,
          description: r.description,
          category: r.category,
          amount: r.amount,
          type: r.type,
        })),
      });
      setResult(res);
      setRows(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Cuenta destino</Label>
          <Select
            items={Object.fromEntries(accounts.map((a) => [a.id, a.bank ? `${a.name} — ${a.bank}` : a.name]))}
            value={accountId}
            onValueChange={(v) => setAccountId(v ?? undefined)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.bank ? `${a.name} — ${a.bank}` : a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="csv-file">Archivo CSV</Label>
          <Input
            id="csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Se importaron {result.imported} movimientos
          {result.skipped > 0 ? ` (${result.skipped} ya existían y se omitieron)` : ""}.
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {fileName} — {rows.length} movimientos encontrados. Revisa antes de confirmar.
          </p>
          <div className="max-h-96 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-2 text-left"></th>
                  <th className="px-2 py-2 text-left">Fecha</th>
                  <th className="px-2 py-2 text-left">Descripción</th>
                  <th className="px-2 py-2 text-left">Categoría</th>
                  <th className="px-2 py-2 text-left">Tipo</th>
                  <th className="px-2 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => updateRow(i, { include: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{r.date}</td>
                    <td className="max-w-48 truncate px-2 py-1.5" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={r.category}
                        onChange={(e) => updateRow(i, { category: e.target.value })}
                        className="w-32 rounded border border-input bg-background px-1.5 py-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.type}
                        onChange={(e) => updateRow(i, { type: e.target.value as "INCOME" | "EXPENSE" })}
                        className="rounded border border-input bg-background px-1.5 py-1 text-xs"
                      >
                        <option value="INCOME">{TYPE_LABEL.INCOME}</option>
                        <option value="EXPENSE">{TYPE_LABEL.EXPENSE}</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Money value={r.amount} size="sm" tone={r.type === "INCOME" ? "positive" : "negative"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={onConfirm} disabled={loading || !accountId}>
            <Upload className="h-4 w-4" />
            {loading ? "Importando..." : `Importar ${rows.filter((r) => r.include).length} movimientos`}
          </Button>
        </div>
      )}
    </div>
  );
}
