-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CARD_CHARGE';

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "creditLimit" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cardChargeId" TEXT;

-- CreateTable
CREATE TABLE "CardCharge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalAmount" DECIMAL(14,2) NOT NULL,
    "remainingBalance" DECIMAL(14,2) NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "installmentsPaid" INTEGER NOT NULL DEFAULT 0,
    "interestRateEA" DECIMAL(7,4) NOT NULL,
    "monthlyPayment" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardCharge_userId_idx" ON "CardCharge"("userId");

-- CreateIndex
CREATE INDEX "CardCharge_debtId_idx" ON "CardCharge"("debtId");

-- AddForeignKey
ALTER TABLE "CardCharge" ADD CONSTRAINT "CardCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCharge" ADD CONSTRAINT "CardCharge_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cardChargeId_fkey" FOREIGN KEY ("cardChargeId") REFERENCES "CardCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
