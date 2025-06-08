import { Injectable } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
import { PrismaService } from 'prisma/prisma.service';
import { parse as parseDate } from 'date-fns';

interface FilterParams {
  from?: string;
  to?: string;
  status?: string;
  customer?: string;
}

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

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

      // הגנה מפני תאריכים לא תקינים
      if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
        throw new Error(
          `Invalid date format for invoice ${record.invoice_id}: ${record.invoice_date} / ${record.invoice_due_date}`,
        );
      }

      console.log(
        `Processing ${record.invoice_id}: dueDate = ${dueDate}, isOverdue = ${dueDate < new Date()}`,
      );

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
          bankCode: parseInt(record.supplier_bank_code),
          bankBranchCode: parseInt(record.supplier_bank_branch_code),
          bankAccountNumber: record.supplier_bank_account_number,
          status: record.supplier_status,
          stockValue: parseFloat(record.supplier_stock_value),
          withholdingTax: parseFloat(record.supplier_withholding_tax),
        },
      });

      await this.prisma.invoice.upsert({
        where: { invoiceId: record.invoice_id },
        update: {},
        create: {
          invoiceId: record.invoice_id,
          invoiceDate,
          dueDate,
          cost: parseFloat(record.invoice_cost),
          currency: record.invoice_currency,
          status: record.invoice_status,
          supplierId: supplier.id,
        },
      });
    }

    return { message: 'CSV uploaded and processed successfully' };
  }

  // Basic aggregated data without filters
  async getAggregatedData() {
    const [
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomerRaw,
    ] = await Promise.all([
      // Get totals by status
      this.prisma.invoice.groupBy({
        by: ['status'],
        _sum: {
          cost: true,
        },
      }),

      // Get overdue invoice counts - רק לפי תאריך פירעון שעבר
      this.prisma.invoice.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
        },
      }),

      // Get monthly summaries - רק חשבונות מאושרים
      this.prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where: {
          status: 'CONFIRMED',
        },
        _sum: {
          cost: true,
        },
        _count: {
          id: true,
        },
      }),

      // Get totals by customer (basic version)
      this.prisma.invoice.groupBy({
        by: ['supplierId'],
        _sum: {
          cost: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get supplier details for customers
    const supplierIds = totalsByCustomerRaw.map((item) => item.supplierId);
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        id: {
          in: supplierIds,
        },
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    // Combine customer data with supplier details
    const totalsByCustomer = totalsByCustomerRaw.map((item) => {
      const supplier = suppliers.find((s) => s.id === item.supplierId);
      return {
        ...item,
        supplier: supplier || {
          companyName: `Unknown Supplier ${item.supplierId}`,
        },
      };
    });

    // Get overdue trend
    const overdueTrend = await this.getOverdueTrend({});

    // Get customers list
    const customers = await this.prisma.supplier.findMany({
      select: {
        id: true,
        companyName: true,
      },
      orderBy: {
        companyName: 'asc',
      },
    });

    // Get active customers count
    const activeCustomersCount = await this.prisma.supplier.count({
      where: {
        status: 'ACTIVE',
      },
    });

    return {
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomer,
      overdueTrend,
      customers,
      activeCustomersCount,
    };
  }

  // Enhanced method with filtering capabilities
  async getFilteredData(filters: FilterParams) {
    // Build where clause based on filters
    const whereClause: any = {};

    if (filters.from || filters.to) {
      whereClause.invoiceDate = {};
      if (filters.from) {
        whereClause.invoiceDate.gte = new Date(filters.from);
      }
      if (filters.to) {
        whereClause.invoiceDate.lte = new Date(filters.to);
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.customer) {
      whereClause.supplier = {
        companyName: {
          contains: filters.customer,
          mode: 'insensitive',
        },
      };
    }

    const [
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomerRaw,
    ] = await Promise.all([
      // Get totals by status with filters
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: whereClause,
        _sum: {
          cost: true,
        },
      }),

      // Get overdue invoice counts with filters
      this.prisma.invoice.count({
        where: {
          ...whereClause,
          dueDate: {
            lt: new Date(),
          },
        },
      }),

      // Get monthly summaries with filters
      this.prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where: {
          ...whereClause,
          status: 'CONFIRMED',
        },
        _sum: {
          cost: true,
        },
        _count: {
          id: true,
        },
      }),

      // Get totals by customer with filters (without include)
      this.prisma.invoice.groupBy({
        by: ['supplierId'],
        where: whereClause,
        _sum: {
          cost: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get supplier details separately
    const supplierIds = totalsByCustomerRaw.map((item) => item.supplierId);
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        id: {
          in: supplierIds,
        },
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    // Combine customer data with supplier details
    const totalsByCustomer = totalsByCustomerRaw.map((item) => {
      const supplier = suppliers.find((s) => s.id === item.supplierId);
      return {
        ...item,
        supplier: supplier || {
          companyName: `Unknown Supplier ${item.supplierId}`,
        },
      };
    });

    // Get overdue trend over time
    const overdueTrend = await this.getOverdueTrend(whereClause);

    // Get customers list for filter dropdown
    const customers = await this.prisma.supplier.findMany({
      select: {
        id: true,
        companyName: true,
      },
      orderBy: {
        companyName: 'asc',
      },
    });

    // Get active customers count (filtered)
    const activeCustomersCount = await this.prisma.supplier.count({
      where: {
        status: 'ACTIVE',
        // Add filter logic if customer filter is applied
        ...(filters.customer && {
          companyName: {
            contains: filters.customer,
            mode: 'insensitive',
          },
        }),
      },
    });

    return {
      totalsByStatus,
      overdueInvoiceCounts,
      monthlySummaries,
      totalsByCustomer,
      overdueTrend,
      customers,
      activeCustomersCount,
    };
  }

  private async getOverdueTrend(baseWhereClause: any) {
    console.log('Getting overdue trend with whereClause:', baseWhereClause);

    // Get overdue invoices grouped by month
    const overdueByMonth = await this.prisma.invoice.groupBy({
      by: ['dueDate'],
      where: {
        ...baseWhereClause,
        dueDate: {
          lt: new Date(),
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        cost: true,
      },
    });

    console.log('Raw overdue data:', overdueByMonth);

    // Process data to group by month
    const monthlyMap = new Map<string, { count: number; total: number }>();

    overdueByMonth.forEach((item) => {
      const monthKey = item.dueDate.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(monthKey) || { count: 0, total: 0 };

      monthlyMap.set(monthKey, {
        count: current.count + item._count.id,
        total: current.total + (item._sum.cost || 0),
      });
    });

    const result = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log('Processed overdue trend:', result);
    return result;
  }

  // Get all invoices with pagination and filtering
  async getInvoices(
    page: number = 1,
    limit: number = 20,
    filters: FilterParams = {},
  ) {
    const whereClause: any = {};

    if (filters.from || filters.to) {
      whereClause.invoiceDate = {};
      if (filters.from) {
        whereClause.invoiceDate.gte = new Date(filters.from);
      }
      if (filters.to) {
        whereClause.invoiceDate.lte = new Date(filters.to);
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.customer) {
      whereClause.supplier = {
        companyName: {
          contains: filters.customer,
          mode: 'insensitive',
        },
      };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: whereClause,
        include: {
          supplier: {
            select: {
              companyName: true,
              contactName: true,
              email: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where: whereClause }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
