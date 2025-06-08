import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";

interface PieData {
  status: string;
  total: number;
}

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
  data: PieData[];
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
      <Box>
        <ResponsiveContainer width={600} height={300}>
          {/* Fixed width and height for centering */}
          <PieChart>
            <Pie
              dataKey="total"
              nameKey="status"
              data={data}
              cx="50%" // Centered horizontally within the fixed width
              cy="50%" // Centered vertically within the fixed height
              outerRadius={100} // Adjusted radius for better fit
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

export default InvoiceStatusPieChart;
