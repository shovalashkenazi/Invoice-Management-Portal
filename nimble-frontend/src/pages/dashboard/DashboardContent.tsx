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
import { useToast, UseToastOptions } from "@chakra-ui/react";
import Lottie from "react-lottie";
import uploadLottie from "../../assets/animations/uplaodAnimation.json";

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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger re-fetch
  const toast = useToast();

  const {
    totalsByStatus,
    overdueTrend,
    monthlyTotals,
    totalsByCustomer,
    customers,
    overdueCount,
    loading: dataLoading,
  } = useDashboardData(filters, currency, refreshTrigger);

  useEffect(() => {
    // This effect can be used to handle side effects if needed, but re-fetch is handled by useDashboardData
  }, [refreshTrigger]); // Dependency on refreshTrigger

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      status: "",
      customer: "",
    });
  };

  const isFilterActive = Object.values(filters).some((value) => value !== "");

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: uploadLottie,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Upload Error",
        description: "No file selected. Please choose a CSV file to upload.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsLoading(true);

    let toastMessage: UseToastOptions | null = null;

    try {
      const res = await fetch("http://localhost:3000/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        toastMessage = {
          title: "Upload Success",
          description: result.message || "CSV uploaded successfully!",
          status: "success" as const,
          duration: 5000,
          isClosable: true,
        };
      } else {
        const error = await res.json();
        let description =
          error.message || "Upload failed due to an unknown error.";
        if (
          error.message &&
          error.message.includes("Validation errors found")
        ) {
          const match = error.message.match(
            /Invoice (\w+): Missing or invalid fields - (.+)/
          );
          if (match) {
            const invoiceId = match[1];
            const fields = match[2]
              .split(", ")
              .map((field: string) => field.trim());
            description = `Failed to upload invoice ${invoiceId} due to missing or invalid fields: ${fields.join(
              ", "
            )}.`;
          }
        }
        toastMessage = {
          title: "Upload Error",
          description: description,
          status: "error" as const,
          duration: 7000,
          isClosable: true,
        };
      }
    } catch (err) {
      toastMessage = {
        title: "Upload Error",
        description:
          "An unexpected error occurred during upload. Please try again or contact support.",
        status: "error" as const,
        duration: 7000,
        isClosable: true,
      };
      console.error(err);
    } finally {
      // Ensure animation runs for at least 4 seconds
      await new Promise((resolve) => setTimeout(resolve, 4000));
      setIsLoading(false); // Stop loading
      e.target.value = ""; // Reset input
      if (toastMessage) {
        toast(toastMessage);
      }
      // Refresh data only if upload was successful
      if (toastMessage?.status === "success") {
        setRefreshTrigger((prev) => prev + 1); // Increment to trigger re-fetch
      }
    }
  };

  return (
    <Grid templateColumns={{ base: "1fr", md: "260px 1fr" }} gap={6} py={4}>
      <Box
        h="800px"
        minHeight="800px"
        maxHeight="800px"
        position="sticky"
        top="0"
      >
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
          >
            Upload CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            id="csv-upload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
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
          >
            <option value="USD"> USD 💵</option>
            <option value="EUR"> EUR 💶</option>
            <option value="GBP"> GBP 💷</option>
          </Select>
        </Box>
        <FilterBar
          from={filters.from}
          to={filters.to}
          status={filters.status}
          customer={filters.customer}
          customers={customers}
          onChange={setFilters}
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
              {totalsByStatus
                .reduce((sum, item) => sum + (item.total || 0), 0)
                .toLocaleString(undefined, { style: "currency", currency })}
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
