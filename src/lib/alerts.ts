import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export type AlertSeverity = "warning" | "destructive";

export interface FinanceAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  href: string;
}

const DAYS_WITHOUT_DEBT_PAYMENT = 35;
const DAYS_WITHOUT_GOAL_CONTRIBUTION = 45;

/**
 * Alertas calculadas al vuelo a partir de lo ya registrado — no hay tabla de
 * notificaciones ni estado de "leído", se recalculan en cada carga.
 */
export async function computeAlerts(userId: string): Promise<FinanceAlert[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [debts, accounts, goals, incomeItems, monthTransactions, lastDebtPayments] =
    await Promise.all([
      prisma.debt.findMany({ where: { userId, closedAt: null } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.goal.findMany({
        where: { userId },
        include: { contributions: { orderBy: { date: "desc" }, take: 1 } },
      }),
      prisma.recurringItem.findMany({
        where: { userId, type: "INCOME", active: true, frequency: "MONTHLY" },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.transaction.findMany({
        where: { userId, type: "DEBT_PAYMENT" },
        orderBy: { date: "desc" },
      }),
    ]);

  const alerts: FinanceAlert[] = [];

  // Deudas activas sin abono reciente
  const lastPaymentByDebt = new Map<string, Date>();
  for (const p of lastDebtPayments) {
    if (!p.debtId) continue;
    if (!lastPaymentByDebt.has(p.debtId)) lastPaymentByDebt.set(p.debtId, p.date);
  }
  for (const d of debts) {
    if (toNumber(d.balance) <= 0) continue;
    const last = lastPaymentByDebt.get(d.id);
    const daysSince = last
      ? Math.floor((now.getTime() - last.getTime()) / 86_400_000)
      : Math.floor((now.getTime() - d.openedAt.getTime()) / 86_400_000);
    if (daysSince >= DAYS_WITHOUT_DEBT_PAYMENT) {
      alerts.push({
        id: `debt-${d.id}`,
        severity: "destructive",
        title: `${d.name} sin abonos hace ${daysSince} días`,
        description: "Puede que se te esté pasando la fecha de pago de esta deuda.",
        href: "/debts",
      });
    }
  }

  // Cuentas con saldo negativo
  for (const a of accounts) {
    if (toNumber(a.balance) < 0) {
      alerts.push({
        id: `account-${a.id}`,
        severity: "destructive",
        title: `${a.name} tiene saldo negativo`,
        description: "Revisa los movimientos recientes de esta cuenta.",
        href: "/accounts",
      });
    }
  }

  // Metas activas estancadas
  for (const g of goals) {
    if (toNumber(g.currentAmount) >= toNumber(g.targetAmount)) continue;
    const last = g.contributions[0]?.date ?? g.createdAt;
    const daysSince = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
    if (daysSince >= DAYS_WITHOUT_GOAL_CONTRIBUTION) {
      alerts.push({
        id: `goal-${g.id}`,
        severity: "warning",
        title: `"${g.name}" sin abonos hace ${daysSince} días`,
        description: "A este ritmo la meta se va a atrasar. Considera hacer un abono.",
        href: "/goals",
      });
    }
  }

  // Presupuesto del mes ya superado
  const totalIncome = incomeItems.reduce((s, i) => s + toNumber(i.amount), 0);
  const monthSpent = monthTransactions
    .filter((t) => t.type !== "INCOME" && t.type !== "CARD_CHARGE")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  if (totalIncome > 0 && monthSpent > totalIncome) {
    alerts.push({
      id: "budget-overspent",
      severity: "destructive",
      title: "Ya gastaste más de lo que ingresa este mes",
      description: `Llevas ${new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(monthSpent - totalIncome)} por encima de tu ingreso mensual.`,
      href: "/ledger",
    });
  }

  return alerts;
}
