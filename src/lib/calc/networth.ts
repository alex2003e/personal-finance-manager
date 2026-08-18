export interface NetWorthInput {
  assetsValue: number;
  investmentsValue: number;
  debtsBalance: number;
}

export function computeNetWorth({
  assetsValue,
  investmentsValue,
  debtsBalance,
}: NetWorthInput) {
  const totalAssets = assetsValue + investmentsValue;
  const netWorth = totalAssets - debtsBalance;
  return { totalAssets, totalDebts: debtsBalance, netWorth };
}
