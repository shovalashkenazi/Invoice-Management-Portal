import { Injectable, Logger } from '@nestjs/common';
import { parse as parseDate } from 'date-fns';
import { PrismaService } from 'prisma/prisma.service';
import { CSVRecord } from '../interfaces/csv-record.interface';

@Injectable()
export class InvoiceProcessorService {
  private readonly logger = new Logger(InvoiceProcessorService.name);

  constructor(private prisma: PrismaService) {}

  async processRecordsInBatches(records: CSVRecord[]) {
    const updatedRecords: string[] = [];
    const validationErrors: { [key: string]: string[] } = {};
    const batchSize = 1000;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      await this.prisma.$transaction(
        async (tx) => {
          for (const record of batch) {
            const existingSupplier = await tx.supplier.findUnique({
              where: { internalId: record.supplier_internal_id },
            });

            const errorsForRow = this.validateRecord(record, existingSupplier);
            if (errorsForRow.length > 0) {
              validationErrors[record.invoice_id || 'unknown'] = errorsForRow;
              continue;
            }

            const supplier = await this.upsertSupplier(tx, record);
            const invoiceDate = parseDate(record.invoice_date, 'dd/MM/yyyy', new Date());
            const dueDate = parseDate(record.invoice_due_date, 'dd/MM/yyyy', new Date());
            const cost = parseFloat(record.invoice_cost);

            const message = await this.updateOrCreateInvoice(tx, record, invoiceDate, dueDate, cost, supplier.id);
            updatedRecords.push(message);
          }
        },
        {
          maxWait: 10000,
          timeout: 15000,
        },
      );
    }

    return { updatedRecords, validationErrors };
  }

  private validateRecord(record: CSVRecord, existingSupplier: any): string[] {
    // Delegate to CSVValidatorService in a real implementation
    // For simplicity, kept here to avoid circular dependency
    const errors: string[] = [];
    const requiredFields = ['invoice_id', 'invoice_date', 'invoice_due_date', 'invoice_cost', 'invoice_currency', 'invoice_status', 'supplier_internal_id'];

    requiredFields.forEach((field) => {
      if (!record[field as keyof CSVRecord]) {
        errors.push(field);
      }
    });

    const invoiceDate = parseDate(record.invoice_date, 'dd/MM/yyyy', new Date());
    const dueDate = parseDate(record.invoice_due_date, 'dd/MM/yyyy', new Date());

    if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
      errors.push('invalid_date_format');
    } else if (dueDate < invoiceDate) {
      errors.push('due_date_before_invoice_date');
    }

    const cost = parseFloat(record.invoice_cost);
    if (isNaN(cost) || cost < 0) {
      errors.push('invalid_cost');
    }

    const validCurrencies = ['USD', 'EUR', 'GBP'] as const;
    if (!validCurrencies.includes(record.invoice_currency as any)) {
      errors.push('invalid_currency');
    }

    const validStatuses = ['CONFIRMED', 'CANCELLED', 'PENDING'] as const;
    if (!validStatuses.includes(record.invoice_status as any)) {
      errors.push('invalid_status');
    }

    if (!existingSupplier && !record.supplier_company_name) {
      errors.push('supplier_company_name');
    }

    return errors;
  }

  private async upsertSupplier(tx: any, record: CSVRecord) {
    const parseIntSafe = (value: string | undefined): number | null => (value !== undefined && value !== '' ? parseInt(value, 10) : null);

    const parseFloatSafe = (value: string | undefined): number | null => (value !== undefined && value !== '' ? parseFloat(value) : null);

    const supplierData = {
      internalId: record.supplier_internal_id,
      externalId: record.supplier_external_id ?? null,
      companyName: record.supplier_company_name ?? null,
      address: record.supplier_address ?? null,
      city: record.supplier_city ?? null,
      country: record.supplier_country ?? null,
      contactName: record.supplier_contact_name ?? null,
      phone: record.supplier_phone ?? null,
      email: record.supplier_email ?? null,
      bankCode: parseIntSafe(record.supplier_bank_code),
      bankBranchCode: parseIntSafe(record.supplier_bank_branch_code),
      bankAccountNumber: record.supplier_bank_account_number ?? null,
      status: record.supplier_status ?? null,
      stockValue: parseFloatSafe(record.supplier_stock_value),
      withholdingTax: parseFloatSafe(record.supplier_withholding_tax),
    };

    return tx.supplier.upsert({
      where: { internalId: record.supplier_internal_id },
      update: {
        ...supplierData,
        internalId: undefined,
      },
      create: supplierData,
    });
  }

  private async updateOrCreateInvoice(tx: any, record: CSVRecord, invoiceDate: Date, dueDate: Date, cost: number, supplierId: string) {
    const invoiceData = {
      invoiceId: record.invoice_id,
      invoiceDate,
      dueDate,
      cost,
      currency: record.invoice_currency,
      status: record.invoice_status,
      supplierId,
    };

    const result = await tx.invoice.upsert({
      where: { invoiceId: record.invoice_id },
      update: invoiceData,
      create: invoiceData,
      select: { id: true },
    });

    return result.id ? `Updated invoice ${record.invoice_id}` : `Created invoice ${record.invoice_id}`;
  }
}
