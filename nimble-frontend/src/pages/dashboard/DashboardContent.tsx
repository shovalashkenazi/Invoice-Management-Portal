// React hooks
import { useState, useCallback, useMemo } from "react";

// Chakra UI components
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

// Third-party libraries
import Lottie from "react-lottie";

// Custom components - Charts
import CustomerTotalsHorizontalChart from "../../components/charts/CustomerTotalsHorizontalChart";
import InvoiceStatusBarChart from "../../components/charts/InvoiceStatusBarChart";
import InvoiceStatusPieChart from "../../components/charts/InvoiceStatusPieChart";
import MonthlySummaryBarChart from "../../components/charts/MonthlySummaryBarChart";
import MonthlySummaryLineChart from "../../components/charts/MonthlySummaryLineChart";
import OverdueTrendAreaChart from "../../components/charts/OverdueTrendAreaChart";
import OverdueTrendLineChart from "../../components/charts/OverdueTrendLineChart";

// Custom components - Other
import FilterBar from "../../components/filters/Filterbar";

// Custom hooks
import { useDashboardData } from "../../hooks/useDashboardData";

// Types
import { FilterState } from "../../types";

// Assets
import uploadLottie from "../../assets/animations/uplaodAnimation.json";

// === Constants ===
const CHART_HEIGHT = "400px";
const UPLOAD_API_URL = "http://localhost:3000/invoices/upload";
const MIN_ANIMATION_DURATION = 4000;

// === Main Component ===
const DashboardContent = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const toast = useToast();

  // === State ===
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

  // === Data Hook ===
  const {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    customers,
    overdueCount,
  } = useDashboardData(filters, currency, refreshTrigger);

  // === Handlers ===
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

        await new Promise((resolve) =>
          setTimeout(resolve, MIN_ANIMATION_DURATION)
        );
        setIsLoading(false);
        e.target.value = "";
        setRefreshTrigger((prev) => prev + 1);

        toast({
          title: "Upload Success",
          description: data.message || "CSV uploaded successfully!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
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

        await new Promise((resolve) =>
          setTimeout(resolve, MIN_ANIMATION_DURATION)
        );
        setIsLoading(false);
        e.target.value = "";

        toast({
          title: "Upload Error",
          description,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  // === Memoized Values ===
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

  // === Render ===
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "260px 1fr" }}
      gap={{ base: 2, md: 6 }}
      py={{ base: 2, md: 4 }}
      fontFamily={"Varela Round, sans-serif"}
    >
      {/* Sidebar */}
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

      {/* Main Content */}
      <Box position="relative">
        {/* Filter Status */}
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

        {/* Loading Overlay */}
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

        {/* Summary Cards */}
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

        {/* Invoice Status Chart */}
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
              <InvoiceStatusPieChart
                data={totalsByStatus}
                currency={currency}
              />
            ) : (
              <InvoiceStatusBarChart
                data={totalsByStatus}
                currency={currency}
              />
            )}
          </Box>

          {/* Overdue Trend Chart */}
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
              <OverdueTrendLineChart data={overdueTrend} />
            ) : (
              <OverdueTrendAreaChart data={overdueTrend} />
            )}
          </Box>
        </SimpleGrid>

        {/* Monthly and Customer Charts */}
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
              <MonthlySummaryBarChart
                data={monthlyTotals}
                currency={currency}
              />
            ) : (
              <MonthlySummaryLineChart
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
              <CustomerTotalsHorizontalChart
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
