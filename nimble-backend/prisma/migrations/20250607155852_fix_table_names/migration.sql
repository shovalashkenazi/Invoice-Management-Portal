-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "externalId" TEXT,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bankCode" INTEGER,
    "bankBranchCode" INTEGER,
    "bankAccountNumber" TEXT,
    "status" TEXT NOT NULL,
    "stockValue" DOUBLE PRECISION,
    "withholdingTax" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_internalId_key" ON "supplier"("internalId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoiceId_key" ON "invoice"("invoiceId");

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
