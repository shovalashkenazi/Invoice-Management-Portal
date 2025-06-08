// =============================================================================
// FILTER TYPES
// =============================================================================

export interface FilterState {
  from: string;
  to: string;
  status: string;
  customer: string;
}

export interface FilterBarProps {
  from: string;
  to: string;
  status: string;
  customer: string;
  customers: CustomerOption[];
  onChange: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
}

// =============================================================================
// DATA TYPES
// =============================================================================

export interface StatusData {
  status: string;
  total: number;
}

export interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

export interface CustomerData {
  name: string;
  total: number;
  count: number;
}

export interface OverdueData {
  date: string;
  count: number;
  total: number;
}

export interface CustomerOption {
  id: string;
  companyName: string;
}

export interface DashboardData {
  totalsByStatus: StatusData[];
  overdueTrend: OverdueData[];
  monthlyTotals: MonthlyData[];
  totalsByCustomer: CustomerData[];
  customers: { id: string; companyName: string }[];
  overdueCount: number;
  loading: boolean;
}

// =============================================================================
// CHART CONFIGURATION TYPES
// =============================================================================

export type InvoiceStatusChartType = "pie" | "bar";
export type OverdueChartType = "line" | "area";
export type MonthlyChartType = "bar" | "line";

// =============================================================================
// CURRENCY TYPES
// =============================================================================

export type SupportedCurrency = "USD" | "EUR" | "GBP";

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse {
  totalsByStatus: { status: string; _sum: { cost: number } }[];
  monthlySummaries: {
    invoiceDate: string;
    _sum: { cost: number };
    _count: { id: number };
  }[];
  overdueTrend: { month: string; count: number; total: number }[];
  totalsByCustomer: {
    supplierId: string;
    supplier?: { companyName: string };
    _sum: { cost: number };
    _count: { id: number };
  }[];
  customers: { id: string; companyName: string }[];
  overdueInvoiceCounts: number;
}
