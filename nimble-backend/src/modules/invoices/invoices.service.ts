import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
import { parse as parseDate } from 'date-fns';
import { CurrencyService } from '../currency/currency.service';
import { PrismaService } from 'prisma/prisma.service';

interface FilterParams {
  from?: string;
  to?: string;
  status?: string;
  customer?: string;
  currency?: string;
}

interface CSVRecord {
  invoice_id: string;
  invoice_date: string;
  invoice_due_date: string;
  invoice_cost: string;
  invoice_currency: string;
  invoice_status: string;
  supplier_internal_id: string;
  supplier_company_name?: string;
  supplier_external_id?: string;
  supplier_address?: string;
  supplier_city?: string;
  supplier_country?: string;
  supplier_contact_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_bank_code?: string;
  supplier_bank_branch_code?: string;
  supplier_bank_account_number?: string;
  supplier_status?: string;
  supplier_stock_value?: string;
  supplier_withholding_tax?: string;
}

export class ValidationException extends BadRequestException {
  constructor(errors: { [key: string]: string[] }) {
    const message = Object.entries(errors)
      .map(([invoiceId, errors]) => {
        const errorMap: { [key: string]: string } = {
          invoice_id: 'Invoice ID',
          invoice_date: 'Invoice Date',
          invoice_due_date: 'Due Date',
          invoice_cost: 'Cost',
          invoice_currency: 'Currency',
          invoice_status: 'Status',
          supplier_internal_id: 'Supplier Internal ID',
          supplier_company_name: 'Supplier Company Name',
          invalid_date_format: 'Invalid date format',
          due_date_before_invoice_date: 'Due date before invoice date',
          invalid_cost: 'Invalid cost',
          invalid_currency: 'Invalid currency',
          invalid_status: 'Invalid status',
        };
        const readableErrors = errors
          .map((error) => errorMap[error] || error)
          .join(', ');
        return `Invoice ${invoiceId}: Missing or invalid fields - ${readableErrors}`;
      })
      .join('\n- ');
    super(`Validation errors found:\n- ${message}`);
  }
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

  async importFromCSV(file: Express.Multer.File) {
    this.logger.log(`Starting CSV import, file size: ${file.size} bytes`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
    if (!file.mimetype.includes('csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    const content = file.buffer.toString().trim();
    const records: CSVRecord[] = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value: string) => value.trim(),
    });

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const requiredColumns = [
      'invoice_id',
      'invoice_date',
      'invoice_due_date',
      'invoice_cost',
      'invoice_currency',
      'invoice_status',
      'supplier_internal_id',
    ];
    const headers = Object.keys(records[0] || {});
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col),
    );
    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns.join(', ')}`,
      );
    }

    const invoiceIds = records.map((record) => record.invoice_id);
    if (new Set(invoiceIds).size !== invoiceIds.length) {
      throw new BadRequestException('Duplicate invoice_id found in CSV');
    }

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

            const invoiceDate = parseDate(
              record.invoice_date,
              'dd/MM/yyyy',
              new Date(),
            );
            const dueDate = parseDate(
              record.invoice_due_date,
              'dd/MM/yyyy',
              new Date(),
            );
            const cost = parseFloat(record.invoice_cost);
            const message = await this.updateOrCreateInvoice(
              tx,
              record,
              invoiceDate,
              dueDate,
              cost,
              supplier.id,
            );
            updatedRecords.push(message);
          }
        },
        {
          maxWait: 10000, // Increase timeout to 10 seconds
          timeout: 15000, // Total timeout to 15 seconds
        },
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      throw new ValidationException(validationErrors);
    }

    this.logger.log(`Processed ${records.length} records`);
    return {
      message: 'CSV uploaded and processed successfully',
      details: updatedRecords,
      totalRows: records.length,
    };
  }

  async getAggregatedData(filters: FilterParams = {}) {
    this.validateFilters(filters);
    const targetCurrency = filters.currency || 'USD';
    const currentDate = new Date();

    const [
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomerRaw,
    ] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status', 'currency'],
        _sum: { cost: true },
      }),
      this.prisma.invoice.count({
        where: {
          dueDate: { lt: currentDate },
          status: { in: ['PENDING'] },
        },
      }),
      this.prisma.invoice.groupBy({
        by: ['invoiceDate', 'currency'],
        where: { status: 'CONFIRMED' },
        _sum: { cost: true },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['supplierId', 'currency'],
        _sum: { cost: true },
        _count: { id: true },
      }),
    ]);

    const {
      transformedTotalsByStatus,
      monthlySummariesByCurrency,
      totalsByCustomer,
    } = await this.transformInvoiceData(
      totalsByStatus,
      monthlySummaries,
      totalsByCustomerRaw,
      targetCurrency,
    );

    const overdueTrend = await this.getOverdueTrend({}, targetCurrency);

    const customers = await this.prisma.supplier.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });

    return {
      totalsByStatus: transformedTotalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries: monthlySummariesByCurrency,
      totalsByCustomer,
      overdueTrend,
      customers,
    };
  }

  async getFilteredData(filters: FilterParams) {
    this.validateFilters(filters);
    const targetCurrency = filters.currency || 'USD';
    const currentDate = new Date();
    const whereClause: any = {};

    if (filters.from || filters.to) {
      whereClause.invoiceDate = {};
      if (filters.from) whereClause.invoiceDate.gte = new Date(filters.from);
      if (filters.to) whereClause.invoiceDate.lte = new Date(filters.to);
    }

    if (filters.status) whereClause.status = filters.status;

    if (filters.customer) {
      whereClause.supplier = {
        companyName: { contains: filters.customer, mode: 'insensitive' },
      };
    }

    const [
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomerRaw,
    ] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status', 'currency'],
        where: whereClause,
        _sum: { cost: true },
      }),
      this.prisma.invoice.count({
        where: {
          ...whereClause,
          dueDate: { lt: currentDate },
          status: { in: ['PENDING'] },
        },
      }),
      this.prisma.invoice.groupBy({
        by: ['invoiceDate', 'currency'],
        where: { ...whereClause, status: 'CONFIRMED' },
        _sum: { cost: true },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['supplierId', 'currency'],
        where: whereClause,
        _sum: { cost: true },
        _count: { id: true },
      }),
    ]);

    const {
      transformedTotalsByStatus,
      monthlySummariesByCurrency,
      totalsByCustomer,
    } = await this.transformInvoiceData(
      totalsByStatus,
      monthlySummaries,
      totalsByCustomerRaw,
      targetCurrency,
    );

    const overdueTrend = await this.getOverdueTrend(
      whereClause,
      targetCurrency,
    );

    const customers = await this.prisma.supplier.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });

    return {
      totalsByStatus: transformedTotalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries: monthlySummariesByCurrency,
      totalsByCustomer,
      overdueTrend,
      customers,
    };
  }

  private validateFilters(filters: FilterParams): void {
    const errors: string[] = [];

    if (filters.from && isNaN(Date.parse(filters.from))) {
      errors.push('Invalid "from" date format');
    }
    if (filters.to && isNaN(Date.parse(filters.to))) {
      errors.push('Invalid "to" date format');
    }
    if (filters.currency && !['USD', 'EUR', 'GBP'].includes(filters.currency)) {
      errors.push('Invalid currency');
    }
    if (
      filters.status &&
      !['CONFIRMED', 'CANCELLED', 'PENDING'].includes(filters.status)
    ) {
      errors.push('Invalid status');
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Filter validation errors: ${errors.join(', ')}`,
      );
    }
  }

  private async getOverdueTrend(baseWhereClause: any, targetCurrency: string) {
    const currentDate = new Date();
    const overdueByMonth = await this.prisma.invoice.groupBy({
      by: ['dueDate', 'currency'],
      where: {
        ...baseWhereClause,
        dueDate: { lt: currentDate },
        status: { in: ['PENDING'] },
      },
      _count: { id: true },
      _sum: { cost: true },
      orderBy: { dueDate: 'asc' },
    });

    const convertAmount = async (amount: number, from: string) =>
      from === targetCurrency
        ? amount
        : await this.currencyService.convert(amount, from, targetCurrency);

    const monthlyMap = new Map<string, { count: number; total: number }>();
    for (const item of overdueByMonth) {
      const monthKey = item.dueDate.toISOString().substring(0, 7);
      const current = monthlyMap.get(monthKey) || { count: 0, total: 0 };
      monthlyMap.set(monthKey, {
        count: current.count + item._count.id,
        total:
          current.total +
          (await convertAmount(item._sum.cost || 0, item.currency)),
      });
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private validateRecord(record: CSVRecord, existingSupplier: any): string[] {
    const errors: string[] = [];

    // Check required fields
    const requiredFields = [
      'invoice_id',
      'invoice_date',
      'invoice_due_date',
      'invoice_cost',
      'invoice_currency',
      'invoice_status',
      'supplier_internal_id',
    ];
    requiredFields.forEach((field) => {
      if (!record[field as keyof CSVRecord]) {
        errors.push(field);
      }
    });

    // Validate dates
    const invoiceDate = parseDate(
      record.invoice_date,
      'dd/MM/yyyy',
      new Date(),
    );
    const dueDate = parseDate(
      record.invoice_due_date,
      'dd/MM/yyyy',
      new Date(),
    );
    if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
      errors.push('invalid_date_format');
    } else if (dueDate < invoiceDate) {
      errors.push('due_date_before_invoice_date');
    }

    // Validate cost
    const cost = parseFloat(record.invoice_cost);
    if (isNaN(cost) || cost < 0) {
      errors.push('invalid_cost');
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP'] as const;
    if (!validCurrencies.includes(record.invoice_currency as any)) {
      errors.push('invalid_currency');
    }

    // Validate status
    const validStatuses = ['CONFIRMED', 'CANCELLED', 'PENDING'] as const;
    if (!validStatuses.includes(record.invoice_status as any)) {
      errors.push('invalid_status');
    }

    // Validate supplier company name for new suppliers
    if (!existingSupplier && !record.supplier_company_name) {
      errors.push('supplier_company_name');
    }

    return errors;
  }

  private async upsertSupplier(tx: any, record: CSVRecord) {
    const parseIntSafe = (value: string | undefined): number | null =>
      value !== undefined && value !== '' ? parseInt(value, 10) : null;
    const parseFloatSafe = (value: string | undefined): number | null =>
      value !== undefined && value !== '' ? parseFloat(value) : null;

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
        internalId: undefined, // Prevent updating the internalId
      },
      create: supplierData,
    });
  }

  private async updateOrCreateInvoice(
    tx: any,
    record: CSVRecord,
    invoiceDate: Date,
    dueDate: Date,
    cost: number,
    supplierId: string,
  ) {
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
      select: { id: true }, // Minimal select to confirm operation
    });

    return result.id
      ? `Updated invoice ${record.invoice_id}`
      : `Created invoice ${record.invoice_id}`;
  }

  private async transformInvoiceData(
    totalsByStatus: any[],
    monthlySummaries: any[],
    totalsByCustomerRaw: any[],
    targetCurrency: string,
  ) {
    const convertAmount = async (amount: number, from: string) =>
      from === targetCurrency
        ? amount
        : await this.currencyService.convert(amount, from, targetCurrency);

    const transformedTotalsByStatus = await Promise.all(
      totalsByStatus.map(async (item) => ({
        status: item.status,
        _sum: { cost: await convertAmount(item._sum.cost || 0, item.currency) },
      })),
    );

    const monthlySummariesByCurrency = await Promise.all(
      monthlySummaries.map(async (item) => ({
        invoiceDate: item.invoiceDate,
        _sum: { cost: await convertAmount(item._sum.cost || 0, item.currency) },
        _count: { id: item._count.id },
      })),
    );

    const totalsByCustomerByCurrency = await Promise.all(
      totalsByCustomerRaw.map(async (item) => ({
        supplierId: item.supplierId,
        _sum: { cost: await convertAmount(item._sum.cost || 0, item.currency) },
        _count: { id: item._count.id },
      })),
    );

    const supplierIds = totalsByCustomerByCurrency.map(
      (item) => item.supplierId,
    );
    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, companyName: true },
    });

    const totalsByCustomer = totalsByCustomerByCurrency.map((item) => {
      const supplier = suppliers.find((s) => s.id === item.supplierId);
      return {
        ...item,
        supplier: supplier || {
          companyName: `Unknown Supplier ${item.supplierId}`,
        },
      };
    });

    return {
      transformedTotalsByStatus,
      monthlySummariesByCurrency,
      totalsByCustomer,
    };
  }
}
