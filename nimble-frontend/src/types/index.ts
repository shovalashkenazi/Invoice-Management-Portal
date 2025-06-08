export interface FilterState {
  from: string;
  to: string;
  status: string;
  customer: string;
}
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

// Chart type unions for better type safety
export type InvoiceStatusChartType = "pie" | "bar";
export type OverdueChartType = "line" | "area";
export type MonthlyChartType = "bar" | "line";
export type SupportedCurrency = "USD" | "EUR" | "GBP";
