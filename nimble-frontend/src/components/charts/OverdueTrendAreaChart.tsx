import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Box, Text, Badge } from "@chakra-ui/react";

const OverdueTrendAreaChart = ({
  data,
}: {
  data: { date: string; count: number }[];
}) => {
  // Smart data processing for better readability
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data chronologically
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

    // If too much data, show only recent 18 months for overdue trends
    if (sortedData.length > 18) {
      return sortedData.slice(-18);
    }

    return sortedData;
  }, [data]);

  // Custom tooltip with better formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const count = payload[0].value;
      const formattedDate = formatDateLabel(label);

      return (
        <Box
          bg="white"
          p={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
        >
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            {formattedDate}
          </Text>
          <Text fontSize="sm" color="red.600">
            {count} overdue invoice{count !== 1 ? "s" : ""}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // Format date labels (YYYY-MM to "Jan 2024")
  const formatDateLabel = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
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
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Calculate some stats for display
  const stats = useMemo(() => {
    if (!processedData.length) return null;

    const totalOverdue = processedData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const avgOverdue = Math.round(totalOverdue / processedData.length);
    const maxOverdue = Math.max(...processedData.map((item) => item.count));

    return { totalOverdue, avgOverdue, maxOverdue };
  }, [processedData]);

  if (!data?.length)
    return (
      <Box
        w="100%"
        h="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.400">No trend data available</Text>
      </Box>
    );

  return (
    <Box w="100%" h="300px">
      {/* Stats badges */}
      <Box mb={10} display="flex" gap={2} flexWrap="wrap">
        {stats && (
          <>
            <Badge colorScheme="red" variant="subtle" fontSize="xs">
              Avg: {stats.avgOverdue}/month
            </Badge>
            <Badge colorScheme="orange" variant="subtle" fontSize="xs">
              Peak: {stats.maxOverdue}
            </Badge>
          </>
        )}
        {data.length > 18 && (
          <Badge colorScheme="gray" variant="subtle" fontSize="xs">
            Recent 18 months
          </Badge>
        )}
      </Box>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDateLabel}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.max(0, Math.floor(processedData.length / 8))}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            label={{
              value: "Overdue Count",
              angle: -90,
              // mt : -10,
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: 12, fill: "#4A5568" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#DC2626"
            strokeWidth={3}
            fill="url(#overdueGradient)"
          />
          <defs>
            <linearGradient id="overdueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.05} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default OverdueTrendAreaChart;
