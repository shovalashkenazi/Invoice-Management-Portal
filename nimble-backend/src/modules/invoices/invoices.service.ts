import { Injectable } from '@nestjs/common';
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
    const content = file.buffer.toString();
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    for (const record of records) {
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
        throw new Error(
          `Invalid date format for invoice ${record.invoice_id}: ${record.invoice_date} / ${record.invoice_due_date}`,
        );
      }

      const supplier = await this.prisma.supplier.upsert({
        where: { internalId: record.supplier_internal_id },
        update: {},
        create: {
          internalId: record.supplier_internal_id,
          externalId: record.supplier_external_id,
          companyName: record.supplier_company_name,
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

      await this.prisma.invoice.upsert({
        where: { invoiceId: record.invoice_id },
        update: {},
        create: {
          invoiceId: record.invoice_id,
          invoiceDate,
          dueDate,
          cost: parseFloat(record.invoice_cost) || 0,
          currency: record.invoice_currency,
          status: record.invoice_status,
          supplierId: supplier.id,
        },
      });
    }

    return { message: 'CSV uploaded and processed successfully' };
  }

  async getAggregatedData(filters: FilterParams = {}) {
    const targetCurrency = filters.currency || 'USD';
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
        where: { dueDate: { lt: new Date() } },
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

    const activeCustomersCount = await this.prisma.supplier.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalsByStatus: transformedTotalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries: monthlySummariesByCurrency,
      totalsByCustomer,
      overdueTrend,
      customers,
      activeCustomersCount,
    };
  }

  async getFilteredData(filters: FilterParams) {
    const targetCurrency = filters.currency || 'USD';
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
        where: { ...whereClause, dueDate: { lt: new Date() } },
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

    const activeCustomersCount = await this.prisma.supplier.count({
      where: {
        status: 'ACTIVE',
        ...(filters.customer && {
          companyName: { contains: filters.customer, mode: 'insensitive' },
        }),
      },
    });

    return {
      totalsByStatus: transformedTotalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries: monthlySummariesByCurrency,
      totalsByCustomer,
      overdueTrend,
      customers,
      activeCustomersCount,
    };
  }

  private async getOverdueTrend(baseWhereClause: any, targetCurrency: string) {
    const overdueByMonth = await this.prisma.invoice.groupBy({
      by: ['dueDate', 'currency'],
      where: { ...baseWhereClause, dueDate: { lt: new Date() } },
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

  async getInvoices(
    page: number = 1,
    limit: number = 20,
    filters: FilterParams = {},
  ) {
    const targetCurrency = filters.currency || 'USD';
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

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: whereClause,
        include: {
          supplier: {
            select: { companyName: true, contactName: true, email: true },
          },
        },
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where: whereClause }),
    ]);

    const convertedInvoices = await Promise.all(
      invoices.map(async (invoice) => ({
        ...invoice,
        cost: await this.currencyService.convert(
          invoice.cost,
          invoice.currency,
          targetCurrency,
        ),
        currency: targetCurrency,
      })),
    );

    return {
      invoices: convertedInvoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
