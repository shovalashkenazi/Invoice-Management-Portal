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
import { Box, Text } from "@chakra-ui/react";

// Types
import { MonthlyData } from "../../types";

const MonthlySummaryBarChart = ({
  data,
  currency,
}: {
  data: MonthlyData[];
  currency: string;
}) => {
  // Smart data filtering for better UX
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data by month
    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

    // If too much data, show only recent 24 months
    if (sortedData.length > 24) {
      return sortedData.slice(-24);
    }

    return sortedData;
  }, [data]);

  // Custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <Box
          bg="white"
          p={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
        >
          <Text fontSize="sm" fontWeight="medium">
            {label}
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

  // Custom X-axis label formatter
  const formatXAxisLabel = (tickItem: string) => {
    const [year, month] = tickItem.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
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
        <Text color="gray.400">No monthly data available</Text>
      </Box>
    );
  }

  return (
    <Box w="100%" h="350px">
      {data.length > 24 && (
        <Text fontSize="xs" color="gray.500" mb={2} textAlign="center">
          Showing recent 24 months ({processedData.length} total)
        </Text>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedData}
          margin={{ top: 40, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={formatXAxisLabel}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.max(0, Math.floor(processedData.length / 12))}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              value.toLocaleString(undefined, { style: "currency", currency })
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="total"
            fill="#6B46C1"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(MonthlySummaryBarChart, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.currency === nextProps.currency
  );
});
