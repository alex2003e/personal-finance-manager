-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'COP',
ADD COLUMN     "exchangeRateToCOP" DECIMAL(16,4);
