import { useState, useCallback, useMemo } from 'react';
import { Box, Button, ButtonGroup, Flex, Grid, Icon, Select, SimpleGrid, Text, useColorModeValue } from '@chakra-ui/react';
import Lottie from 'react-lottie';

// Chart Components
import CustomerTotalsHorizontalChart from '../../components/charts/CustomerTotalsHorizontalChart';
import InvoiceStatusBarChart from '../../components/charts/InvoiceStatusBarChart';
import InvoiceStatusPieChart from '../../components/charts/InvoiceStatusPieChart';
import MonthlySummaryBarChart from '../../components/charts/MonthlySummaryBarChart';
import MonthlySummaryLineChart from '../../components/charts/MonthlySummaryLineChart';
import OverdueTrendAreaChart from '../../components/charts/OverdueTrendAreaChart';
import OverdueTrendLineChart from '../../components/charts/OverdueTrendLineChart';
import { IoCloudUploadOutline } from 'react-icons/io5';

// Other Components
import FilterBar from '../../components/filters/Filterbar';

// Hooks
import { useDashboardData } from '../../hooks/useDashboardData';
import { useCsvUpload } from '../../hooks/useFileUpload';

// Types
import { FilterState, InvoiceStatusChartType, MonthlyChartType, OverdueChartType, SupportedCurrency } from '../../types';

// Assets
import uploadAnimation from '../../assets/animations/uplaodAnimation.json';

const DashboardContent = () => {
  // === Theme ===
  const cardBackgroundColor = useColorModeValue('white', 'gray.800');

  // === Chart Type State ===
  const [invoiceStatusChartType, setInvoiceStatusChartType] = useState<InvoiceStatusChartType>('pie');
  const [overdueInvoicesChartType, setOverdueInvoicesChartType] = useState<OverdueChartType>('line');
  const [monthlyTotalsChartType, setMonthlyTotalsChartType] = useState<MonthlyChartType>('bar');

  // === Filter and Currency State ===
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    from: '',
    to: '',
    status: '',
    customer: '',
  });

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');

  // === Data Management State ===
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  // === Custom Hooks ===
  const { isUploadingCsv, handleCsvFileUpload } = useCsvUpload(() => {
    setDataRefreshCounter((previousCounter) => previousCounter + 1);
  });
  const {
    totalsByStatus: invoiceTotalsByStatus,
    overdueTrend: overdueInvoicesTrend,
    monthlyTotals: monthlyInvoiceTotals,
    totalsByCustomer: invoiceTotalsByCustomer,
    customers: availableCustomers,
    overdueCount: totalOverdueInvoicesCount,
  } = useDashboardData(activeFilters, selectedCurrency, dataRefreshCounter);

  // === Event Handlers ===
  const updateActiveFilter = useCallback(<K extends keyof FilterState>(filterKey: K, filterValue: FilterState[K]) => {
    setActiveFilters((previousFilters) => ({
      ...previousFilters,
      [filterKey]: filterValue,
    }));
  }, []);

  const resetAllFilters = useCallback(() => {
    setActiveFilters({
      from: '',
      to: '',
      status: '',
      customer: '',
    });
  }, []);

  // === Computed Values ===
  const hasActiveFilters = useMemo(() => Object.values(activeFilters).some((filterValue) => filterValue !== ''), [activeFilters]);

  const formattedTotalInvoiceAmount = useMemo(
    () =>
      invoiceTotalsByStatus
        .reduce((totalSum, statusItem) => totalSum + (statusItem.total || 0), 0)
        .toLocaleString(undefined, {
          style: 'currency',
          currency: selectedCurrency,
        }),
    [invoiceTotalsByStatus, selectedCurrency],
  );

  const lottieAnimationOptions = useMemo(
    () => ({
      loop: true,
      autoplay: true,
      animationData: uploadAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    }),
    [],
  );
  // === Render ===
  return (
    <Grid templateColumns={{ base: '1fr', md: '260px 1fr' }} gap={{ base: 2, md: 6 }} py={{ base: 2, md: 4 }} fontFamily={'Varela Round, sans-serif'}>
      {/* Sidebar */}
      <Box w={{ base: '100%', md: '260px' }}>
        {/* CSV Upload Button */}
        <Box mb={4}>
          <Button
            as="label"
            w="100%"
            htmlFor="csv-file-input"
            borderRadius="xl"
            bg={cardBackgroundColor}
            size="sm"
            rightIcon={
              <Flex fontSize="sm">
                <Icon name="upload" boxSize={4} as={IoCloudUploadOutline as any} />
              </Flex>
            }
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            aria-label="Upload CSV file"
          >
            Upload CSV
          </Button>
          <input type="file" accept=".csv" id="csv-file-input" style={{ display: 'none' }} onChange={handleCsvFileUpload} aria-hidden="true" />
        </Box>

        {/* Currency Selector */}
        <Box mb={4}>
          <Select
            bg={cardBackgroundColor}
            value={selectedCurrency}
            textAlign="center"
            justifyContent="center"
            cursor="pointer"
            borderRadius="xl"
            onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
            size="sm"
            aria-label="Select currency"
          >
            <option value="USD">USD 💵</option>
            <option value="EUR">EUR 💶</option>
            <option value="GBP">GBP 💷</option>
          </Select>
        </Box>

        {/* Filter Bar */}
        <FilterBar
          from={activeFilters.from}
          to={activeFilters.to}
          status={activeFilters.status}
          customer={activeFilters.customer}
          customers={availableCustomers}
          onChange={updateActiveFilter}
        />
      </Box>

      {/* Main Dashboard Content */}
      <Box position="relative">
        {/* Active Filters Notification */}
        {hasActiveFilters && (
          <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="blue.700">
                Filters are active - showing filtered results
              </Text>
              <Button size="sm" colorScheme="blue" variant="outline" onClick={resetAllFilters} aria-label="Clear all filters">
                Clear Filters
              </Button>
            </Flex>
          </Box>
        )}

        {/* Loading Overlay */}
        {isUploadingCsv && (
          <Flex position="absolute" top="0" left="0" right="0" bottom="0" justify="center" align="center" zIndex="2000" bg="rgba(0, 0, 0, 0.4)">
            <Box w="300px" h="300px">
              <Lottie options={lottieAnimationOptions} height={300} width={300} />
            </Box>
          </Flex>
        )}

        {/* Summary Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Total Overdue Invoices
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="red.500">
              {totalOverdueInvoicesCount}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {hasActiveFilters ? 'Filtered' : 'Total'}
            </Text>
          </Box>
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm">
            <Text fontSize="sm" fontWeight="medium" color="gray.500">
              Total Invoices Amount
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {formattedTotalInvoiceAmount}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Amount {hasActiveFilters ? '(Filtered)' : ''}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Invoice Status and Overdue Trend Charts */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          {/* Invoice Status Chart */}
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm" h={'400px'} minHeight={'400px'} maxHeight={'400px'}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Invoice Totals By Status ({selectedCurrency})
              </Text>
              <ButtonGroup size="sm" isAttached variant="outline" colorScheme="purple">
                <Button onClick={() => setInvoiceStatusChartType('pie')} isActive={invoiceStatusChartType === 'pie'} aria-label="Show pie chart">
                  Pie
                </Button>
                <Button onClick={() => setInvoiceStatusChartType('bar')} isActive={invoiceStatusChartType === 'bar'} aria-label="Show bar chart">
                  Bar
                </Button>
              </ButtonGroup>
            </Flex>
            {invoiceStatusChartType === 'pie' ? (
              <InvoiceStatusPieChart data={invoiceTotalsByStatus} currency={selectedCurrency} />
            ) : (
              <InvoiceStatusBarChart data={invoiceTotalsByStatus} currency={selectedCurrency} />
            )}
          </Box>

          {/* Overdue Invoices Trend Chart */}
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm" h={'400px'} minHeight={'400px'} maxHeight={'400px'}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Overdue Invoices Trend
              </Text>
              <ButtonGroup size="sm" isAttached variant="outline" colorScheme="purple">
                <Button onClick={() => setOverdueInvoicesChartType('line')} isActive={overdueInvoicesChartType === 'line'} aria-label="Show line chart">
                  Line
                </Button>
                <Button onClick={() => setOverdueInvoicesChartType('area')} isActive={overdueInvoicesChartType === 'area'} aria-label="Show area chart">
                  Area
                </Button>
              </ButtonGroup>
            </Flex>
            {overdueInvoicesChartType === 'line' ? <OverdueTrendLineChart data={overdueInvoicesTrend} /> : <OverdueTrendAreaChart data={overdueInvoicesTrend} />}
          </Box>
        </SimpleGrid>

        {/* Monthly Totals and Customer Analysis Charts */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* Monthly Invoice Totals Chart */}
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm" h={'400px'} minHeight={'400px'} maxHeight={'400px'}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="md" fontWeight="semibold">
                Monthly Invoice Totals ({selectedCurrency})
              </Text>
              <ButtonGroup size="sm" isAttached variant="outline" colorScheme="purple">
                <Button onClick={() => setMonthlyTotalsChartType('bar')} isActive={monthlyTotalsChartType === 'bar'} aria-label="Show bar chart">
                  Bar
                </Button>
                <Button onClick={() => setMonthlyTotalsChartType('line')} isActive={monthlyTotalsChartType === 'line'} aria-label="Show line chart">
                  Line
                </Button>
              </ButtonGroup>
            </Flex>
            {monthlyTotalsChartType === 'bar' ? (
              <MonthlySummaryBarChart data={monthlyInvoiceTotals} currency={selectedCurrency} />
            ) : (
              <MonthlySummaryLineChart data={monthlyInvoiceTotals} currency={selectedCurrency} />
            )}
          </Box>

          {/* Customer Analysis Chart */}
          <Box bg={cardBackgroundColor} borderRadius="xl" p={4} boxShadow="sm" h={'400px'} minHeight={'400px'} maxHeight={'400px'}>
            <Text fontSize="md" fontWeight="semibold" mb="2">
              Invoice Totals By Customer ({selectedCurrency})
            </Text>
            {invoiceTotalsByCustomer.length > 0 ? (
              <CustomerTotalsHorizontalChart data={invoiceTotalsByCustomer} currency={selectedCurrency} />
            ) : (
              <Text color="gray.400" textAlign="center" py={8}>
                No customer data available
                {hasActiveFilters && ' for current filters'}
              </Text>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Grid>
  );
};

export default DashboardContent;
