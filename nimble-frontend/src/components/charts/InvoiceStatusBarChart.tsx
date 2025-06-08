// React hooks
import React from "react";

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
import { StatusData } from "../../types";

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: any;
  currency: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <Box bg="white" p={2} border="1px solid #ccc" borderRadius={4}>
        <Text>{`Status: ${payload[0].payload.status}`}</Text>
        <Text>{`Total: ${payload[0].value.toLocaleString(undefined, {
          style: "currency",
          currency,
        })}`}</Text>
      </Box>
    );
  }
  return null;
};

const InvoiceStatusBarChart = ({
  data,
  currency,
}: {
  data: StatusData[];
  currency: string;
}) => {
  if (!data?.length)
    return (
      <Box
        w="100%"
        h="300px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.400">No data available</Text>
      </Box>
    );

  return (
    <Box mt={9} w="100%" h="350px">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 40, right: 30, left: 80, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} height={50} />
          <YAxis
            tickFormatter={(value) =>
              value.toLocaleString(undefined, { style: "currency", currency })
            }
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="total" fill="#6B46C1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(InvoiceStatusBarChart, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.currency === nextProps.currency
  );
});
