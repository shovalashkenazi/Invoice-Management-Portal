// === NestJS Core Imports ===
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

// === Service Imports ===
import { PrismaService } from 'prisma/prisma.service';
import { FilterParams } from './interfaces/filter-params.interface';
import { CSVParserService } from './utils/csv-parser';
import { CSVValidatorService } from './utils/csv-validator';
import { InvoiceProcessorService } from './utils/invoice-processor';
import { DataTransformerService } from './utils/data-transformer';

// === Type Definitions ===

// === Custom Exception Classes ===
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
  // === Class Properties ===
  private readonly logger = new Logger(InvoicesService.name);

  // === Constructor ===
  constructor(
    private prisma: PrismaService,
    private csvParser: CSVParserService,
    private csvValidator: CSVValidatorService,
    private invoiceProcessor: InvoiceProcessorService,
    private dataTransformer: DataTransformerService,
  ) {}

  // === Public Methods - CSV Import ===
  async importFromCSV(file: Express.Multer.File) {
    this.logger.log(`Starting CSV import, file size: ${file.size} bytes`);

    // File validation
    this.csvParser.validateUploadedFile(file);

    // Parse CSV content
    const records = this.csvParser.parseCSVContent(file);

    // Validate CSV structure and data
    this.csvParser.validateCSVStructure(records);
    this.csvValidator.validateUniqueInvoiceIds(records);

    // Process records in batches
    const { updatedRecords, validationErrors } =
      await this.invoiceProcessor.processRecordsInBatches(records);

    // Handle validation errors
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

  // === Public Methods - Data Retrieval ===
  async getAggregatedData(filters: FilterParams = {}) {
    this.csvValidator.validateFilters(filters);
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
    } = await this.dataTransformer.transformInvoiceData(
      totalsByStatus,
      monthlySummaries,
      totalsByCustomerRaw,
      targetCurrency,
    );

    const overdueTrend = await this.dataTransformer.getOverdueTrend(
      {},
      targetCurrency,
    );
    const customers = await this.dataTransformer.getCustomersList();

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
    this.csvValidator.validateFilters(filters);
    const targetCurrency = filters.currency || 'USD';
    const whereClause = this.buildWhereClause(filters);

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
          dueDate: { lt: new Date() },
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
    } = await this.dataTransformer.transformInvoiceData(
      totalsByStatus,
      monthlySummaries,
      totalsByCustomerRaw,
      targetCurrency,
    );

    const overdueTrend = await this.dataTransformer.getOverdueTrend(
      whereClause,
      targetCurrency,
    );
    const customers = await this.dataTransformer.getCustomersList();

    return {
      totalsByStatus: transformedTotalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries: monthlySummariesByCurrency,
      totalsByCustomer,
      overdueTrend,
      customers,
    };
  }

  // === Private Methods - Query Building ===
  private buildWhereClause(filters: FilterParams): any {
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

    return whereClause;
  }
}
