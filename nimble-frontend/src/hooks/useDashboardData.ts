import { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";

interface StatusData {
  status: string;
  total: number;
}

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface OverdueData {
  date: string;
  count: number;
  total: number;
}

interface CustomerData {
  name: string;
  total: number;
  count: number;
}

interface FilterState {
  from: string;
  to: string;
  status: string;
  customer: string;
}

interface DashboardData {
  totalsByStatus: StatusData[];
  overdueTrend: OverdueData[];
  monthlyTotals: MonthlyData[];
  totalsByCustomer: CustomerData[];
  customers: { id: string; companyName: string }[];
  overdueCount: number;
  loading: boolean;
}

export const useDashboardData = (
  filters: FilterState,
  currency: "USD" | "EUR" | "GBP",
  refreshTrigger: number // Added to trigger re-fetch
): DashboardData => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [totalsByStatus, setTotalsByStatus] = useState<StatusData[]>([]);
  const [overdueTrend, setOverdueTrend] = useState<OverdueData[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyData[]>([]);
  const [totalsByCustomer, setTotalsByCustomer] = useState<CustomerData[]>([]);
  const [customers, setCustomers] = useState<
    { id: string; companyName: string }[]
  >([]);
  const [overdueCount, setOverdueCount] = useState<number>(0);

  const isFilterActive = Object.values(filters).some((value) => value !== "");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = "http://localhost:3000/invoices/aggregated";
        const queryParams: Record<string, string> = { currency };

        if (isFilterActive) {
          Object.entries(filters)
            .filter(([_, value]) => value !== "")
            .forEach(([key, value]) => {
              queryParams[key] = value;
            });
          endpoint = `http://localhost:3000/invoices/filtered`;
        }

        const query = new URLSearchParams(queryParams).toString();
        const res = await fetch(`${endpoint}?${query}`);
        const data = await res.json();

        // Merge totalsByStatus by status to avoid duplicates and round totals
        const statusMap = new Map<string, number>();
        data.totalsByStatus?.forEach((item: any) => {
          const currentTotal = statusMap.get(item.status) || 0;
          statusMap.set(item.status, currentTotal + (item._sum?.cost || 0));
        });
        const transformedStatusData = Array.from(statusMap.entries()).map(
          ([status, total]) => ({
            status,
            total: Number(total.toFixed(2)),
          })
        );

        const monthlyMap = new Map<
          string,
          { totalAmount: number; invoiceCount: number }
        >();
        data.monthlySummaries?.forEach((item: any) => {
          const date = new Date(item.invoiceDate);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          const current = monthlyMap.get(monthKey) || {
            totalAmount: 0,
            invoiceCount: 0,
          };
          monthlyMap.set(monthKey, {
            totalAmount: current.totalAmount + (item._sum?.cost || 0),
            invoiceCount: current.invoiceCount + (item._count?.id || 0),
          });
        });

        const transformedMonthlyData = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month,
            total: Number(data.totalAmount.toFixed(2)),
            count: data.invoiceCount,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        const transformedOverdueData =
          data.overdueTrend?.map((item: any) => ({
            date: item.month,
            count: item.count || 0,
            total: Number((item.total || 0).toFixed(2)),
          })) || [];

        const transformedCustomerData =
          data.totalsByCustomer?.map((item: any) => ({
            name: item.supplier?.companyName || `Customer ${item.supplierId}`,
            total: Number((item._sum?.cost || 0).toFixed(2)),
            count: item._count?.id || 0,
          })) || [];

        setTotalsByStatus(transformedStatusData);
        setOverdueCount(data.overdueInvoiceCounts || 0);
        setMonthlyTotals(transformedMonthlyData);
        setOverdueTrend(transformedOverdueData);
        setTotalsByCustomer(transformedCustomerData);
        setCustomers(data.customers || []);

        if (isFilterActive) {
          toast({
            title: "Filters Applied",
            description: "Dashboard updated with filtered data",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error("Failed to fetch aggregated data", err);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, currency, refreshTrigger]); // Added refreshTrigger as dependency

  return {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    customers,
    overdueCount,
    loading,
  };
};
