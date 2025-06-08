import { useState } from "react";
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

interface FilterState {
  from: string;
  to: string;
  status: string;
  customer: string;
}

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

  const {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    customers,
    overdueCount,
    activeCustomersCount,
    loading,
  } = useDashboardData(filters, currency);

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      status: "",
      customer: "",
    });
  };

  const isFilterActive = Object.values(filters).some((value) => value !== "");

  if (loading) {
    return (
      <Flex justify="center" mt={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "260px 1fr" }} gap={6} py={4}>
      <Box>
        <FilterBar
          from={filters.from}
          to={filters.to}
          status={filters.status}
          customer={filters.customer}
          customers={customers}
          onChange={setFilters}
        />
        <Box mt={4}>
          <Select
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value as "USD" | "EUR" | "GBP")
            }
            size="sm"
            width="150px"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </Box>
      </Box>

      <Box>
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
              >
                Clear Filters
              </Button>
            </Flex>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <Box bg={cardBg} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Overdue Invoices
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
              {totalsByStatus
                .reduce((sum, item) => sum + (item.total || 0), 0)
                .toLocaleString(undefined, { style: "currency", currency })}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Amount {isFilterActive ? "(Filtered)" : ""}
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
              {isFilterActive ? "Filtered" : "Total"} with ACTIVE status
            </Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h="400px"
            minHeight="400px"
            maxHeight="400px"
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

          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h="400px"
            minHeight="400px"
            maxHeight="400px"
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
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
            h="400px"
            minHeight="400px"
            maxHeight="400px"
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
            h="400px"
            minHeight="400px"
            maxHeight="400px"
          >
            <Text fontSize="md" fontWeight="semibold" mb={"2"}>
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
