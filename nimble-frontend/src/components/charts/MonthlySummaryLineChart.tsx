import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";

const MonthlySummaryLineChart = ({
  data,
  currency,
}: {
  data: { month: string; total: number }[];
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
            Total:
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

  if (!data?.length)
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

  return (
    <Box w="100%" h="350px">
      {data.length > 24 && (
        <Text fontSize="xs" color="gray.500" mb={2} textAlign="center">
          Showing recent 24 months ({processedData.length} total)
        </Text>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Line
            type="monotone"
            dataKey="total"
            stroke="#6B46C1"
            strokeWidth={3}
            dot={{ r: 3, fill: "#6B46C1" }}
            activeDot={{ r: 6, fill: "#6B46C1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default MonthlySummaryLineChart;
