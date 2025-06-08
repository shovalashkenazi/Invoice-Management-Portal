// React hooks
import React from "react";

// Recharts components
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Chakra UI components
import { Box, Text } from "@chakra-ui/react";

// Types
import { StatusData } from "../../types";

const COLORS = ["#6B46C1", "#ED8936", "#E53E3E"];

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

const InvoiceStatusPieChart = ({
  data,
  currency,
}: {
  data: StatusData[];
  currency: string;
}) => {
  if (!data || data.length === 0)
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
    <Box
      w="100%"
      h="350px"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Box mt={9} w="100%" h="350px">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="total"
              nameKey="status"
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label={({ value }) =>
                value.toLocaleString(undefined, {
                  style: "currency",
                  currency,
                })
              }
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              verticalAlign="middle"
              align="left"
              layout="vertical"
              width={150}
              wrapperStyle={{
                paddingLeft: "10px",
                position: "absolute",
                left: 0,
                top: "40%",
                transform: "translateY(-50%)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default React.memo(InvoiceStatusPieChart, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.currency === nextProps.currency
  );
});
