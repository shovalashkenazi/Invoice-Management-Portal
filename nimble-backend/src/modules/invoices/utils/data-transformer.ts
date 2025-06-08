import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CurrencyService } from 'src/modules/currency/currency.service';

@Injectable()
export class DataTransformerService {
  constructor(
    private currencyService: CurrencyService,
    private prisma: PrismaService,
  ) {}

  async transformInvoiceData(
    totalsByStatus: any[],
    monthlySummaries: any[],
    totalsByCustomerRaw: any[],
    targetCurrency: string,
  ) {
    const convertAmount = async (amount: number, from: string) =>
      this.convertAmount(amount, from, targetCurrency);

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

  async convertAmount(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    return from === to
      ? amount
      : await this.currencyService.convert(amount, from, to);
  }

  // === Private Methods - Data Analysis ===
  async getOverdueTrend(baseWhereClause: any, targetCurrency: string) {
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

  async getCustomersList() {
    return this.prisma.supplier.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
  }
}
