import { monthlyRateFromEA } from "@/lib/calc/avalanche";

/**
 * Cuota mensual de una compra financiada a N cuotas (amortización francesa).
 * Si la tasa es 0 (compra "sin interés"), es simplemente monto / cuotas.
 */
export function computeMonthlyPayment(
  principal: number,
  annualRateEA: number,
  installments: number
): number {
  if (installments <= 0) return principal;
  const i = monthlyRateFromEA(annualRateEA);
  if (i === 0) return principal / installments;
  const payment = (principal * i) / (1 - Math.pow(1 + i, -installments));
  return payment;
}

export interface InstallmentPaymentResult {
  interest: number;
  principal: number;
  newRemainingBalance: number;
}

/**
 * Aplica el pago de una cuota sobre el saldo restante de una compra:
 * primero se cobra el interés del período, el resto abona a capital.
 */
export function applyInstallmentPayment(
  remainingBalance: number,
  annualRateEA: number,
  paymentAmount: number
): InstallmentPaymentResult {
  const i = monthlyRateFromEA(annualRateEA);
  const interest = remainingBalance * i;
  const principal = Math.min(Math.max(paymentAmount - interest, 0), remainingBalance);
  const newRemainingBalance = Math.max(remainingBalance - principal, 0);
  return { interest, principal, newRemainingBalance };
}
