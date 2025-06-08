// React hooks
import { useState, useEffect, useMemo } from "react";

// Chakra UI hooks
import { useToast } from "@chakra-ui/react";

// Types
import { ApiResponse, DashboardData, FilterState } from "../types";
import { API_ENDPOINTS, TOAST_CONFIG } from "../constants";

// === Custom Hook ===
export const useDashboardData = (
  filters: FilterState,
  currency: "USD" | "EUR" | "GBP",
  refreshTrigger: number
): DashboardData => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);

  // Determine if any filters are active
  const isFilterActive = useMemo(
    () => Object.values(filters).some((value) => value !== ""),
    [filters]
  );

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = isFilterActive
          ? API_ENDPOINTS.FILTERED
          : API_ENDPOINTS.AGGREGATED;
        const queryParams: Record<string, string> = { currency };

        if (isFilterActive) {
          Object.entries(filters)
            .filter(([_, value]) => value !== "")
            .forEach(([key, value]) => {
              queryParams[key] = value;
            });
        }

        const query = new URLSearchParams(queryParams).toString();
        const res = await fetch(`${endpoint}?${query}`);
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const responseData: ApiResponse = await res.json();
        setData(responseData);

        if (isFilterActive) {
          toast(TOAST_CONFIG.FILTER_SUCCESS);
        }
      } catch (err) {
        console.error("Failed to fetch aggregated data", err);
        toast(TOAST_CONFIG.ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, currency, refreshTrigger, toast, isFilterActive]);

  // Transform totals by status
  const totalsByStatus = useMemo(() => {
    if (!data) return [];
    const statusMap = new Map<string, number>();
    data.totalsByStatus.forEach((item) => {
      const currentTotal = statusMap.get(item.status) || 0;
      statusMap.set(item.status, currentTotal + (item._sum.cost || 0));
    });
    return Array.from(statusMap.entries()).map(([status, total]) => ({
      status,
      total: Number(total.toFixed(2)),
    }));
  }, [data]);

  // Transform monthly totals
  const monthlyTotals = useMemo(() => {
    if (!data) return [];
    const monthlyMap = new Map<
      string,
      { totalAmount: number; invoiceCount: number }
    >();
    data.monthlySummaries.forEach((item) => {
      const date = new Date(item.invoiceDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const current = monthlyMap.get(monthKey) || {
        totalAmount: 0,
        invoiceCount: 0,
      };
      monthlyMap.set(monthKey, {
        totalAmount: current.totalAmount + (item._sum.cost || 0),
        invoiceCount: current.invoiceCount + (item._count.id || 0),
      });
    });
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        total: Number(data.totalAmount.toFixed(2)),
        count: data.invoiceCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // Transform overdue trend
  const overdueTrend = useMemo(() => {
    if (!data) return [];
    return (data.overdueTrend || []).map((item) => ({
      date: item.month,
      count: item.count || 0,
      total: Number((item.total || 0).toFixed(2)),
    }));
  }, [data]);

  // Transform customer totals
  const totalsByCustomer = useMemo(() => {
    if (!data) return [];
    return (data.totalsByCustomer || []).map((item) => ({
      name: item.supplier?.companyName || `Customer ${item.supplierId}`,
      total: Number((item._sum.cost || 0).toFixed(2)),
      count: item._count.id || 0,
    }));
  }, [data]);

  // Transform customers
  const customers = useMemo(() => {
    if (!data) return [];
    return data.customers || [];
  }, [data]);

  // Transform overdue count
  const overdueCount = useMemo(() => {
    if (!data) return 0;
    return data.overdueInvoiceCounts || 0;
  }, [data]);

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

export default useDashboardData;
