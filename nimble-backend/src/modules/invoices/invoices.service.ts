import { Injectable, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

  async importFromCSV(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // בדיקות מקדימות על הקובץ
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
    if (!file.mimetype.includes('csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    const content = file.buffer.toString();
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // בדיקת עמודות חובה
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

    // בדיקת ייחודיות של invoice_id בתוך הקובץ
    const invoiceIds = records.map((record) => record.invoice_id);
    if (new Set(invoiceIds).size !== invoiceIds.length) {
      throw new BadRequestException('Duplicate invoice_id found in CSV');
    }

    const updatedRecords: string[] = [];
    const validationErrors: { [key: string]: string[] } = {};

    for (const record of records) {
      const errorsForRow: string[] = [];

      // בדיקות ערכים חובה ברמת הרשומה (ללא supplier_company_name כרגע)
      if (!record.invoice_id) errorsForRow.push('invoice_id');
      if (!record.invoice_date) errorsForRow.push('invoice_date');
      if (!record.invoice_due_date) errorsForRow.push('invoice_due_date');
      if (!record.invoice_cost) errorsForRow.push('invoice_cost');
      if (!record.invoice_currency) errorsForRow.push('invoice_currency');
      if (!record.invoice_status) errorsForRow.push('invoice_status');
      if (!record.supplier_internal_id)
        errorsForRow.push('supplier_internal_id');

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

      // בדיקות תאריכים
      if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
        errorsForRow.push('invalid_date_format');
      }
      if (dueDate < invoiceDate) {
        errorsForRow.push('due_date_before_invoice_date');
      }

      const cost = parseFloat(record.invoice_cost);
      if (isNaN(cost) || cost < 0) {
        errorsForRow.push('invalid_cost');
      }

      if (!['USD', 'EUR', 'GBP'].includes(record.invoice_currency)) {
        errorsForRow.push('invalid_currency');
      }

      if (
        !['CONFIRMED', 'CANCELLED', 'PENDING'].includes(record.invoice_status)
      ) {
        errorsForRow.push('invalid_status');
      }

      // בדיקת supplier_internal_id
      if (!record.supplier_internal_id) {
        errorsForRow.push('supplier_internal_id');
      }

      // איתור supplier קיים לפני ה-upsert
      const existingSupplier = await this.prisma.supplier.findUnique({
        where: { internalId: record.supplier_internal_id },
      });
      if (!existingSupplier && !record.supplier_company_name) {
        errorsForRow.push('supplier_company_name');
      }

      if (errorsForRow.length > 0) {
        validationErrors[record.invoice_id || 'unknown'] = errorsForRow;
        continue; // Skip to next record if there are errors
      }

      // איתור או יצירת supplier
      const supplier = await this.prisma.supplier.upsert({
        where: { internalId: record.supplier_internal_id },
        update: {
          externalId: record.supplier_external_id,
          companyName: record.supplier_company_name || undefined,
          address: record.supplier_address,
          city: record.supplier_city,
          country: record.supplier_country,
          contactName: record.supplier_contact_name,
          phone: record.supplier_phone,
          email: record.supplier_email,
          bankCode: parseInt(record.supplier_bank_code) || undefined,
          bankBranchCode:
            parseInt(record.supplier_bank_branch_code) || undefined,
          bankAccountNumber: record.supplier_bank_account_number,
          status: record.supplier_status,
          stockValue: parseFloat(record.supplier_stock_value) || undefined,
          withholdingTax:
            parseFloat(record.supplier_withholding_tax) || undefined,
        },
        create: {
          internalId: record.supplier_internal_id,
          externalId: record.supplier_external_id,
          companyName: record.supplier_company_name, // Required for new supplier
          address: record.supplier_address,
          city: record.supplier_city,
          country: record.supplier_country,
          contactName: record.supplier_contact_name,
          phone: record.supplier_phone,
          email: record.supplier_email,
          bankCode: parseInt(record.supplier_bank_code) || 0,
          bankBranchCode: parseInt(record.supplier_bank_branch_code) || 0,
          bankAccountNumber: record.supplier_bank_account_number,
          status: record.supplier_status,
          stockValue: parseFloat(record.supplier_stock_value) || 0,
          withholdingTax: parseFloat(record.supplier_withholding_tax) || 0,
        },
      });

      // בדיקת חשבונית קיימת ועדכון/יצירה
      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { invoiceId: record.invoice_id },
      });

      if (existingInvoice) {
        // עדכון חשבונית קיימת אם יש שינויים
        const updatedData: any = {};
        if (
          existingInvoice.invoiceDate.toISOString() !==
          invoiceDate.toISOString()
        )
          updatedData.invoiceDate = invoiceDate;
        if (existingInvoice.dueDate.toISOString() !== dueDate.toISOString())
          updatedData.dueDate = dueDate;
        if (existingInvoice.cost !== cost) updatedData.cost = cost;
        if (existingInvoice.currency !== record.invoice_currency)
          updatedData.currency = record.invoice_currency;
        if (existingInvoice.status !== record.invoice_status)
          updatedData.status = record.invoice_status;

        if (Object.keys(updatedData).length > 0) {
          await this.prisma.invoice.update({
            where: { invoiceId: record.invoice_id },
            data: updatedData,
          });
          updatedRecords.push(
            `Updated invoice ${record.invoice_id} with new data`,
          );
        } else {
          updatedRecords.push(`No changes for invoice ${record.invoice_id}`);
        }
      } else {
        // יצירת חשבונית חדשה
        await this.prisma.invoice.create({
          data: {
            invoiceId: record.invoice_id,
            invoiceDate,
            dueDate,
            cost,
            currency: record.invoice_currency,
            status: record.invoice_status,
            supplierId: supplier.id,
          },
        });
        updatedRecords.push(`Created invoice ${record.invoice_id}`);
      }
    }

    // זריקת שגיאה מרוכזת אם יש טעויות
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.entries(validationErrors).map(
        ([invoiceId, errors]) => {
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
        },
      );
      throw new BadRequestException(
        `Validation errors found:\n- ${errorMessages.join('\n- ')}`,
      );
    }

    return {
      message: 'CSV uploaded and processed successfully',
      details: updatedRecords,
    };
  }

  async getAggregatedData(filters: FilterParams = {}) {
    const targetCurrency = filters.currency || 'USD';
    const currentDate = new Date(); // Current date for overdue check
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
          status: { in: ['PENDING'] }, // Only PENDING invoices are overdue
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
    const targetCurrency = filters.currency || 'USD';
    const currentDate = new Date(); // Current date for overdue check
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
          status: { in: ['PENDING'] }, // Only PENDING invoices are overdue
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

  private async getOverdueTrend(baseWhereClause: any, targetCurrency: string) {
    const currentDate = new Date();
    const overdueByMonth = await this.prisma.invoice.groupBy({
      by: ['dueDate', 'currency'],
      where: {
        ...baseWhereClause,
        dueDate: { lt: currentDate },
        status: { in: ['PENDING'] }, // Only PENDING invoices are overdue
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
}
