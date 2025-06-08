import { useState, useCallback, useMemo } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  useColorModeValue,
  ButtonGroup,
  Button,
  Flex,
  Grid,
  Select,
} from "@chakra-ui/react";
import FilterBar from "../../components/filters/Filterbar";
import InvoiceStatusPieChart from "../../components/charts/InvoiceStatusPieChart";
import InvoiceStatusBarChart from "../../components/charts/InvoiceStatusBarChart";
import OverdueTrendLineChart from "../../components/charts/OverdueTrendLineChart";
import OverdueTrendAreaChart from "../../components/charts/OverdueTrendAreaChart";
import MonthlySummaryBarChart from "../../components/charts/MonthlySummaryBarChart";
import MonthlySummaryLineChart from "../../components/charts/MonthlySummaryLineChart";
import CustomerTotalsHorizontalChart from "../../components/charts/CustomerTotalsHorizontalChart";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useToast } from "@chakra-ui/react";
import Lottie from "react-lottie";
import uploadLottie from "../../assets/animations/uplaodAnimation.json";
import { memo } from "react";

interface FilterState {
  from: string;
  to: string;
  status: string;
  customer: string;
}

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

// Constants for maintainability
const CHART_HEIGHT = "400px";
const UPLOAD_API_URL = "http://localhost:3000/invoices/upload";
const MIN_ANIMATION_DURATION = 4000;

// Memoized chart components to optimize performance
const MemoizedInvoiceStatusPieChart = memo(
  ({ data, currency }: { data: StatusData[]; currency: string }) => (
    <InvoiceStatusPieChart data={data} currency={currency} />
  )
);
MemoizedInvoiceStatusPieChart.displayName = "MemoizedInvoiceStatusPieChart";

const MemoizedInvoiceStatusBarChart = memo(
  ({ data, currency }: { data: StatusData[]; currency: string }) => (
    <InvoiceStatusBarChart data={data} currency={currency} />
  )
);
MemoizedInvoiceStatusBarChart.displayName = "MemoizedInvoiceStatusBarChart";

const MemoizedOverdueTrendLineChart = memo(
  ({ data }: { data: OverdueData[] }) => <OverdueTrendLineChart data={data} />
);
MemoizedOverdueTrendLineChart.displayName = "MemoizedOverdueTrendLineChart";

const MemoizedOverdueTrendAreaChart = memo(
  ({ data }: { data: OverdueData[] }) => <OverdueTrendAreaChart data={data} />
);
MemoizedOverdueTrendAreaChart.displayName = "MemoizedOverdueTrendAreaChart";

const MemoizedMonthlySummaryBarChart = memo(
  ({ data, currency }: { data: MonthlyData[]; currency: string }) => (
    <MonthlySummaryBarChart data={data} currency={currency} />
  )
);
MemoizedMonthlySummaryBarChart.displayName = "MemoizedMonthlySummaryBarChart";

const MemoizedMonthlySummaryLineChart = memo(
  ({ data, currency }: { data: MonthlyData[]; currency: string }) => (
    <MonthlySummaryLineChart data={data} currency={currency} />
  )
);
MemoizedMonthlySummaryLineChart.displayName = "MemoizedMonthlySummaryLineChart";

const MemoizedCustomerTotalsHorizontalChart = memo(
  ({ data, currency }: { data: CustomerData[]; currency: string }) => (
    <CustomerTotalsHorizontalChart data={data} currency={currency} />
  )
);
MemoizedCustomerTotalsHorizontalChart.displayName =
  "MemoizedCustomerTotalsHorizontalChart";

const DashboardContent = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const [statusChartType, setStatusChartType] = useState<"pie" | "bar">("pie");
  const [overdueChartType, setOverdueChartType] = useState<"line" | "area">(
    "line"
  );
  const [monthlyChartType, setMonthlyChartType] = useState<"bar" | "line">(
    "bar"
  );
  const [filters, setFilters] = useState<FilterState>({
    from: "",
    to: "",
    status: "",
    customer: "",
  });
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const toast = useToast();

  const {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    customers,
    overdueCount,
  } = useDashboardData(filters, currency, refreshTrigger);

  // Generic filter update function for type safety and modularity
  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      from: "",
      to: "",
      status: "",
      customer: "",
    });
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        toast({
          title: "Upload Error",
          description: "Please select a CSV file to upload.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(UPLOAD_API_URL, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Upload failed.");
        }

        toast({
          title: "Upload Success",
          description: data.message || "CSV uploaded successfully!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        const description = message.includes("Validation errors found")
          ? message.replace(
              /Invoice (\w+): Missing or invalid fields - (.+)/,
              (_, id, fields) =>
                `Failed to upload invoice ${id} due to missing or invalid fields: ${fields}.`
            )
          : message;

        toast({
          title: "Upload Error",
          description,
          status: "error",
          duration: 7000,
          isClosable: true,
        });
      } finally {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_ANIMATION_DURATION)
        );
        setIsLoading(false);
        e.target.value = "";
      }
    },
    [toast]
  );

  const isFilterActive = useMemo(
    () => Object.values(filters).some((value) => value !== ""),
    [filters]
  );

  const totalInvoices = useMemo(
    () =>
      totalsByStatus
        .reduce((sum, item) => sum + (item.total || 0), 0)
        .toLocaleString(undefined, { style: "currency", currency }),
    [totalsByStatus, currency]
  );

  const defaultOptions = useMemo(
    () => ({
      loop: true,
      autoplay: true,
      animationData: uploadLottie,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    }),
    []
  );

  return (
    <Grid
      templateColumns={{ base: "1fr", md: "260px 1fr" }}
      gap={{ base: 2, md: 6 }}
      py={{ base: 2, md: 4 }}
      fontFamily={"Varela Round, sans-serif"}
    >
      <Box w={{ base: "100%", md: "260px" }}>
        <Box mb={4}>
          <Button
            as="label"
            w="100%"
            htmlFor="csv-upload"
            borderRadius="xl"
            bg={cardBg}
            size="sm"
            rightIcon={<Text fontSize="sm">📤</Text>}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            aria-label="Upload CSV file"
          >
            Upload CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            id="csv-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            aria-hidden="true"
          />
        </Box>
        <Box mb={4}>
          <Select
            borderRadius="xl"
            bg={cardBg}
            value={currency}
            textAlign="center"
            justifyContent="center"
            onChange={(e) =>
              setCurrency(e.target.value as "USD" | "EUR" | "GBP")
            }
            size="sm"
            aria-label="Select currency"
          >
            <option value="USD">USD 💵</option>
            <option value="EUR">EUR 💶</option>
            <option value="GBP">GBP 💷</option>
          </Select>
        </Box>

        <FilterBar
          from={filters.from}
          to={filters.to}
          status={filters.status}
          customer={filters.customer}
          customers={customers}
          onChange={updateFilter}
        />
      </Box>

      <Box position="relative">
        {isFilterActive && (
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
                aria-label="Clear all filters"
              >
                Clear Filters
              </Button>
            </Flex>
          </Box>
        )}

        {isLoading && (
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            justify="center"
            align="center"
            zIndex="2000"
            bg="rgba(0, 0, 0, 0.4)"
          >
            <Box w="300px" h="300px">
              <Lottie options={defaultOptions} height={300} width={300} />
            </Box>
          </Flex>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Total Overdue Invoices
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="red.500">
              {overdueCount}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {isFilterActive ? "Filtered" : "Total"}
            </Text>
          </Box>

          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Total Invoices
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {totalInvoices}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Amount {isFilterActive ? "(Filtered)" : ""}
            </Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h={CHART_HEIGHT}
            minHeight={CHART_HEIGHT}
            maxHeight={CHART_HEIGHT}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Total Invoice By Status ({currency})
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
                  aria-label="Show pie chart"
                >
                  Pie
                </Button>
                <Button
                  onClick={() => setStatusChartType("bar")}
                  isActive={statusChartType === "bar"}
                  aria-label="Show bar chart"
                >
                  Bar
                </Button>
              </ButtonGroup>
            </Flex>
            {statusChartType === "pie" ? (
              <MemoizedInvoiceStatusPieChart
                data={totalsByStatus}
                currency={currency}
              />
            ) : (
              <MemoizedInvoiceStatusBarChart
                data={totalsByStatus}
                currency={currency}
              />
            )}
          </Box>

          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h={CHART_HEIGHT}
            minHeight={CHART_HEIGHT}
            maxHeight={CHART_HEIGHT}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Overdue Invoices
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
                  aria-label="Show line chart"
                >
                  Line
                </Button>
                <Button
                  onClick={() => setOverdueChartType("area")}
                  isActive={overdueChartType === "area"}
                  aria-label="Show area chart"
                >
                  Area
                </Button>
              </ButtonGroup>
            </Flex>
            {overdueChartType === "line" ? (
              <MemoizedOverdueTrendLineChart data={overdueTrend} />
            ) : (
              <MemoizedOverdueTrendAreaChart data={overdueTrend} />
            )}
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h={CHART_HEIGHT}
            minHeight={CHART_HEIGHT}
            maxHeight={CHART_HEIGHT}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Monthly Invoice Totals ({currency})
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
                  aria-label="Show bar chart"
                >
                  Bar
                </Button>
                <Button
                  onClick={() => setMonthlyChartType("line")}
                  isActive={monthlyChartType === "line"}
                  aria-label="Show line chart"
                >
                  Line
                </Button>
              </ButtonGroup>
            </Flex>
            {monthlyChartType === "bar" ? (
              <MemoizedMonthlySummaryBarChart
                data={monthlyTotals}
                currency={currency}
              />
            ) : (
              <MemoizedMonthlySummaryLineChart
                data={monthlyTotals}
                currency={currency}
              />
            )}
          </Box>

          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h={CHART_HEIGHT}
            minHeight={CHART_HEIGHT}
            maxHeight={CHART_HEIGHT}
          >
            <Text fontSize="md" fontWeight="semibold" mb="2">
              Totals by Customer ({currency})
            </Text>
            {totalsByCustomer.length > 0 ? (
              <MemoizedCustomerTotalsHorizontalChart
                data={totalsByCustomer}
                currency={currency}
              />
            ) : (
              <Text color="gray.400" textAlign="center" py={8}>
                No customer data available
                {isFilterActive && " for current filters"}
              </Text>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Grid>
  );
};

export default DashboardContent;
