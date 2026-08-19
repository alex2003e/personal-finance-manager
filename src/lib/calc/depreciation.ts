import { monthlyRateFromEA } from "@/lib/calc/avalanche";

/**
 * Tasas anuales por defecto cuando el activo no tiene una tasa propia:
 * - Vehículos: -20%/año en línea recta, según vida útil de 5 años que
 *   fija el Estatuto Tributario colombiano (DIAN) para depreciación fiscal.
 * - Inmuebles: +4%/año, aproximando la valorización histórica promedio del
 *   mercado inmobiliario colombiano (no es una cifra oficial, es un supuesto
 *   editable por activo).
 */
export const DEFAULT_ANNUAL_RATE_BY_ASSET_TYPE: Record<string, number> = {
  VEHICLE: -20,
  PROPERTY: 4,
  INVESTMENT: 6,
  OTHER: 0,
};

export function resolveAssetRate(type: string, customRate?: number | null): number {
  if (customRate != null) return customRate;
  return DEFAULT_ANNUAL_RATE_BY_ASSET_TYPE[type] ?? 0;
}

export interface ValuePoint {
  month: number;
  value: number;
}

/** Proyecta el valor de un activo mes a mes con una tasa anual fija (puede ser negativa). */
export function projectAssetValue(
  startingValue: number,
  annualRatePercent: number,
  months: number
): ValuePoint[] {
  const monthlyRate = monthlyRateFromEA(annualRatePercent);
  const points: ValuePoint[] = [{ month: 0, value: startingValue }];
  let value = startingValue;
  for (let m = 1; m <= months; m++) {
    value = Math.max(value * (1 + monthlyRate), 0);
    points.push({ month: m, value: Math.round(value) });
  }
  return points;
}
