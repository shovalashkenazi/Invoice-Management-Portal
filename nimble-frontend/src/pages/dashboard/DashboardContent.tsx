import { useState, useEffect } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  useColorModeValue,
  ButtonGroup,
  Button,
  Flex,
  Grid,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import FilterBar from "../../components/filters/Filterbar";
import InvoiceStatusPieChart from "../../components/charts/InvoiceStatusPieChart";
import InvoiceStatusBarChart from "../../components/charts/InvoiceStatusBarChart";
import OverdueTrendLineChart from "../../components/charts/OverdueTrendLineChart";
import OverdueTrendAreaChart from "../../components/charts/OverdueTrendAreaChart";
import MonthlySummaryBarChart from "../../components/charts/MonthlySummaryBarChart";
import MonthlySummaryLineChart from "../../components/charts/MonthlySummaryLineChart";
import CustomerTotalsHorizontalChart from "../../components/charts/CustomerTotalsHorizontalChart";

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

const DashboardContent = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  const [statusChartType, setStatusChartType] = useState<"pie" | "bar">("pie");
  const [overdueChartType, setOverdueChartType] = useState<"line" | "area">(
    "line"
  );
  const [monthlyChartType, setMonthlyChartType] = useState<"bar" | "line">(
    "bar"
  );

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    customer: "",
  });

  const [totalsByStatus, setTotalsByStatus] = useState<StatusData[]>([]);
  const [overdueTrend, setOverdueTrend] = useState<OverdueData[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyData[]>([]);
  const [totalsByCustomer, setTotalsByCustomer] = useState<CustomerData[]>([]);
  const [customers, setCustomers] = useState<
    { id: string; companyName: string }[]
  >([]);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [activeCustomersCount, setActiveCustomersCount] = useState<number>(0);

  console.log("Dashboard data:", {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    activeCustomersCount,
  });

  // Check if any filters are applied
  const hasFilters = Object.values(filters).some((value) => value !== "");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        let endpoint = "http://localhost:3000/invoices/aggregated";

        // Use filtered endpoint if filters are applied
        if (hasFilters) {
          const query = new URLSearchParams(
            Object.entries(filters).filter(([_, value]) => value !== "")
          ).toString();
          endpoint = `http://localhost:3000/invoices/filtered?${query}`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();

        // Transform the data to match chart component expectations
        const transformedStatusData =
          data.totalsByStatus?.map((item: any) => ({
            status: item.status,
            total: item._sum?.cost || 0,
          })) || [];

        // Transform monthly summaries data
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
            total: data.totalAmount,
            count: data.invoiceCount,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        // Transform overdue trend data
        const transformedOverdueData =
          data.overdueTrend?.map((item: any) => ({
            date: item.month,
            count: item.count || 0,
            total: item.total || 0,
          })) || [];

        // Transform customer data (when available)
        const transformedCustomerData =
          data.totalsByCustomer?.map((item: any) => ({
            name: item.supplier?.companyName || `Customer ${item.supplierId}`,
            total: item._sum?.cost || 0,
            count: item._count?.id || 0,
          })) || [];

        setTotalsByStatus(transformedStatusData);
        setOverdueCount(data.overdueInvoiceCounts || 0);
        setActiveCustomersCount(data.activeCustomersCount || 0);
        setMonthlyTotals(transformedMonthlyData);
        setOverdueTrend(transformedOverdueData);
        setTotalsByCustomer(transformedCustomerData);
        setCustomers(data.customers || []);

        if (hasFilters) {
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
  }, [filters, hasFilters]);

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      status: "",
      customer: "",
    });
  };

  if (loading) {
    return (
      <Flex justify="center" mt={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "260px 1fr" }} gap={6} py={4}>
      <FilterBar
        from={filters.from}
        to={filters.to}
        status={filters.status}
        customer={filters.customer}
        customers={customers}
        onChange={setFilters}
      />

      <Box>
        {/* Filter Status and Clear Button */}
        {hasFilters && (
          <Box
            mb={4}
            p={3}
            bg="blue.50"
            borderRadius="md"
            border="1px solid"
            borderColor="blue.200"
          >
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="blue.700">
                Filters are active - showing filtered results
              </Text>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Flex>
          </Box>
        )}

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Overdue Invoices
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="red.500">
              {overdueCount}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {hasFilters ? "Filtered" : "Total"}
            </Text>
          </Box>

          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Total Invoices
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {totalsByStatus
                .reduce((sum, item) => sum + (item.total || 0), 0)
                .toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Amount {hasFilters ? "(Filtered)" : ""}
            </Text>
          </Box>

          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Active Customers
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {activeCustomersCount}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {hasFilters ? "Filtered" : "Total"} with ACTIVE status
            </Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="lg" fontWeight="semibold">
                Total invoice amounts by status
              </Text>
              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                colorScheme="purple"
              >
                <Button
                  onClick={() => setStatusChartType("pie")}
                  isActive={statusChartType === "pie"}
                >
                  Pie
                </Button>
                <Button
                  onClick={() => setStatusChartType("bar")}
                  isActive={statusChartType === "bar"}
                >
                  Bar
                </Button>
              </ButtonGroup>
            </Flex>
            {statusChartType === "pie" ? (
              <InvoiceStatusPieChart data={totalsByStatus} />
            ) : (
              <InvoiceStatusBarChart data={totalsByStatus} />
            )}
          </Box>

          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="lg" fontWeight="semibold">
                Overdue invoices trend over time
              </Text>
              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                colorScheme="purple"
              >
                <Button
                  onClick={() => setOverdueChartType("line")}
                  isActive={overdueChartType === "line"}
                >
                  Line
                </Button>
                <Button
                  onClick={() => setOverdueChartType("area")}
                  isActive={overdueChartType === "area"}
                >
                  Area
                </Button>
              </ButtonGroup>
            </Flex>
            {overdueChartType === "line" ? (
              <OverdueTrendLineChart data={overdueTrend} />
            ) : (
              <OverdueTrendAreaChart data={overdueTrend} />
            )}
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="lg" fontWeight="semibold">
                Monthly Invoice Totals
              </Text>
              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                colorScheme="purple"
              >
                <Button
                  onClick={() => setMonthlyChartType("bar")}
                  isActive={monthlyChartType === "bar"}
                >
                  Bar
                </Button>
                <Button
                  onClick={() => setMonthlyChartType("line")}
                  isActive={monthlyChartType === "line"}
                >
                  Line
                </Button>
              </ButtonGroup>
            </Flex>
            {monthlyChartType === "bar" ? (
              <MonthlySummaryBarChart data={monthlyTotals} />
            ) : (
              <MonthlySummaryLineChart data={monthlyTotals} />
            )}
          </Box>

          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              Totals by Customer
            </Text>
            {totalsByCustomer.length > 0 ? (
              <CustomerTotalsHorizontalChart data={totalsByCustomer} />
            ) : (
              <Text color="gray.400" textAlign="center" py={8}>
                No customer data available
                {hasFilters && " for current filters"}
              </Text>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Grid>
  );
};

export default DashboardContent;
