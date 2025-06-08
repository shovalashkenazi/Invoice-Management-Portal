// React hooks
import React, { useMemo } from "react";

// Recharts components
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Chakra UI components
import { Badge, Box, Flex, Text } from "@chakra-ui/react";

// Types
import { CustomerData } from "../../types";

const CustomerTotalsHorizontalChart = ({
  data,
  currency,
}: {
  data: CustomerData[];
  currency: string;
}) => {
  // Smart data processing for better UX
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by total amount (highest first)
    const sortedData = [...data].sort((a, b) => b.total - a.total);

    // Limit to top 10 customers for readability
    const topCustomers = sortedData.slice(0, 10);

    // Truncate long customer names
    return topCustomers.map((customer) => ({
      ...customer,
      displayName:
        customer.name.length > 25
          ? customer.name.substring(0, 22) + "..."
          : customer.name,
      originalName: customer.name,
    }));
  }, [data]);

  // Custom tooltip with full customer name and formatted amount
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const originalData = processedData.find(
        (item) => item.displayName === label
      );

      return (
        <Box
          bg="white"
          p={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          maxW="300px"
        >
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            {originalData?.originalName || label}
          </Text>
          <Text fontSize="sm" color="purple.600">
            Total:{" "}
            {value?.toLocaleString(undefined, { style: "currency", currency })}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // Custom Y-axis tick formatter
  const formatYAxisLabel = (tickItem: string) => {
    return tickItem; // Already truncated in processedData
  };

  // Custom X-axis formatter for shorter labels
  const formatXAxisLabel = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  if (!data || data.length === 0) {
    return (
      <Box
        w="100%"
        h="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.400">No customer data available</Text>
      </Box>
    );
  }

  return (
    <Box w="100%" h="350px">
      <Flex justify="space-between" align="center" mb={2}>
        {data.length > 10 && (
          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
            Showing top 10 of {data.length} customers
          </Badge>
        )}
        {data.length <= 10 && (
          <Badge colorScheme="gray" variant="subtle" fontSize="xs">
            {data.length} customer{data.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </Flex>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={processedData}
          margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={formatXAxisLabel}
            height={40}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11 }}
            tickFormatter={formatYAxisLabel}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="total"
            fill="#6B46C1"
            radius={[0, 4, 4, 0]}
            maxBarSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(
  CustomerTotalsHorizontalChart,
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.currency === nextProps.currency
    );
  }
);
